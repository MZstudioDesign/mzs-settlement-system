/**
 * ETL Script for MZS Settlement System CSV Data Import
 *
 * This script processes CSV files exported from Excel sheets and imports them into Supabase.
 * It handles member code mapping, validation, and bulk inserts with proper error handling.
 *
 * Usage:
 * npm run etl -- --type=projects --file=projects.csv
 * npm run etl -- --type=contacts --file=contacts.csv
 * npm run etl -- --type=feed --file=feed_logs.csv
 * npm run etl -- --type=team --file=team_tasks.csv
 * npm run etl -- --type=mileage --file=mileage.csv
 * npm run etl -- --type=funds_company --file=company_funds.csv
 * npm run etl -- --type=funds_personal --file=personal_funds.csv
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync, existsSync } from 'fs'
import { format, parseISO } from 'date-fns'
import { Database } from '../src/lib/supabase/types'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// Type definitions for CSV data
interface CSVProject {
  client_name: string
  channel_name: string
  category_name?: string
  title?: string
  gross_amount: string
  discount_net?: string
  project_date: string
  payment_date?: string
  designer_assignments: string // "OY:60:10,LE:40:5" format
  notes?: string
  status?: string
}

interface CSVContact {
  member_code: string
  project_title?: string
  contact_type: string
  amount?: string
  event_date: string
  notes?: string
}

interface CSVFeedLog {
  member_code: string
  feed_type: string
  amount?: string
  event_date: string
  notes?: string
}

interface CSVTeamTask {
  member_code: string
  project_title?: string
  task_date: string
  description: string
  amount: string
  notes?: string
}

interface CSVMileage {
  member_code: string
  event_date: string
  reason: string
  points: string
  amount: string
  consumed_now: string
  notes?: string
}

interface CSVFundsCompany {
  expense_date: string
  item_name: string
  amount: string
  description?: string
}

interface CSVFundsPersonal {
  member_code: string
  expense_date: string
  item_name: string
  amount: string
  description?: string
}

// Mapping caches
const memberCodeMap = new Map<string, string>()
const channelNameMap = new Map<string, string>()
const categoryNameMap = new Map<string, string>()
const projectTitleMap = new Map<string, string>()

/**
 * Load mapping data from database
 */
async function loadMappings(): Promise<void> {
  console.log('📥 Loading mapping data from database...')

  // Load members
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, code')

  if (membersError) {
    throw new Error(`Failed to load members: ${membersError.message}`)
  }

  members?.forEach(member => {
    memberCodeMap.set(member.code, member.id)
  })

  // Load channels
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('id, name')

  if (channelsError) {
    throw new Error(`Failed to load channels: ${channelsError.message}`)
  }

  channels?.forEach(channel => {
    channelNameMap.set(channel.name, channel.id)
  })

  // Load categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')

  if (categoriesError) {
    throw new Error(`Failed to load categories: ${categoriesError.message}`)
  }

  categories?.forEach(category => {
    categoryNameMap.set(category.name, category.id)
  })

  // Load projects for title mapping
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')

  if (projectsError) {
    throw new Error(`Failed to load projects: ${projectsError.message}`)
  }

  projects?.forEach(project => {
    projectTitleMap.set(project.name, project.id)
  })

  console.log(`✅ Loaded ${memberCodeMap.size} members, ${channelNameMap.size} channels, ${categoryNameMap.size} categories, ${projectTitleMap.size} projects`)
}

/**
 * Parse CSV file
 */
function parseCSV<T>(filePath: string): T[] {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const csvContent = readFileSync(filePath, 'utf-8')
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  })
}

/**
 * Parse designer assignments from string format "OY:60:10,LE:40:5"
 */
function parseDesignerAssignments(assignmentStr: string): any[] {
  if (!assignmentStr) return []

  return assignmentStr.split(',').map(assignment => {
    const [memberCode, percentStr, bonusPctStr] = assignment.split(':')
    const memberId = memberCodeMap.get(memberCode.trim())

    if (!memberId) {
      throw new Error(`Unknown member code: ${memberCode}`)
    }

    return {
      member_id: memberId,
      percent: parseInt(percentStr.trim()),
      bonus_pct: parseFloat(bonusPctStr?.trim() || '0')
    }
  })
}

/**
 * Convert date string to ISO format
 */
