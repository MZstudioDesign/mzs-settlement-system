#!/usr/bin/env node

/**
 * CSV ETL Main Script
 * Excel 시트 데이터를 Supabase로 이관하는 메인 스크립트
 *
 * Usage:
 *   npx tsx scripts/csv-etl/index.ts --help
 *   npx tsx scripts/csv-etl/index.ts --input ./data --seed
 *   npx tsx scripts/csv-etl/index.ts --file projects.csv --table projects
 */

import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';

import {
  parseCSVFile,
  transformProject,
  transformContact,
  transformFeed,
  transformTeamTask,
  transformMileage,
  transformFunds,
  validateData,
  generateReport
} from './utils';

import {
  testConnection,
  insertSeedData,
  insertProjects,
  insertContacts,
  insertFeeds,
  insertTeamTasks,
  insertMileage,
  insertCompanyFunds,
  insertPersonalFunds,
  clearAllData
} from './database';

import { ETL_CONFIG } from './config';
import { TransformedFundsCompany, TransformedFundsPersonal } from './types';

// CLI 프로그램 설정
const program = new Command();

program
  .name('csv-etl')
  .description('MZS 정산 시스템 CSV ETL 도구')
  .version('1.0.0');

// 전체 이관 명령어
program
  .command('migrate')
  .description('전체 Excel/CSV 데이터를 Supabase로 이관')
  .option('-i, --input <directory>', 'CSV 파일들이 있는 디렉토리', './data')
  .option('-s, --seed', '시드 데이터 먼저 삽입')
  .option('-c, --clear', '기존 데이터 삭제 후 이관')
  .option('-r, --report <file>', '결과 리포트 파일명', 'etl-report.txt')
  .option('--dry-run', '실제 삽입 없이 검증만 수행')
  .action(async (options) => {
    await runFullMigration(options);
  });

// 개별 파일 이관 명령어
program
  .command('import')
  .description('개별 CSV 파일 이관')
  .requiredOption('-f, --file <file>', 'CSV 파일 경로')
  .requiredOption('-t, --table <table>', '테이블 종류 (projects|contacts|feeds|team_tasks|mileage|funds)')
  .option('-r, --report <file>', '결과 리포트 파일명')
  .option('--dry-run', '실제 삽입 없이 검증만 수행')
  .action(async (options) => {
    await runSingleFileImport(options);
  });

// 시드 데이터 삽입 명령어
program
  .command('seed')
  .description('기본 참조 데이터 (멤버, 채널, 카테고리) 삽입')
  .action(async () => {
    await runSeedData();
  });

// 데이터 정리 명령어
program
  .command('clear')
  .description('모든 테이블 데이터 삭제 (주의!)')
  .option('--confirm', '정말로 삭제하려면 이 옵션 필요')
  .action(async (options) => {
    await runClearData(options);
  });

// 연결 테스트 명령어
program
  .command('test')
  .description('데이터베이스 연결 테스트')
  .action(async () => {
    await runConnectionTest();
  });

/**
 * 전체 마이그레이션 실행
 */
