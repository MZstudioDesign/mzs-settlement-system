/**
 * Enhanced ETL Script for MZS Settlement System Excel Data Import
 *
 * This script processes Excel files directly with Korean text support and detailed column mappings.
 * It handles member code mapping, validation, and bulk inserts with comprehensive error handling.
 *
 * Usage:
 * npm run excel-etl -- --sheet=settlements --preview
 * npm run excel-etl -- --sheet=contacts --execute
 * npm run excel-etl -- --all --execute
 */

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { readFileSync, existsSync } from 'fs'
import { format, parse } from 'date-fns'
import { Database } from '../src/lib/supabase/types'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') })

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Load detailed column mappings
const mappingsPath = path.join(__dirname, '../../detailed_column_mappings.json')
const detailedMappings = JSON.parse(readFileSync(mappingsPath, 'utf-8'))

// Cache for database lookups
const lookupCache = {
  members: new Map<string, string>(),
  channels: new Map<string, string>(),
  categories: new Map<string, string>(),
  projects: new Map<string, string>()
}

/**
 * Load all mapping data from database
 */
async function loadDatabaseMappings(): Promise<void> {
  console.log('📥 Loading database mappings...')

  try {
    // Load members with both name and code mapping
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, code, active')

    if (membersError) throw new Error(`Failed to load members: ${membersError.message}`)

    members?.forEach(member => {
      lookupCache.members.set(member.code, member.id)
      lookupCache.members.set(member.name, member.id)
    })

    // Load channels
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, name')

    if (channelsError) throw new Error(`Failed to load channels: ${channelsError.message}`)

    channels?.forEach(channel => {
      lookupCache.channels.set(channel.name, channel.id)
      // Add number mappings: 1=크몽, 2=계좌입금
      if (channel.name === '크몽') lookupCache.channels.set('1', channel.id)
      if (channel.name === '계좌입금') lookupCache.channels.set('2', channel.id)
    })

    // Load categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')

    if (categoriesError) throw new Error(`Failed to load categories: ${categoriesError.message}`)

    categories?.forEach(category => {
      lookupCache.categories.set(category.name, category.id)
    })

    // Add category number and name mappings
    const categoryMappings = {
      '1': '카드뉴스',
      '2': '포스터',
      '3': '현수막/배너',
      '4': '메뉴판',
      '5': '블로그스킨'
    }

    // Add Korean name variations and common alternate spellings
    const koreanCategoryMappings = {
      '카드뉴스': '카드뉴스',
      '포스터': '포스터',
      '현수막/배너': '현수막/배너',
      '현수막': '현수막/배너',
      '배너': '현수막/배너',
      '메뉴판': '메뉴판',
      '메뉴': '메뉴판',
      '블로그스킨': '블로그스킨',
      '블로그': '블로그스킨',
      '스킨': '블로그스킨',
      // Add more variations that might appear in Excel data
      '카드': '카드뉴스',
      '뉴스': '카드뉴스',
      '카드 뉴스': '카드뉴스',
      '포스터 디자인': '포스터',
      '현수막 디자인': '현수막/배너',
      '배너 디자인': '현수막/배너',
      '메뉴 디자인': '메뉴판',
      '메뉴판 디자인': '메뉴판',
      '블로그 스킨': '블로그스킨',
      '블로그 디자인': '블로그스킨'
    }

    // Map numbers to category names
    Object.entries(categoryMappings).forEach(([num, name]) => {
      const categoryId = lookupCache.categories.get(name)
      if (categoryId) {
        lookupCache.categories.set(num, categoryId)
      }
    })

    // Map Korean variations to category IDs
    Object.entries(koreanCategoryMappings).forEach(([variation, standardName]) => {
      const categoryId = lookupCache.categories.get(standardName)
      if (categoryId) {
        lookupCache.categories.set(variation, categoryId)
        // Also add lowercased versions
        lookupCache.categories.set(variation.toLowerCase(), categoryId)
      }
    })

    // Load existing projects for title mapping
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')

    if (projectsError) throw new Error(`Failed to load projects: ${projectsError.message}`)

    projects?.forEach(project => {
      lookupCache.projects.set(project.name, project.id)
    })

    console.log(`✅ Loaded mappings: ${lookupCache.members.size/2} members, ${lookupCache.channels.size} channels, ${lookupCache.categories.size} categories`)

  } catch (error) {
    console.error('❌ Failed to load database mappings:', error)
    throw error
  }
}

