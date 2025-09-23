/**
 * Settlement Generation Script for MZS Settlement System
 *
 * This script generates monthly settlements by:
 * 1. Collecting all settlement sources (projects, contacts, feeds, team tasks, mileage)
 * 2. Calculating settlement amounts using the settlement formula
 * 3. Creating immutable snapshots for historical data integrity
 * 4. Applying 3.3% withholding tax to all individual payments
 *
 * Usage:
 * npm run generate-settlement -- --month=2024-09
 * npm run generate-settlement -- --month=2024-09 --force
 */

import { createClient } from '@supabase/supabase-js'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { Database } from '../src/lib/supabase/types'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface SettlementSource {
  type: 'PROJECT' | 'CONTACT' | 'FEED' | 'TEAM_TASK' | 'MILEAGE'
  id: string
  memberId: string
  amount: number
  data: any
}

interface SettlementCalculationResult {
  gross_t: number
  net_b: number
  discount_net: number
  base_amount: number
  designer_amount: number
  bonus_amount: number
  before_withholding: number
  withholding_tax: number
  after_withholding: number
}

/**
 * Get application settings for settlement calculation
 */
async function getAppSettings(): Promise<Record<string, any>> {
  const { data: settings, error } = await supabase
    .from('app_settings')
    .select('key, value')

  if (error) {
    throw new Error(`Failed to load app settings: ${error.message}`)
  }

  const settingsMap: Record<string, any> = {}
  settings?.forEach(setting => {
    settingsMap[setting.key] = setting.value
  })

  return settingsMap
}

/**
 * Calculate settlement amount using Supabase function
 */
async function calculateSettlementAmount(
  grossAmount: number,
  discountNet: number = 0,
  designerPercent: number = 100,
  bonusPct: number = 0
): Promise<SettlementCalculationResult> {
  const { data, error } = await supabase.rpc('calculate_settlement_amount', {
    gross_amount_param: grossAmount,
    discount_net_param: discountNet,
    designer_percent_param: designerPercent,
    bonus_pct_param: bonusPct
  })

  if (error) {
    throw new Error(`Settlement calculation failed: ${error.message}`)
  }

  return data[0] as SettlementCalculationResult
}

/**
 * Get all settlement sources for a given month
 */