async function runFullMigration(options: any) {
  console.log(chalk.blue.bold('🚀 MZS CSV ETL 전체 마이그레이션 시작'));
  console.log(chalk.gray(`입력 디렉토리: ${options.input}`));

  try {
    // 연결 테스트
    const connected = await testConnection();
    if (!connected) {
      throw new Error('데이터베이스 연결 실패');
    }

    // 기존 데이터 삭제
    if (options.clear) {
      console.log(chalk.yellow('⚠️  기존 데이터 삭제 중...'));
      await clearAllData();
    }

    // 시드 데이터 삽입
    if (options.seed) {
      console.log(chalk.green('🌱 시드 데이터 삽입 중...'));
      await insertSeedData();
    }

    // CSV 파일 목록 수집
    const inputDir = path.resolve(options.input);
    if (!fs.existsSync(inputDir)) {
      throw new Error(`입력 디렉토리를 찾을 수 없습니다: ${inputDir}`);
    }

    const csvFiles = fs.readdirSync(inputDir)
      .filter(file => file.endsWith('.csv'))
      .map(file => path.join(inputDir, file));

    if (csvFiles.length === 0) {
      console.log(chalk.yellow('⚠️  CSV 파일을 찾을 수 없습니다.'));
      return;
    }

    console.log(chalk.blue(`📄 발견된 CSV 파일: ${csvFiles.length}개`));
    csvFiles.forEach(file => console.log(chalk.gray(`  - ${path.basename(file)}`)));

    // 파일별 처리
    const results: any[] = [];

    for (const csvFile of csvFiles) {
      const fileName = path.basename(csvFile, '.csv');
      const tableType = detectTableType(fileName);

      if (!tableType) {
        console.log(chalk.yellow(`⚠️  알 수 없는 파일 형식, 건너뜀: ${fileName}`));
        continue;
      }

      console.log(chalk.blue(`\n📊 처리 중: ${fileName} → ${tableType}`));

      try {
        const result = await processFile(csvFile, tableType, options.dryRun);
        results.push({ file: fileName, table: tableType, ...result });

        if (result.success) {
          console.log(chalk.green(`✅ 성공: ${result.insertedCount || result.summary.successRows}개 행 처리`));
        } else {
          console.log(chalk.red(`❌ 실패: ${result.errors?.length || result.summary.errorRows}개 오류`));
        }
      } catch (error) {
        console.error(chalk.red(`❌ ${fileName} 처리 실패:`), error);
        results.push({ file: fileName, table: tableType, success: false, error: error.message });
      }
    }

    // 전체 결과 요약
    console.log(chalk.blue.bold('\n📊 마이그레이션 완료 요약'));
    const totalSuccess = results.filter(r => r.success).length;
    const totalFiles = results.length;
    console.log(chalk.green(`성공: ${totalSuccess}/${totalFiles} 파일`));

    if (totalSuccess < totalFiles) {
      console.log(chalk.red('실패한 파일:'));
      results.filter(r => !r.success).forEach(r => {
        console.log(chalk.red(`  - ${r.file}: ${r.error || '알 수 없는 오류'}`));
      });
    }

    // 리포트 생성
    if (options.report) {
      const reportContent = generateFullReport(results);
      fs.writeFileSync(options.report, reportContent, 'utf-8');
      console.log(chalk.blue(`📄 상세 리포트 저장: ${options.report}`));
    }

  } catch (error) {
    console.error(chalk.red('💥 마이그레이션 실패:'), error);
    process.exit(1);
  }
}

/**
 * 개별 파일 임포트 실행
 */
async function runSingleFileImport(options: any) {
  console.log(chalk.blue.bold('📄 개별 파일 임포트'));
  console.log(chalk.gray(`파일: ${options.file}`));
  console.log(chalk.gray(`테이블: ${options.table}`));

  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('데이터베이스 연결 실패');
    }

    const result = await processFile(options.file, options.table, options.dryRun);

    if (result.success) {
      console.log(chalk.green(`✅ 성공: ${result.insertedCount || result.summary.successRows}개 행 처리`));
    } else {
      console.log(chalk.red(`❌ 실패: ${result.errors?.length || result.summary.errorRows}개 오류`));
    }

    // 리포트 생성
    if (options.report) {
      const reportContent = generateReport(result, options.report);
      console.log(chalk.blue(`📄 리포트 저장: ${options.report}`));
    }

  } catch (error) {
    console.error(chalk.red('💥 임포트 실패:'), error);
    process.exit(1);
  }
}

/**
 * 시드 데이터 삽입 실행
 */
async function runSeedData() {
  console.log(chalk.blue.bold('🌱 시드 데이터 삽입'));

  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('데이터베이스 연결 실패');
    }

    await insertSeedData();
    console.log(chalk.green('✅ 시드 데이터 삽입 완료'));

  } catch (error) {
    console.error(chalk.red('💥 시드 데이터 삽입 실패:'), error);
    process.exit(1);
  }
}

/**
 * 데이터 정리 실행
 */
async function runClearData(options: any) {
  if (!options.confirm) {
    console.error(chalk.red('⚠️  모든 데이터를 삭제하려면 --confirm 옵션이 필요합니다'));
    process.exit(1);
  }

  console.log(chalk.yellow.bold('🗑️  모든 데이터 삭제'));

  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('데이터베이스 연결 실패');
    }

    await clearAllData();
    console.log(chalk.green('✅ 데이터 삭제 완료'));

  } catch (error) {
    console.error(chalk.red('💥 데이터 삭제 실패:'), error);
    process.exit(1);
  }
}

/**
 * 연결 테스트 실행
 */
