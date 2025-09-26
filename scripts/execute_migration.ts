/**
 * Master Migration Orchestration Script for MZS Settlement System
 *
 * This script orchestrates the complete Excel data migration process with:
 * - Pre-migration validation and backup
 * - Excel data import with comprehensive error handling
 * - Post-migration validation and reporting
 * - Automated rollback on failure
 *
 * Usage:
 * npm run migrate -- --preview
 * npm run migrate -- --execute
 * npm run migrate -- --execute --backup-name=excel_migration_2025_09_26
 */

import { createClient } from '@supabase/supabase-js'
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { format } from 'date-fns'
import { Database } from '../src/lib/supabase/types'
import { execSync } from 'child_process'
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

interface MigrationReport {
  timestamp: string
  phase: 'started' | 'backup_created' | 'migration_completed' | 'validation_passed' | 'completed' | 'failed' | 'rolled_back'
  backupName?: string
  backupPath?: string
  excelFile: string
  sheetsProcessed: string[]
  recordsMigrated: Record<string, number>
  validationResults: ValidationResult[]
  errors: string[]
  totalDuration: number
  success: boolean
}

interface ValidationResult {
  table: string
  expectedRecords: number
  actualRecords: number
  dataIntegrityCheck: 'PASS' | 'FAIL'
  issues: string[]
}

/**
 * Check prerequisites before migration
 */
async function checkPrerequisites(): Promise<void> {
  console.log('🔍 Checking migration prerequisites...')

  // Check Excel file exists
  const excelPath = path.join(__dirname, '../../정산 NEW 시트.xlsm')
  if (!existsSync(excelPath)) {
    throw new Error(`Excel file not found: ${excelPath}`)
  }

  // Check database connection
  try {
    const { data, error } = await supabase.from('members').select('id').limit(1)
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }
  } catch (error) {
    throw new Error(`Database connection failed: ${error}`)
  }

  // Check required tables exist
  const requiredTables = ['members', 'channels', 'categories', 'projects', 'contacts', 'team_tasks']
  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table as any).select('id').limit(1)
      if (error && error.message.includes('relation')) {
        throw new Error(`Required table '${table}' does not exist`)
      }
    } catch (error) {
      console.warn(`⚠️ Warning: Could not verify table ${table}`)
    }
  }

  console.log('✅ Prerequisites check passed')
}

/**
 * Create pre-migration backup
 */
async function createPreMigrationBackup(backupName: string): Promise<void> {
  console.log(`📦 Creating pre-migration backup: ${backupName}`)

  try {
    execSync(`npm run migration-backup -- --action=backup --name=${backupName}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    console.log('✅ Pre-migration backup created successfully')
  } catch (error) {
    throw new Error(`Backup creation failed: ${error}`)
  }
}

/**
 * Execute Excel migration
 */
async function executeMigration(preview: boolean = false): Promise<Record<string, number>> {
  console.log(`🚀 ${preview ? 'Previewing' : 'Executing'} Excel migration...`)

  const recordsMigrated: Record<string, number> = {}
  const sheetsToProcess = ['settlements', 'contacts', 'team_tasks']

  try {
    for (const sheet of sheetsToProcess) {
      console.log(`\n📊 Processing ${sheet}...`)

      const command = `npm run excel-etl -- --sheet=${sheet}${preview ? '' : ' --execute'}`
      const output = execSync(command, {
        stdio: 'pipe',
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8'
      })

      console.log(output)

      // Extract record count from output (basic parsing)
      const recordMatch = output.match(/(\d+) records/i)
      recordsMigrated[sheet] = recordMatch ? parseInt(recordMatch[1]) : 0
    }

    return recordsMigrated

  } catch (error) {
    throw new Error(`Migration execution failed: ${error}`)
  }
}

/**
 * Validate migrated data
 */
async function validateMigration(): Promise<ValidationResult[]> {
  console.log('🔍 Validating migrated data...')

  const validationResults: ValidationResult[] = []

  const validationConfigs = [
    { table: 'projects', minRecords: 100, maxRecords: 500 },
    { table: 'contacts', minRecords: 50, maxRecords: 300 },
    { table: 'team_tasks', minRecords: 200, maxRecords: 600 }
  ]

  for (const config of validationConfigs) {
    try {
      const { data, error, count } = await supabase
        .from(config.table as any)
        .select('*', { count: 'exact' })
        .limit(1)

      if (error) {
        throw new Error(`Validation query failed: ${error.message}`)
      }

      const actualRecords = count || 0
      const issues: string[] = []

      // Check record count ranges
      if (actualRecords < config.minRecords) {
        issues.push(`Record count too low: ${actualRecords} < ${config.minRecords}`)
      }

      if (actualRecords > config.maxRecords) {
        issues.push(`Record count too high: ${actualRecords} > ${config.maxRecords}`)
      }

      // Basic data integrity checks
      let dataIntegrityCheck: 'PASS' | 'FAIL' = 'PASS'

      if (actualRecords === 0) {
        issues.push('No records found in table')
        dataIntegrityCheck = 'FAIL'
      }

      validationResults.push({
        table: config.table,
        expectedRecords: Math.floor((config.minRecords + config.maxRecords) / 2),
        actualRecords,
        dataIntegrityCheck,
        issues
      })

      console.log(`  ${dataIntegrityCheck === 'PASS' ? '✅' : '❌'} ${config.table}: ${actualRecords} records`)

    } catch (error) {
      console.error(`❌ Validation failed for ${config.table}:`, error)
      validationResults.push({
        table: config.table,
        expectedRecords: 0,
        actualRecords: 0,
        dataIntegrityCheck: 'FAIL',
        issues: [`Validation error: ${error}`]
      })
    }
  }

  return validationResults
}

/**
 * Perform rollback if migration fails
 */
async function performRollback(backupName: string): Promise<void> {
  console.log(`🔄 Performing rollback to backup: ${backupName}`)

  try {
    execSync(`npm run migration-backup -- --action=rollback --name=${backupName}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    console.log('✅ Rollback completed successfully')
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  }
}

/**
 * Generate comprehensive migration report
 */
function generateMigrationReport(report: MigrationReport): void {
  console.log('📋 Generating migration report...')

  const reportPath = path.join(__dirname, '../migration_reports', `migration_report_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.json`)

  // Ensure reports directory exists
  const reportsDir = path.dirname(reportPath)
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true })
  }

  // Write detailed JSON report
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')

  // Generate human-readable summary
  const summaryPath = reportPath.replace('.json', '_summary.txt')
  const summary = `
MZS Settlement System - Excel Data Migration Report
==================================================

Migration Status: ${report.success ? '✅ SUCCESS' : '❌ FAILED'}
Timestamp: ${report.timestamp}
Phase: ${report.phase}
Duration: ${Math.round(report.totalDuration / 1000)}s

${report.backupName ? `Backup: ${report.backupName}` : 'No backup created'}
Excel File: ${report.excelFile}

Sheets Processed:
${report.sheetsProcessed.map(sheet => `  - ${sheet}`).join('\n')}

Records Migrated:
${Object.entries(report.recordsMigrated).map(([table, count]) => `  - ${table}: ${count} records`).join('\n')}

Validation Results:
${report.validationResults.map(result => `
  ${result.table}:
    Expected: ~${result.expectedRecords} records
    Actual: ${result.actualRecords} records
    Status: ${result.dataIntegrityCheck}
    Issues: ${result.issues.length > 0 ? result.issues.join(', ') : 'None'}
