/**
 * Migration Backup and Rollback Strategy for MZS Settlement System
 *
 * This script provides comprehensive backup and rollback capabilities for data migration.
 * It creates point-in-time backups and enables safe rollback if migration fails.
 *
 * Usage:
 * npm run migration-backup -- --action=backup --name=pre_excel_migration
 * npm run migration-backup -- --action=rollback --name=pre_excel_migration
 * npm run migration-backup -- --action=validate --name=pre_excel_migration
 * npm run migration-backup -- --action=list
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { format } from 'date-fns'
import { Database } from '../src/lib/supabase/types'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') })

// Initialize Supabase client
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

// Backup configuration
const BACKUP_DIR = path.join(__dirname, '../backups')
const MIGRATION_TABLES = [
  'members',
  'channels',
  'categories',
  'projects',
  'contacts',
  'feed_logs',
  'team_tasks',
  'mileage',
  'funds_company',
  'funds_personal',
  'settlements',
  'settlement_items',
  'app_settings'
]

interface BackupMetadata {
  name: string
  timestamp: string
  tables: string[]
  totalRecords: number
  checksums: Record<string, string>
  version: string
}

interface TableBackup {
  table: string
  schema: any
  data: any[]
  recordCount: number
  checksum: string
}

/**
 * Ensure backup directory exists
 */
function ensureBackupDir(): void {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`)
  }
}

/**
 * Generate checksum for data integrity
 */
function generateChecksum(data: any[]): string {
  const jsonStr = JSON.stringify(data, Object.keys(data).sort())
  let hash = 0

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return hash.toString(16)
}

/**
 * Get table schema information
 */
async function getTableSchema(tableName: string): Promise<any> {
  try {
    // Get a sample record to infer schema
    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .limit(1)

    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      throw error
    }

    const schema = data?.[0] ? Object.keys(data[0]).reduce((acc, key) => {
      acc[key] = typeof data[0][key]
      return acc
    }, {} as any) : {}

    return schema
  } catch (error) {
    console.warn(`⚠️ Could not get schema for ${tableName}:`, error)
    return {}
  }
}

/**
 * Backup single table
 */
async function backupTable(tableName: string): Promise<TableBackup> {
  console.log(`📊 Backing up table: ${tableName}`)

  try {
    // Get table schema
    const schema = await getTableSchema(tableName)

    // Get all data
    const { data, error, count } = await supabase
      .from(tableName as any)
      .select('*', { count: 'exact' })

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn(`⚠️ Table ${tableName} does not exist, skipping`)
        return {
          table: tableName,
          schema: {},
          data: [],
          recordCount: 0,
          checksum: 'table_not_exists'
        }
      }
      throw error
    }

    const tableData = data || []
    const recordCount = count || tableData.length
    const checksum = generateChecksum(tableData)

    console.log(`  ✅ ${recordCount} records backed up`)

    return {
      table: tableName,
      schema,
      data: tableData,
      recordCount,
      checksum
    }

  } catch (error) {
    console.error(`❌ Error backing up ${tableName}:`, error)
    throw error
  }
}

/**
 * Create full database backup
 */
async function createBackup(backupName: string): Promise<void> {
  console.log(`🔄 Creating backup: ${backupName}`)
  ensureBackupDir()

  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  const backupFileName = `${backupName}_${timestamp}.json`
  const backupPath = path.join(BACKUP_DIR, backupFileName)

  try {
    const tableBackups: TableBackup[] = []
    let totalRecords = 0

    // Backup each table
    for (const tableName of MIGRATION_TABLES) {
      const tableBackup = await backupTable(tableName)
      tableBackups.push(tableBackup)
      totalRecords += tableBackup.recordCount
    }

    // Create backup metadata
    const metadata: BackupMetadata = {
      name: backupName,
      timestamp: new Date().toISOString(),
      tables: MIGRATION_TABLES,
      totalRecords,
      checksums: tableBackups.reduce((acc, backup) => {
        acc[backup.table] = backup.checksum
        return acc
      }, {} as Record<string, string>),
      version: '1.0'
    }

    // Write backup file
    const backupData = {
      metadata,
      tables: tableBackups
    }

    writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8')

    console.log(`✅ Backup completed successfully!`)
    console.log(`📁 Backup file: ${backupPath}`)
    console.log(`📊 Total records backed up: ${totalRecords}`)
    console.log(`📋 Tables backed up: ${MIGRATION_TABLES.length}`)

    // Create latest backup symlink info
    const latestPath = path.join(BACKUP_DIR, 'latest_backup.json')
    writeFileSync(latestPath, JSON.stringify({
      latestBackupFile: backupFileName,
      backupPath,
      metadata
    }, null, 2))

  } catch (error) {
    console.error('❌ Backup failed:', error)
    throw error
  }
}

/**
 * Restore from backup
 */
async function restoreFromBackup(backupName: string): Promise<void> {
  console.log(`🔄 Starting rollback from backup: ${backupName}`)

  try {
    // Find backup file
    const backupFiles = readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith(backupName) && file.endsWith('.json'))
      .sort()
      .reverse()

    if (backupFiles.length === 0) {
      throw new Error(`No backup found with name: ${backupName}`)
    }

    const latestBackupFile = backupFiles[0]
    const backupPath = path.join(BACKUP_DIR, latestBackupFile)

    console.log(`📁 Using backup file: ${latestBackupFile}`)

    // Read backup data
    const backupData = JSON.parse(readFileSync(backupPath, 'utf-8'))
    const { metadata, tables } = backupData

    console.log(`📋 Backup created: ${metadata.timestamp}`)
    console.log(`📊 Total records to restore: ${metadata.totalRecords}`)

    // Confirm rollback
    console.log('⚠️  WARNING: This will DELETE all current data and restore from backup!')
    console.log('⚠️  This action is IRREVERSIBLE!')

    // For now, we'll skip the interactive confirmation in non-interactive mode
    // In production, you might want to add a --confirm flag

    // Clear existing data and restore
    for (const tableBackup of tables) {
      await restoreTable(tableBackup)
    }

    console.log('✅ Rollback completed successfully!')
    console.log(`📊 Restored ${metadata.totalRecords} total records`)

  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  }
}

/**
 * Restore single table
 */
async function restoreTable(tableBackup: TableBackup): Promise<void> {
  const { table, data, recordCount } = tableBackup

  if (recordCount === 0 || data.length === 0) {
    console.log(`⏭️ Skipping empty table: ${table}`)
    return
  }

  console.log(`🔄 Restoring table: ${table} (${recordCount} records)`)

  try {
    // Delete existing data
    const { error: deleteError } = await supabase
      .from(table as any)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (deleteError && !deleteError.message.includes('relation')) {
      console.warn(`⚠️ Warning deleting from ${table}:`, deleteError.message)
    }

    // Insert backup data in batches
    const batchSize = 100
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)

      const { error: insertError } = await supabase
        .from(table as any)
        .insert(batch)

      if (insertError) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1} into ${table}:`, insertError)
        throw insertError
      }
    }

    console.log(`  ✅ Restored ${recordCount} records`)

  } catch (error) {
    console.error(`❌ Error restoring table ${table}:`, error)
    throw error
  }
}

