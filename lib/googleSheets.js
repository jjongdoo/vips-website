// ================================================================
// lib/googleSheets.js
// ssuvips.com ↔ 구글 시트 v4.1 연동
//
// 기존 FundDashboard.tsx, VIPSHomepage.tsx와 100% 호환
// export: fetchDailyPerformance, fetchPortfolio, calculateMetrics, formatKRW
//
// v4.1 시트 이름 (이모지 포함)에 맞춤
// Sharpe Ratio, MDD는 ssuvips.com에 표시하지 않음 (노션 전용)
// ================================================================

const GOOGLE_SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;

// ─────────────────────────────────────────
// v4.1 시트 이름 (여기만 수정하면 시트 이름 변경에 대응)
// ─────────────────────────────────────────
const SHEET_NAMES = {
  daily:     '📅 일별성과',
  portfolio: '💼 포트폴리오',
};


// ─────────────────────────────────────────
// CSV 가져오기
// ─────────────────────────────────────────
async function fetchSheetCSV(sheetName) {
  if (!GOOGLE_SHEET_ID) {
    console.warn('NEXT_PUBLIC_GOOGLE_SHEET_ID 환경변수가 없습니다.');
    return [];
  }

  const encodedName = encodeURIComponent(sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodedName}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // 5분 캐시
    if (!res.ok) {
      console.error(`시트 fetch 실패: ${sheetName} (${res.status})`);
      return [];
    }
    const text = await res.text();
    return parseCSV(text);
  } catch (err) {
    console.error(`시트 fetch 에러 (${sheetName}):`, err);
    return [];
  }
}


// ─────────────────────────────────────────
// CSV 파서
// ─────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let currentRow = [];

  for (let i = 0; i <= text.length; i++) {
    const ch = i < text.length ? text[i] : '\n'; // EOF를 줄바꿈으로 처리

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(current.trim());
        current = '';
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(current.trim());
        current = '';
        if (currentRow.some(c => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
      } else {
        current += ch;
      }
    }
  }

  return rows;
}


// ─────────────────────────────────────────
// 숫자 파싱 (쉼표, 원, % 제거)
// ─────────────────────────────────────────
function parseNum(str) {
  if (!str || str === '' || str === '-') return 0;
  return Number(String(str).replace(/[,원%\s]/g, '')) || 0;
}


// ================================================================
// 📅 일별성과 가져오기
// 
// v4.1 시트 컬럼:
// 날짜 | VIPS총자산 | KOSPI종가 | 투자원금 | 누적수익금 | VIPS수익률(%) | KOSPI수익률(%) | 초과수익률(%)
// ================================================================
export async function fetchDailyPerformance() {
  const rows = await fetchSheetCSV(SHEET_NAMES.daily);
  if (!rows || rows.length < 2) return [];

  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || row[0] === '') continue;

    data.push({
      date:           row[0],
      totalAssets:    parseNum(row[1]),
      kospiClose:     parseNum(row[2]),
      initialCapital: parseNum(row[3]),
      profit:         parseNum(row[4]),
      vipsReturn:     parseNum(row[5]),
      kospiReturn:    parseNum(row[6]),
      excessReturn:   parseNum(row[7]),
    });
  }

  return data;
}


// ================================================================
// 💼 포트폴리오 가져오기
//
// v4.1 시트 컬럼:
// 종목명 | 종목코드 | 보유수량 | 평균매수가 | 현재가 | 평가금액 | 수익률(%) | 비중(%)
// ================================================================
export async function fetchPortfolio() {
  const rows = await fetchSheetCSV(SHEET_NAMES.portfolio);
  if (!rows || rows.length < 2) return [];

  const holdings = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[0] || '').trim();

    // 빈 행, 합계 행 스킵
    if (!name || name === '합계') continue;

    holdings.push({
      name:         name,
      code:         (row[1] || '').trim(),
      sector:       '',  // v4.1에서는 섹터 컬럼 없음
      quantity:     parseNum(row[2]),
      avgPrice:     parseNum(row[3]),
      currentPrice: parseNum(row[4]),
      value:        parseNum(row[5]),
      returnPct:    parseNum(row[6]),
      weight:       parseNum(row[7]),
    });
  }

  return holdings;
}


// ================================================================
// 📊 성과지표 계산
//
// FundDashboard.tsx가 사용하는 필드:
//   metrics.vipsReturn    → 큰 카드
//   metrics.kospiReturn   → 큰 카드
//   metrics.alpha         → 큰 카드
//   metrics.totalAssets   → 작은 카드
//   metrics.cumulativeProfit → 작은 카드
//   metrics.sharpeRatio   → (제거 예정이지만 호환용 유지)
//   metrics.mdd           → (제거 예정이지만 호환용 유지)
//   metrics.chartData     → 차트 [{ date, vips, kospi }]
//
// VIPSHomepage.tsx가 사용하는 필드:
//   metrics.vipsReturn
//   metrics.kospiReturn
//   metrics.alpha
//   metrics.chartData
// ================================================================
export function calculateMetrics(dailyData) {
  if (!dailyData || dailyData.length === 0) {
    return {
      vipsReturn: 0,
      kospiReturn: 0,
      alpha: 0,
      totalAssets: 0,
      cumulativeProfit: 0,
      sharpeRatio: 0,
      mdd: 0,
      chartData: [],
    };
  }

  const latest = dailyData[dailyData.length - 1];

  // ── 차트 데이터: 누적 수익률 (%) ──
  const chartData = dailyData.map(d => ({
    date:  d.date,
    vips:  Number(d.vipsReturn.toFixed(2)),
    kospi: Number(d.kospiReturn.toFixed(2)),
  }));

  return {
    vipsReturn:       Number(latest.vipsReturn.toFixed(2)),
    kospiReturn:      Number(latest.kospiReturn.toFixed(2)),
    alpha:            Number(latest.excessReturn.toFixed(2)),
    totalAssets:      latest.totalAssets,
    cumulativeProfit: latest.profit,

    // Sharpe, MDD → 0으로 유지 (ssuvips.com에서 표시 안 함)
    // 실제 값은 구글시트 📋 성과지표 시트에서 노션으로만 표시
    sharpeRatio: 0,
    mdd: 0,

    chartData,
  };
}


// ================================================================
// 💰 금액 포맷
// ================================================================
export function formatKRW(num) {
  if (num === undefined || num === null) return '0원';
  const absNum = Math.abs(num);

  if (absNum >= 100000000) {
    return (num / 100000000).toFixed(1) + '억원';
  }
  if (absNum >= 10000) {
    return (num / 10000).toFixed(0) + '만원';
  }
  return num.toLocaleString('ko-KR') + '원';
}