`).join('')}

${report.errors.length > 0 ? `
Errors Encountered:
${report.errors.map(error => `  - ${error}`).join('\n')}
` : 'No errors encountered.'}

${report.success ?
  '🎉 Migration completed successfully! All data has been imported and validated.' :
  '⚠️ Migration failed or encountered issues. Please review the errors above.'
}

Report Files:
- Detailed: ${reportPath}
- Summary: ${summaryPath}
`

  writeFileSync(summaryPath, summary, 'utf-8')

  console.log(`📁 Reports generated:`)
  console.log(`  - JSON: ${reportPath}`)
  console.log(`  - Summary: ${summaryPath}`)
}

/**
 * Main migration orchestration function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const executeFlag = args.includes('--execute')
  const preview = !executeFlag
  const backupNameArg = args.find(arg => arg.startsWith('--backup-name='))
  const backupName = backupNameArg?.split('=')[1] || `excel_migration_${format(new Date(), 'yyyy_MM_dd_HH_mm_ss')}`

  console.log('🚀 MZS Settlement System - Excel Data Migration')
  console.log('=' .repeat(60))
  console.log(`📋 Mode: ${preview ? 'PREVIEW' : 'EXECUTE'}`)
  console.log(`📦 Backup: ${backupName}`)
  console.log('=' .repeat(60))

  const startTime = Date.now()
  let report: MigrationReport = {
    timestamp: new Date().toISOString(),
    phase: 'started',
    backupName: preview ? undefined : backupName,
    excelFile: '정산 NEW 시트.xlsm',
    sheetsProcessed: [],
    recordsMigrated: {},
    validationResults: [],
    errors: [],
    totalDuration: 0,
    success: false
  }

  try {
    // Phase 1: Prerequisites
    await checkPrerequisites()

    // Phase 2: Backup (only in execute mode)
    if (!preview) {
      await createPreMigrationBackup(backupName)
      report.phase = 'backup_created'
      report.backupPath = path.join(__dirname, '../backups', `${backupName}_*.json`)
    }

    // Phase 3: Migration
    const recordsMigrated = await executeMigration(preview)
    report.recordsMigrated = recordsMigrated
    report.sheetsProcessed = Object.keys(recordsMigrated)
    report.phase = 'migration_completed'

    // Phase 4: Validation (only in execute mode)
    if (!preview) {
      const validationResults = await validateMigration()
      report.validationResults = validationResults
      report.phase = 'validation_passed'

      // Check if validation passed
      const validationFailed = validationResults.some(result => result.dataIntegrityCheck === 'FAIL')

      if (validationFailed) {
        throw new Error('Data validation failed')
      }
    }

    // Phase 5: Success
    report.phase = 'completed'
    report.success = true
    report.totalDuration = Date.now() - startTime

    if (preview) {
      console.log('\n🎉 Preview completed successfully!')
      console.log('💡 Add --execute flag to perform actual migration')
      console.log('📊 Preview Summary:')
      Object.entries(recordsMigrated).forEach(([sheet, count]) => {
        console.log(`  - ${sheet}: ${count} records ready for migration`)
      })
    } else {
      console.log('\n🎉 Migration completed successfully!')
      generateMigrationReport(report)
    }

  } catch (error) {
    console.error('\n💥 Migration failed:', error)
    report.errors.push(String(error))
    report.phase = 'failed'
    report.success = false
    report.totalDuration = Date.now() - startTime

    // Perform rollback if we're in execute mode and have a backup
    if (!preview && report.backupName) {
      try {
        await performRollback(report.backupName)
        report.phase = 'rolled_back'
      } catch (rollbackError) {
        console.error('💥 Rollback also failed:', rollbackError)
        report.errors.push(`Rollback failed: ${rollbackError}`)
      }
    }

    // Generate error report
    if (!preview) {
      generateMigrationReport(report)
    }

    process.exit(1)
  }
}

// Run main function
main()