/**
 * Validate backup integrity
 */
async function validateBackup(backupName: string): Promise<void> {
  console.log(`🔍 Validating backup: ${backupName}`)

  try {
    // Find backup file
    const backupFiles = readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith(backupName) && file.endsWith('.json'))
      .sort()
      .reverse()

    if (backupFiles.length === 0) {
      throw new Error(`No backup found with name: ${backupName}`)
    }

    const latestBackupFile = backupFiles[0]
    const backupPath = path.join(BACKUP_DIR, latestBackupFile)

    // Read and validate backup structure
    const backupData = JSON.parse(readFileSync(backupPath, 'utf-8'))
    const { metadata, tables } = backupData

    console.log(`📋 Backup: ${metadata.name}`)
    console.log(`📅 Created: ${metadata.timestamp}`)
    console.log(`📊 Total records: ${metadata.totalRecords}`)

    let validationErrors = 0

    // Validate each table backup
    for (const tableBackup of tables) {
      const expectedChecksum = metadata.checksums[tableBackup.table]
      const actualChecksum = generateChecksum(tableBackup.data)

      if (expectedChecksum !== actualChecksum) {
        console.error(`❌ Checksum mismatch for ${tableBackup.table}`)
        console.error(`   Expected: ${expectedChecksum}`)
        console.error(`   Actual: ${actualChecksum}`)
        validationErrors++
      } else {
        console.log(`✅ ${tableBackup.table}: ${tableBackup.recordCount} records (checksum valid)`)
      }
    }

    if (validationErrors === 0) {
      console.log('✅ Backup validation passed!')
    } else {
      console.error(`❌ Backup validation failed with ${validationErrors} errors`)
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Backup validation failed:', error)
    throw error
  }
}

/**
 * List available backups
 */
function listBackups(): void {
  ensureBackupDir()

  const backupFiles = readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.json') && file !== 'latest_backup.json')
    .sort()
    .reverse()

  if (backupFiles.length === 0) {
    console.log('📁 No backups found')
    return
  }

  console.log(`📁 Available backups (${backupFiles.length}):`)
  console.log('─'.repeat(80))

  backupFiles.forEach((file, index) => {
    try {
      const backupPath = path.join(BACKUP_DIR, file)
      const backupData = JSON.parse(readFileSync(backupPath, 'utf-8'))
      const { metadata } = backupData

      console.log(`${index + 1}. ${metadata.name}`)
      console.log(`   📅 Created: ${metadata.timestamp}`)
      console.log(`   📊 Records: ${metadata.totalRecords}`)
      console.log(`   📁 File: ${file}`)
      console.log('')
    } catch (error) {
      console.log(`${index + 1}. ${file} (corrupted backup)`)
      console.log('')
    }
  })
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const actionArg = args.find(arg => arg.startsWith('--action='))
  const nameArg = args.find(arg => arg.startsWith('--name='))

  if (!actionArg) {
    console.error('❌ Usage: npm run migration-backup -- --action=<backup|rollback|validate|list> [--name=<backup_name>]')
    process.exit(1)
  }

  const action = actionArg.split('=')[1]
  const backupName = nameArg?.split('=')[1]

  try {
    switch (action) {
      case 'backup':
        if (!backupName) {
          console.error('❌ Backup name required: --name=<backup_name>')
          process.exit(1)
        }
        await createBackup(backupName)
        break

      case 'rollback':
        if (!backupName) {
          console.error('❌ Backup name required: --name=<backup_name>')
          process.exit(1)
        }
        await restoreFromBackup(backupName)
        break

      case 'validate':
        if (!backupName) {
          console.error('❌ Backup name required: --name=<backup_name>')
          process.exit(1)
        }
        await validateBackup(backupName)
        break

      case 'list':
        listBackups()
        break

      default:
        console.error(`❌ Unknown action: ${action}`)
        console.error('Available actions: backup, rollback, validate, list')
        process.exit(1)
    }

    console.log('✅ Operation completed successfully!')

  } catch (error) {
    console.error('💥 Operation failed:', error)
    process.exit(1)
  }
}

// Run main function
main()