/**
 * Read Excel file with proper Korean text handling
 */
function readExcelFile(filePath: string): XLSX.WorkBook {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const buffer = readFileSync(filePath)
  return XLSX.read(buffer, {
    type: 'buffer',
    cellText: false,
    cellDates: true,
    raw: false
  })
}

/**
 * Convert YYMMDD string to ISO date
 */
function convertYYMMDDToDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 6) {
    return new Date().toISOString().split('T')[0]
  }

  try {
    const year = 2000 + parseInt(dateStr.substring(0, 2))
    const month = parseInt(dateStr.substring(2, 4))
    const day = parseInt(dateStr.substring(4, 6))

    return format(new Date(year, month - 1, day), 'yyyy-MM-dd')
  } catch {
    console.warn(`⚠️ Invalid date format: ${dateStr}`)
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Parse amount string to integer
 */
function parseAmount(amountStr: string | number): number {
  if (typeof amountStr === 'number') return Math.floor(amountStr)
  if (!amountStr) return 0

  const cleanStr = String(amountStr).replace(/[^\d-]/g, '')
  return parseInt(cleanStr) || 0
}

/**
 * Extract sheet data based on mapping configuration
 */
function extractSheetData(workbook: XLSX.WorkBook, sheetConfig: any): any[] {
  const worksheet = workbook.Sheets[sheetConfig.korean_name]
  if (!worksheet) {
    throw new Error(`Sheet not found: ${sheetConfig.korean_name}`)
  }

  const rawData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false
  }) as any[][]

  const headerRow = sheetConfig.header_row || 1
  const dataRows = rawData.slice(headerRow)

  const extractedData: any[] = []

  for (const row of dataRows) {
    // Skip completely empty rows
    if (row.every(cell => !cell)) continue

    const record: any = {}
    let hasData = false

    // Process each column mapping
    Object.entries(sheetConfig.column_mappings).forEach(([colLetter, mapping]: [string, any]) => {
      const colIndex = XLSX.utils.decode_col(colLetter)
      const cellValue = row[colIndex]

      if (cellValue !== undefined && cellValue !== '') {
        record[mapping.db_column] = cellValue
        hasData = true
      }
    })

    if (hasData) {
      extractedData.push(record)
    }
  }

  console.log(`📊 Extracted ${extractedData.length} records from ${sheetConfig.korean_name}`)
  return extractedData
}

/**
 * Transform and validate settlements data
 */
function transformSettlementsData(records: any[]): any[] {
  return records.map((record, index) => {
    try {
      const transformed: any = {
        client_name: record.client_name || `Unknown_${index}`,
        name: record.title || record.client_name || `Project_${index}`,
        project_date: record.project_date ? convertYYMMDDToDate(record.project_date) : new Date().toISOString().split('T')[0],
        list_price_net: parseAmount(record.list_price_net),
        discount_net: parseAmount(record.discount_net) || 0,
        status: record.status === '1' ? 'COMPLETED' : 'PENDING',
        notes: record.notes || '',
        invoice_requested: record.invoice_requested === '1' || record.invoice_requested === '2',
        designers: []
      }

      // Transform category_id
      if (record.category_id) {
        const categoryId = lookupCache.categories.get(String(record.category_id))
        if (categoryId) {
          transformed.category_id = categoryId
        } else {
          console.warn(`⚠️ Unknown category: ${record.category_id}`)
        }
      }

      // Transform channel_id
      if (record.channel_id) {
        const channelId = lookupCache.channels.get(String(record.channel_id))
        if (channelId) {
          transformed.channel_id = channelId
        } else {
          console.warn(`⚠️ Unknown channel: ${record.channel_id}`)
        }
      }

      // Parse designers
      if (record.designers && record.work_percent) {
        const memberId = lookupCache.members.get(record.designers)
        if (memberId) {
          transformed.designers = JSON.stringify([{
            member_id: memberId,
            percent: Math.floor((parseFloat(record.work_percent) || 1) * 100),
            bonus_pct: 0
          }])
        }
      }

      return transformed

    } catch (error) {
      console.error(`❌ Error transforming settlements record ${index}:`, record, error)
      throw error
    }
  })
}