async function runConnectionTest() {
  console.log(chalk.blue.bold('🔌 데이터베이스 연결 테스트'));

  try {
    const connected = await testConnection();
    if (connected) {
      console.log(chalk.green('✅ 연결 성공'));
    } else {
      console.log(chalk.red('❌ 연결 실패'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('💥 연결 테스트 실패:'), error);
    process.exit(1);
  }
}

/**
 * 파일명으로 테이블 타입 감지
 */
function detectTableType(fileName: string): string | null {
  const name = fileName.toLowerCase();

  if (name.includes('project') || name.includes('프로젝트')) return 'projects';
  if (name.includes('contact') || name.includes('컨택') || name.includes('상담')) return 'contacts';
  if (name.includes('feed') || name.includes('피드')) return 'feeds';
  if (name.includes('team') || name.includes('팀') || name.includes('업무')) return 'team_tasks';
  if (name.includes('mileage') || name.includes('마일리지') || name.includes('포인트')) return 'mileage';
  if (name.includes('fund') || name.includes('공금') || name.includes('자금')) return 'funds';

  return null;
}

/**
 * 개별 파일 처리
 */
async function processFile(filePath: string, tableType: string, dryRun: boolean = false): Promise<any> {
  // CSV 파싱
  const rawData = parseCSVFile(filePath);

  if (!rawData || rawData.length === 0) {
    throw new Error('파일이 비어있거나 파싱할 수 없습니다');
  }

  // 데이터 변환
  let transformedData: any[] = [];
  const errors: any[] = [];

  for (let i = 0; i < rawData.length; i++) {
    try {
      let transformed;

      switch (tableType) {
        case 'projects':
          transformed = transformProject(rawData[i]);
          break;
        case 'contacts':
          transformed = transformContact(rawData[i]);
          break;
        case 'feeds':
          transformed = transformFeed(rawData[i]);
          break;
        case 'team_tasks':
          transformed = transformTeamTask(rawData[i]);
          break;
        case 'mileage':
          transformed = transformMileage(rawData[i]);
          break;
        case 'funds':
          transformed = transformFunds(rawData[i]);
          break;
        default:
          throw new Error(`지원되지 않는 테이블 타입: ${tableType}`);
      }

      transformedData.push(transformed);
    } catch (error) {
      errors.push({
        row: i + 1,
        field: 'transform',
        value: rawData[i],
        message: error.message
      });
    }
  }

  // 검증
  const validationResult = validateData(transformedData, ETL_CONFIG.validation);

  // 삽입
  if (!dryRun && validationResult.success) {
    let insertResult;

    // 공금은 회사/개인 구분 필요
    if (tableType === 'funds') {
      const companyFunds: TransformedFundsCompany[] = [];
      const personalFunds: TransformedFundsPersonal[] = [];

      transformedData.forEach(item => {
        if ('member_id' in item) {
          personalFunds.push(item as TransformedFundsPersonal);
        } else {
          companyFunds.push(item as TransformedFundsCompany);
        }
      });

      const companyResult = await insertCompanyFunds(companyFunds);
      const personalResult = await insertPersonalFunds(personalFunds);

      insertResult = {
        success: companyResult.success && personalResult.success,
        insertedCount: companyResult.insertedCount + personalResult.insertedCount,
        errors: [...companyResult.errors, ...personalResult.errors]
      };
    } else {
      // 일반 테이블 삽입
      const insertFunction = {
        projects: insertProjects,
        contacts: insertContacts,
        feeds: insertFeeds,
        team_tasks: insertTeamTasks,
        mileage: insertMileage
      }[tableType];

      if (!insertFunction) {
        throw new Error(`삽입 함수를 찾을 수 없습니다: ${tableType}`);
      }

      insertResult = await insertFunction(validationResult.data);
    }

    return { ...validationResult, ...insertResult };
  }

  return validationResult;
}

/**
 * 전체 결과 리포트 생성
 */
function generateFullReport(results: any[]): string {
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  let report = `
=== MZS CSV ETL 전체 마이그레이션 결과 ===
처리 시간: ${new Date().toLocaleString('ko-KR')}

[전체 요약]
- 총 파일 수: ${totalCount}
- 성공 파일 수: ${successCount}
- 실패 파일 수: ${totalCount - successCount}

[파일별 상세]
`;

  results.forEach(result => {
    report += `
파일: ${result.file} (${result.table})
상태: ${result.success ? '✅ 성공' : '❌ 실패'}
`;

    if (result.success) {
      report += `처리된 행 수: ${result.insertedCount || result.summary?.successRows || 0}
`;
      if (result.summary) {
        report += `오류 행 수: ${result.summary.errorRows}
경고 행 수: ${result.summary.warningRows}
`;
      }
    } else {
      report += `오류: ${result.error || '알 수 없는 오류'}
`;
    }
  });

  return report;
}

// CLI 실행
if (require.main === module) {
  program.parse();
}