function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]

  // Try parsing different date formats
  try {
    const date = parseISO(dateStr)
    return format(date, 'yyyy-MM-dd')
  } catch {
    // Fallback for different formats
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`)
    }
    return format(date, 'yyyy-MM-dd')
  }
}

/**
 * Convert amount string to integer (assumes KRW)
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0
  return parseInt(amountStr.replace(/[^\d]/g, ''))
}

/**
 * Import projects from CSV
 */
async function importProjects(filePath: string): Promise<void> {
  console.log('📊 Importing projects...')

  const csvData: CSVProject[] = parseCSV(filePath)
  const projects: any[] = []

  for (const row of csvData) {
    try {
      const channelId = channelNameMap.get(row.channel_name)
      if (!channelId) {
        throw new Error(`Unknown channel: ${row.channel_name}`)
      }

      const categoryId = row.category_name ? categoryNameMap.get(row.category_name) : null
      const designers = parseDesignerAssignments(row.designer_assignments)

      projects.push({
        name: row.title || row.client_name,
        channel_id: channelId,
        category_id: categoryId,
        gross_amount: parseAmount(row.gross_amount),
        discount_net: parseAmount(row.discount_net || '0'),
        designers: JSON.stringify(designers),
        status: (row.status as any) || 'COMPLETED',
        project_date: parseDate(row.project_date),
        payment_date: row.payment_date ? parseDate(row.payment_date) : null,
        notes: row.notes
      })
    } catch (error) {
      console.error(`❌ Error processing project row:`, row, error)
      throw error
    }
  }

  const { error } = await supabase.from('projects').insert(projects)
  if (error) {
    throw new Error(`Failed to insert projects: ${error.message}`)
  }

  console.log(`✅ Imported ${projects.length} projects`)
}

/**
 * Import contacts from CSV
 */
async function importContacts(filePath: string): Promise<void> {
  console.log('📞 Importing contacts...')

  const csvData: CSVContact[] = parseCSV(filePath)
  const contacts: any[] = []

  for (const row of csvData) {
    try {
      const memberId = memberCodeMap.get(row.member_code)
      if (!memberId) {
        throw new Error(`Unknown member code: ${row.member_code}`)
      }

      const projectId = row.project_title ? projectTitleMap.get(row.project_title) : null

      contacts.push({
        member_id: memberId,
        project_id: projectId,
        contact_type: row.contact_type as any,
        amount: parseAmount(row.amount || '0'),
        event_date: parseDate(row.event_date),
        notes: row.notes
      })
    } catch (error) {
      console.error(`❌ Error processing contact row:`, row, error)
      throw error
    }
  }

  const { error } = await supabase.from('contacts').insert(contacts)
  if (error) {
    throw new Error(`Failed to insert contacts: ${error.message}`)
  }

  console.log(`✅ Imported ${contacts.length} contacts`)
}

/**
 * Import feed logs from CSV
 */
async function importFeedLogs(filePath: string): Promise<void> {
  console.log('📱 Importing feed logs...')

  const csvData: CSVFeedLog[] = parseCSV(filePath)
  const feedLogs: any[] = []

  for (const row of csvData) {
    try {
      const memberId = memberCodeMap.get(row.member_code)
      if (!memberId) {
        throw new Error(`Unknown member code: ${row.member_code}`)
      }

      feedLogs.push({
        member_id: memberId,
        feed_type: row.feed_type as any,
        amount: parseAmount(row.amount || '0'),
        event_date: parseDate(row.event_date),
        notes: row.notes
      })
    } catch (error) {
      console.error(`❌ Error processing feed log row:`, row, error)
      throw error
    }
  }

  const { error } = await supabase.from('feed_logs').insert(feedLogs)
  if (error) {
    throw new Error(`Failed to insert feed logs: ${error.message}`)
  }

  console.log(`✅ Imported ${feedLogs.length} feed logs`)
}

/**
 * Import team tasks from CSV
 */
async function importTeamTasks(filePath: string): Promise<void> {
  console.log('👥 Importing team tasks...')

  const csvData: CSVTeamTask[] = parseCSV(filePath)
  const teamTasks: any[] = []

  for (const row of csvData) {
    try {
      const memberId = memberCodeMap.get(row.member_code)
      if (!memberId) {
        throw new Error(`Unknown member code: ${row.member_code}`)
      }

      const projectId = row.project_title ? projectTitleMap.get(row.project_title) : null

      teamTasks.push({
        member_id: memberId,
        project_id: projectId,
        task_date: parseDate(row.task_date),
        description: row.description,
        amount: parseAmount(row.amount),
        notes: row.notes
      })
    } catch (error) {
      console.error(`❌ Error processing team task row:`, row, error)
      throw error
    }
  }

  const { error } = await supabase.from('team_tasks').insert(teamTasks)
  if (error) {
    throw new Error(`Failed to insert team tasks: ${error.message}`)
  }

  console.log(`✅ Imported ${teamTasks.length} team tasks`)
}

/**
 * Import mileage from CSV
 */
async function importMileage(filePath: string): Promise<void> {
  console.log('🎯 Importing mileage...')

  const csvData: CSVMileage[] = parseCSV(filePath)
  const mileage: any[] = []

  for (const row of csvData) {
    try {
      const memberId = memberCodeMap.get(row.member_code)
      if (!memberId) {
        throw new Error(`Unknown member code: ${row.member_code}`)
      }

      mileage.push({
        member_id: memberId,
        event_date: parseDate(row.event_date),
        reason: row.reason,
        points: parseInt(row.points),
        amount: parseAmount(row.amount),
        consumed_now: row.consumed_now.toLowerCase() === 'true',
        notes: row.notes
      })
    } catch (error) {
      console.error(`❌ Error processing mileage row:`, row, error)
      throw error
    }
  }

  const { error } = await supabase.from('mileage').insert(mileage)
  if (error) {
    throw new Error(`Failed to insert mileage: ${error.message}`)
  }

  console.log(`✅ Imported ${mileage.length} mileage records`)
}

/**
 * Import company funds from CSV
 */
async function importFundsCompany(filePath: string): Promise<void> {
  console.log('🏢 Importing company funds...')

  const csvData: CSVFundsCompany[] = parseCSV(filePath)
  const funds: any[] = []

  for (const row of csvData) {
    try {
      funds.push({
        expense_date: parseDate(row.expense_date),
        item_name: row.item_name,
        amount: parseAmount(row.amount),
        description: row.description,
        receipt_files: []
      })
    } catch (error) {
      console.error(`❌ Error processing company funds row:`, row, error)
      throw error
    }
  }

  const { error } = await supabase.from('funds_company').insert(funds)
  if (error) {
    throw new Error(`Failed to insert company funds: ${error.message}`)
  }

  console.log(`✅ Imported ${funds.length} company funds records`)
}

/**
 * Import personal funds from CSV
 */
async function importFundsPersonal(filePath: string): Promise<void> {
  console.log('👤 Importing personal funds...')

  const csvData: CSVFundsPersonal[] = parseCSV(filePath)
  const funds: any[] = []

  for (const row of csvData) {
    try {
      const memberId = memberCodeMap.get(row.member_code)
      if (!memberId) {
        throw new Error(`Unknown member code: ${row.member_code}`)
      }

      funds.push({
        member_id: memberId,
        expense_date: parseDate(row.expense_date),
        item_name: row.item_name,
        amount: parseAmount(row.amount),
        description: row.description,
        receipt_files: []
      })
    } catch (error) {
      console.error(`❌ Error processing personal funds row:`, row, error)
      throw error
    }
  }

  const { error } = await supabase.from('funds_personal').insert(funds)
  if (error) {
    throw new Error(`Failed to insert personal funds: ${error.message}`)
  }

  console.log(`✅ Imported ${funds.length} personal funds records`)
}

/**
 * Main ETL function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const typeArg = args.find(arg => arg.startsWith('--type='))
  const fileArg = args.find(arg => arg.startsWith('--file='))

  if (!typeArg || !fileArg) {
    console.error('❌ Usage: npm run etl -- --type=<type> --file=<file>')
    console.error('Types: projects, contacts, feed, team, mileage, funds_company, funds_personal')
    process.exit(1)
  }

  const type = typeArg.split('=')[1]
  const filePath = fileArg.split('=')[1]

  console.log(`🚀 Starting ETL process for ${type} from ${filePath}`)

  try {
    await loadMappings()

    switch (type) {
      case 'projects':
        await importProjects(filePath)
        break
      case 'contacts':
        await importContacts(filePath)
        break
      case 'feed':
        await importFeedLogs(filePath)
        break
      case 'team':
        await importTeamTasks(filePath)
        break
      case 'mileage':
        await importMileage(filePath)
        break
      case 'funds_company':
        await importFundsCompany(filePath)
        break
      case 'funds_personal':
        await importFundsPersonal(filePath)
        break
      default:
        throw new Error(`Unknown import type: ${type}`)
    }

    console.log('🎉 ETL process completed successfully!')

  } catch (error) {
    console.error('💥 ETL process failed:', error)
    process.exit(1)
  }
}

// Run main function
main()