/**
 * Transform and validate contacts data
 */
function transformContactsData(records: any[]): any[] {
  const contactRecords: any[] = []

  records.forEach((record, index) => {
    try {
      const memberId = lookupCache.members.get(record.member_id)
      if (!memberId) {
        console.warn(`⚠️ Unknown member: ${record.member_id}`)
        return
      }

      const baseDate = record.event_date ? convertYYMMDDToDate(record.event_date) : new Date().toISOString().split('T')[0]

      // Create separate contact records for each event type
      if (record.incoming_count && parseInt(record.incoming_count) > 0) {
        for (let i = 0; i < parseInt(record.incoming_count); i++) {
          contactRecords.push({
            member_id: memberId,
            event_date: baseDate,
            event_type: 'INCOMING',
            amount: 1000,
            notes: `Contact event ${i + 1}`
          })
        }
      }

      if (record.chat_count && parseInt(record.chat_count) > 0) {
        for (let i = 0; i < parseInt(record.chat_count); i++) {
          contactRecords.push({
            member_id: memberId,
            event_date: baseDate,
            event_type: 'CHAT',
            amount: 1000,
            notes: `Chat event ${i + 1}`
          })
        }
      }

      if (record.guide_count && parseInt(record.guide_count) > 0) {
        for (let i = 0; i < parseInt(record.guide_count); i++) {
          contactRecords.push({
            member_id: memberId,
            event_date: baseDate,
            event_type: 'GUIDE',
            amount: 2000,
            notes: `Guide event ${i + 1}`
          })
        }
      }

    } catch (error) {
      console.error(`❌ Error transforming contacts record ${index}:`, record, error)
    }
  })

  console.log(`📞 Created ${contactRecords.length} contact event records`)
  return contactRecords
}

/**
 * Transform and validate team tasks data
 */
function transformTeamTasksData(records: any[]): any[] {
  return records.map((record, index) => {
    try {
      const memberId = lookupCache.members.get(record.member_id)
      if (!memberId) {
        console.warn(`⚠️ Unknown member: ${record.member_id}`)
        return null
      }

      return {
        member_id: memberId,
        task_date: record.task_date ? convertYYMMDDToDate(record.task_date) : new Date().toISOString().split('T')[0],
        description: record.description || `Task ${index}`,
        amount: parseAmount(record.amount),
        notes: record.notes || '',
        time_spent: record.time_spent || ''
      }

    } catch (error) {
      console.error(`❌ Error transforming team task record ${index}:`, record, error)
      return null
    }
  }).filter(record => record !== null)
}

/**
 * Import data to specific table with UPSERT to handle conflicts
 */
async function importDataToTable(tableName: string, data: any[], preview: boolean = false): Promise<void> {
  if (data.length === 0) {
    console.log(`⚠️ No data to import for ${tableName}`)
    return
  }

  console.log(`📤 ${preview ? 'Preview' : 'Importing'} ${data.length} records to ${tableName}...`)

  if (preview) {
    console.log('📋 Sample records:')
    console.log(JSON.stringify(data.slice(0, 3), null, 2))
    return
  }

  try {
    // Use UPSERT to handle conflicts - this will update existing records or insert new ones
    const { error } = await supabase
      .from(tableName as any)
      .upsert(data, {
        onConflict: 'id', // Handle conflicts on primary key
        ignoreDuplicates: false // Update existing records instead of ignoring
      })

    if (error) {
      // If UPSERT fails, try with different conflict resolution
      console.warn(`⚠️ UPSERT failed for ${tableName}, trying alternative approach: ${error.message}`)

      // Try inserting in smaller batches
      const batchSize = 10
      let successCount = 0

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)

        try {
          const { error: batchError } = await supabase
            .from(tableName as any)
            .upsert(batch, { onConflict: 'id', ignoreDuplicates: false })

          if (batchError) {
            console.warn(`⚠️ Batch ${i}-${i + batch.length} failed: ${batchError.message}`)
            // Try individual records
            for (const record of batch) {
              try {
                const { error: recordError } = await supabase
                  .from(tableName as any)
                  .upsert([record], { onConflict: 'id', ignoreDuplicates: false })

                if (!recordError) {
                  successCount++
                } else {
                  console.warn(`⚠️ Record failed:`, record, recordError.message)
                }
              } catch (recordErr) {
                console.warn(`⚠️ Individual record error:`, recordErr)
              }
            }
          } else {
            successCount += batch.length
          }
        } catch (batchErr) {
          console.warn(`⚠️ Batch processing error:`, batchErr)
        }
      }

      console.log(`✅ Successfully imported ${successCount}/${data.length} records to ${tableName}`)
      return
    }

    console.log(`✅ Successfully imported ${data.length} records to ${tableName}`)

  } catch (error) {
    console.error(`❌ Error importing to ${tableName}:`, error)
    throw error
  }
}

