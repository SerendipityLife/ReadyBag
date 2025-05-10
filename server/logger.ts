import fs from 'fs';
import path from 'path';

// 로그 파일 경로 설정
const logDir = path.join(process.cwd(), 'logs');
const apiLogFile = path.join(logDir, 'api.log');
const errorLogFile = path.join(logDir, 'error.log');

// 로그 디렉토리 생성
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.error('로그 디렉토리 생성 실패:', err);
}

/**
 * API 로그를 파일에 기록
 * @param message 로그 메시지
 */
export function logApiRequest(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // 콘솔에도 출력
  console.log(message);
  
  // 파일에 로그 추가
  fs.appendFile(apiLogFile, logMessage, (err) => {
    if (err) {
      console.error('API 로그 기록 실패:', err);
    }
  });
}

/**
 * 에러 로그를 파일에 기록
 * @param message 에러 메시지
 * @param error 에러 객체
 */
export function logError(message: string, error?: any): void {
  const timestamp = new Date().toISOString();
  let errorDetails = '';
  
  if (error) {
    if (error instanceof Error) {
      errorDetails = `\n  Error: ${error.message}\n  Stack: ${error.stack}`;
    } else {
      errorDetails = `\n  Details: ${JSON.stringify(error)}`;
    }
  }
  
  const logMessage = `[${timestamp}] ${message}${errorDetails}\n`;
  
  // 콘솔에도 출력
  console.error(message, error);
  
  // 파일에 로그 추가
  fs.appendFile(errorLogFile, logMessage, (err) => {
    if (err) {
      console.error('에러 로그 기록 실패:', err);
    }
  });
}

/**
 * 로그 파일 읽기
 * @param logType 로그 타입 ('api' 또는 'error')
 * @param lines 읽을 라인 수 (기본값: 100)
 * @returns 로그 내용
 */
export function readLogs(logType: 'api' | 'error' = 'api', lines: number = 100): string {
  const logFile = logType === 'api' ? apiLogFile : errorLogFile;
  
  try {
    if (!fs.existsSync(logFile)) {
      return `로그 파일이 없습니다: ${logFile}`;
    }
    
    const data = fs.readFileSync(logFile, 'utf8');
    const allLines = data.split('\n');
    
    // 최근 n개 라인만 반환
    return allLines.slice(-lines).join('\n');
  } catch (err) {
    console.error('로그 파일 읽기 실패:', err);
    return '로그 파일 읽기 오류 발생';
  }
}

export default {
  logApiRequest,
  logError,
  readLogs
};