async function getSettlementSources(monthStart: Date, monthEnd: Date): Promise<SettlementSource[]> {
  const sources: SettlementSource[] = []

  // Get completed projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(`
      id, name, gross_amount, discount_net, designers,
      channel_id, category_id, project_date, payment_date,
      channels(name, fee_rate),
      categories(name)
    `)
    .eq('status', 'COMPLETED')
    .gte('payment_date', format(monthStart, 'yyyy-MM-dd'))
    .lte('payment_date', format(monthEnd, 'yyyy-MM-dd'))

  if (projectsError) {
    throw new Error(`Failed to load projects: ${projectsError.message}`)
  }

  // Process projects and split by designers
  for (const project of projects || []) {
    const designers = JSON.parse(project.designers as string) as Array<{
      member_id: string
      percent: number
      bonus_pct: number
    }>

    for (const designer of designers) {
      sources.push({
        type: 'PROJECT',
        id: project.id,
        memberId: designer.member_id,
        amount: 0, // Will be calculated
        data: {
          ...project,
          designer_percent: designer.percent,
          bonus_pct: designer.bonus_pct
        }
      })
    }
  }

  // Get contacts
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('*')
    .gte('event_date', format(monthStart, 'yyyy-MM-dd'))
    .lte('event_date', format(monthEnd, 'yyyy-MM-dd'))

  if (contactsError) {
    throw new Error(`Failed to load contacts: ${contactsError.message}`)
  }

  for (const contact of contacts || []) {
    sources.push({
      type: 'CONTACT',
      id: contact.id,
      memberId: contact.member_id,
      amount: contact.amount,
      data: contact
    })
  }

  // Get feed logs
  const { data: feedLogs, error: feedLogsError } = await supabase
    .from('feed_logs')
    .select('*')
    .gte('event_date', format(monthStart, 'yyyy-MM-dd'))
    .lte('event_date', format(monthEnd, 'yyyy-MM-dd'))

  if (feedLogsError) {
    throw new Error(`Failed to load feed logs: ${feedLogsError.message}`)
  }

  for (const feedLog of feedLogs || []) {
    sources.push({
      type: 'FEED',
      id: feedLog.id,
      memberId: feedLog.member_id,
      amount: feedLog.amount,
      data: feedLog
    })
  }

  // Get team tasks
  const { data: teamTasks, error: teamTasksError } = await supabase
    .from('team_tasks')
    .select('*')
    .gte('task_date', format(monthStart, 'yyyy-MM-dd'))
    .lte('task_date', format(monthEnd, 'yyyy-MM-dd'))

  if (teamTasksError) {
    throw new Error(`Failed to load team tasks: ${teamTasksError.message}`)
  }

  for (const teamTask of teamTasks || []) {
    sources.push({
      type: 'TEAM_TASK',
      id: teamTask.id,
      memberId: teamTask.member_id,
      amount: teamTask.amount,
      data: teamTask
    })
  }

  // Get mileage with consumed_now = true
  const { data: mileage, error: mileageError } = await supabase
    .from('mileage')
    .select('*')
    .eq('consumed_now', true)
    .gte('event_date', format(monthStart, 'yyyy-MM-dd'))
    .lte('event_date', format(monthEnd, 'yyyy-MM-dd'))

  if (mileageError) {
    throw new Error(`Failed to load mileage: ${mileageError.message}`)
  }

  for (const mileageItem of mileage || []) {
    sources.push({
      type: 'MILEAGE',
      id: mileageItem.id,
      memberId: mileageItem.member_id,
      amount: mileageItem.amount,
      data: mileageItem
    })
  }

  return sources
}

/**
 * Create settlement for a specific month
 */
async function createSettlement(monthStr: string, force: boolean = false): Promise<void> {
  const monthDate = parseISO(`${monthStr}-01`)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)

  console.log(`📅 Creating settlement for ${monthStr}`)
  console.log(`📊 Period: ${format(monthStart, 'yyyy-MM-dd')} to ${format(monthEnd, 'yyyy-MM-dd')}`)

  // Check if settlement already exists
  const { data: existingSettlement, error: existingError } = await supabase
    .from('settlements')
    .select('id, status')
    .eq('month', format(monthDate, 'yyyy-MM-dd'))
    .single()

  if (existingError && existingError.code !== 'PGRST116') {
    throw new Error(`Failed to check existing settlement: ${existingError.message}`)
  }

  if (existingSettlement) {
    if (existingSettlement.status === 'LOCKED') {
      console.log('🔒 Settlement is locked and cannot be modified')
      return
    }

    if (!force) {
      console.log('⚠️  Settlement already exists. Use --force to recreate')
      return
    }

    // Delete existing settlement items
    const { error: deleteError } = await supabase
      .from('settlement_items')
      .delete()
      .eq('settlement_id', existingSettlement.id)

    if (deleteError) {
      throw new Error(`Failed to delete existing settlement items: ${deleteError.message}`)
    }

    console.log('🗑️  Deleted existing settlement items')
  }

  // Get app settings
  const settings = await getAppSettings()

  // Get settlement sources
  const sources = await getSettlementSources(monthStart, monthEnd)
  console.log(`📋 Found ${sources.length} settlement sources`)

  if (sources.length === 0) {
    console.log('ℹ️  No settlement sources found for this month')
    return
  }

  // Create or get settlement record
  let settlementId: string

  if (existingSettlement) {
    settlementId = existingSettlement.id
  } else {
    const { data: newSettlement, error: settlementError } = await supabase
      .from('settlements')
      .insert({
        month: format(monthDate, 'yyyy-MM-dd'),
        status: 'DRAFT',
        notes: `Generated settlement for ${monthStr}`
      })
      .select('id')
      .single()

    if (settlementError) {
      throw new Error(`Failed to create settlement: ${settlementError.message}`)
    }

    settlementId = newSettlement.id
  }

  // Process each source and create settlement items
  const settlementItems: any[] = []

  for (const source of sources) {
    try {
      let calculation: SettlementCalculationResult

      if (source.type === 'PROJECT') {
        calculation = await calculateSettlementAmount(
          source.data.gross_amount,
          source.data.discount_net,
          source.data.designer_percent,
          source.data.bonus_pct
        )
      } else {
        // For non-project sources, use simple calculation
        const beforeWithholding = source.amount
        const withholdingTax = Math.round(beforeWithholding * 0.033)
        const afterWithholding = beforeWithholding - withholdingTax

        calculation = {
          gross_t: source.amount,
          net_b: source.amount,
          discount_net: 0,
          base_amount: source.amount,
          designer_amount: source.amount,
          bonus_amount: 0,
          before_withholding: beforeWithholding,
          withholding_tax: withholdingTax,
          after_withholding: afterWithholding
        }
      }

      settlementItems.push({
        settlement_id: settlementId,
        member_id: source.memberId,
        source_type: source.type,
        source_id: source.id,
        gross_amount: calculation.gross_t,
        net_amount: calculation.net_b,
        base_amount: calculation.base_amount,
        designer_amount: calculation.designer_amount,
        bonus_amount: calculation.bonus_amount,
        before_withholding: calculation.before_withholding,
        withholding_tax: calculation.withholding_tax,
        after_withholding: calculation.after_withholding,
        is_paid: false
      })

    } catch (error) {
      console.error(`❌ Error processing source ${source.type}:${source.id}:`, error)
      throw error
    }
  }

  // Insert settlement items
  const { error: itemsError } = await supabase
    .from('settlement_items')
    .insert(settlementItems)

  if (itemsError) {
    throw new Error(`Failed to insert settlement items: ${itemsError.message}`)
  }

  console.log(`✅ Created ${settlementItems.length} settlement items`)

  // Generate summary
  const memberSummary = new Map<string, { name: string, beforeWithholding: number, afterWithholding: number }>()

  // Get member names
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name')

  if (membersError) {
    throw new Error(`Failed to load members: ${membersError.message}`)
  }

  const memberNames = new Map(members?.map(m => [m.id, m.name]) || [])

  for (const item of settlementItems) {
    const memberName = memberNames.get(item.member_id) || 'Unknown'
    const existing = memberSummary.get(item.member_id) || { name: memberName, beforeWithholding: 0, afterWithholding: 0 }
    existing.beforeWithholding += item.before_withholding
    existing.afterWithholding += item.after_withholding
    memberSummary.set(item.member_id, existing)
  }

  console.log('\n📊 Settlement Summary:')
  console.log('='.repeat(60))

  let totalBeforeWithholding = 0
  let totalAfterWithholding = 0

  for (const [memberId, summary] of memberSummary) {
    totalBeforeWithholding += summary.beforeWithholding
    totalAfterWithholding += summary.afterWithholding
    console.log(`${summary.name.padEnd(20)} | Before: ${summary.beforeWithholding.toLocaleString()}원 | After: ${summary.afterWithholding.toLocaleString()}원`)
  }

  console.log('='.repeat(60))
  console.log(`${'TOTAL'.padEnd(20)} | Before: ${totalBeforeWithholding.toLocaleString()}원 | After: ${totalAfterWithholding.toLocaleString()}원`)
  console.log(`${'WITHHOLDING TAX'.padEnd(20)} | ${(totalBeforeWithholding - totalAfterWithholding).toLocaleString()}원`)

  console.log(`\n🎉 Settlement ${monthStr} created successfully!`)
  console.log(`Settlement ID: ${settlementId}`)
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const monthArg = args.find(arg => arg.startsWith('--month='))
  const forceFlag = args.includes('--force')

  if (!monthArg) {
    console.error('❌ Usage: npm run generate-settlement -- --month=YYYY-MM [--force]')
    console.error('Example: npm run generate-settlement -- --month=2024-09')
    process.exit(1)
  }

  const month = monthArg.split('=')[1]

  if (!/^\d{4}-\d{2}$/.test(month)) {
    console.error('❌ Invalid month format. Use YYYY-MM (e.g., 2024-09)')
    process.exit(1)
  }

  console.log(`🚀 Starting settlement generation for ${month}`)

  try {
    await createSettlement(month, forceFlag)
  } catch (error) {
    console.error('💥 Settlement generation failed:', error)
    process.exit(1)
  }
}

// Run main function
main()