/**
 * Process single sheet
 */
async function processSheet(workbook: XLSX.WorkBook, sheetName: string, preview: boolean = false): Promise<void> {
  const sheetConfig = detailedMappings.sheet_mappings[sheetName]
  if (!sheetConfig) {
    throw new Error(`No configuration found for sheet: ${sheetName}`)
  }

  console.log(`\n📊 Processing sheet: ${sheetConfig.korean_name} (${sheetName})`)
  console.log(`🎯 Target table: ${sheetConfig.target_table}`)
  console.log(`📈 Expected rows: ${sheetConfig.data_rows}`)

  try {
    // Extract raw data
    const extractedData = extractSheetData(workbook, sheetConfig)

    if (extractedData.length === 0) {
      console.log(`⚠️ No data extracted from ${sheetName}`)
      return
    }

    // Transform based on sheet type
    let transformedData: any[] = []

    switch (sheetName) {
      case 'settlements':
        transformedData = transformSettlementsData(extractedData)
        break
      case 'contacts':
        transformedData = transformContactsData(extractedData)
        break
      case 'team_tasks':
        transformedData = transformTeamTasksData(extractedData)
        break
      default:
        console.log(`⚠️ No transformer implemented for ${sheetName}`)
        return
    }

    // Import to database
    await importDataToTable(sheetConfig.target_table, transformedData, preview)

  } catch (error) {
    console.error(`❌ Error processing sheet ${sheetName}:`, error)
    throw error
  }
}

/**
 * Main ETL function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const sheetArg = args.find(arg => arg.startsWith('--sheet='))
  const allFlag = args.includes('--all')
  const executeFlag = args.includes('--execute')
  const preview = !executeFlag

  console.log('🚀 Starting Enhanced Excel ETL Process')
  console.log(`📋 Mode: ${preview ? 'PREVIEW' : 'EXECUTE'}`)

  try {
    // Load database mappings
    await loadDatabaseMappings()

    // Read Excel file
    const excelPath = path.join(__dirname, '../../정산 NEW 시트.xlsm')
    console.log(`📖 Reading Excel file: ${excelPath}`)
    const workbook = readExcelFile(excelPath)

    if (allFlag) {
      // Process all supported sheets
      const supportedSheets = ['settlements', 'contacts', 'team_tasks']
      for (const sheetName of supportedSheets) {
        await processSheet(workbook, sheetName, preview)
      }
    } else if (sheetArg) {
      // Process specific sheet
      const sheetName = sheetArg.split('=')[1]
      await processSheet(workbook, sheetName, preview)
    } else {
      console.error('❌ Usage: npm run excel-etl -- --sheet=<sheet_name> [--execute]')
      console.error('❌ Or: npm run excel-etl -- --all [--execute]')
      console.error('Supported sheets: settlements, contacts, team_tasks')
      process.exit(1)
    }

    if (preview) {
      console.log('\n✨ Preview completed successfully!')
      console.log('💡 Add --execute flag to perform actual import')
    } else {
      console.log('\n🎉 Excel ETL process completed successfully!')
    }

  } catch (error) {
    console.error('💥 Excel ETL process failed:', error)
    process.exit(1)
  }
}

// Run main function
main()