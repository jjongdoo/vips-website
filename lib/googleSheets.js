// ================================================================
// lib/googleSheets.js
// ssuvips.com ↔ 구글 시트 연동
//
// v4.1 시트 이름에 맞춰 업데이트됨
// Sharpe Ratio, MDD는 이 파일에서 계산하지 않음 (노션 전용)
//
// ssuvips.com에 표시되는 지표:
//   - 총자산, 누적수익금
//   - VIPS 수익률, KOSPI 수익률, Alpha
//   - 누적 수익률 비교 차트 (VIPS vs KOSPI)
//   - 포트폴리오 테이블 + 파이차트
// ================================================================

const GOOGLE_SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;

// ─────────────────────────────────────────
// v4.1 시트 이름 (이모지 포함)
// 시트 이름이 바뀌면 여기만 수정하면 됨
// ─────────────────────────────────────────
const SHEET_NAMES = {
  trades:    '📝 거래내역',
  settings:  '⚙️ 설정',
  portfolio: '💼 포트폴리오',
  daily:     '📅 일별성과',
  metrics:   '📋 성과지표',  // 노션 전용 (ssuvips.com에서는 안 읽음)
};


// ─────────────────────────────────────────
// CSV 가져오기 (구글 시트 → 웹 게시 URL)
// ─────────────────────────────────────────
async function fetchSheetCSV(sheetName) {
  if (!GOOGLE_SHEET_ID) {
    console.error('GOOGLE_SHEET_ID 환경변수가 설정되지 않았습니다.');
    return [];
  }

  const encodedName = encodeURIComponent(sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodedName}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // 5분 캐시
    if (!res.ok) {
      console.error(`시트 가져오기 실패: ${sheetName} (${res.status})`);
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
// CSV 파서 (따옴표/쉼표 처리)
// ─────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
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
        rows.length > 0
          ? rows[rows.length - 1].push(current.trim())
          : rows.push([current.trim()]);
        current = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        if (rows.length > 0) {
          rows[rows.length - 1].push(current.trim());
        } else {
          rows.push([current.trim()]);
        }
        current = '';
        rows.push([]);
        if (ch === '\r') i++;
      } else {
        current += ch;
      }
    }
  }

  // 마지막 필드
  if (current || (rows.length > 0 && rows[rows.length - 1].length > 0)) {
    if (rows.length > 0) {
      rows[rows.length - 1].push(current.trim());
    } else {
      rows.push([current.trim()]);
    }
  }

  // 빈 마지막 행 제거
  if (rows.length > 0 && rows[rows.length - 1].every(c => c === '')) {
    rows.pop();
  }

  return rows;
}


// ─────────────────────────────────────────
// 숫자 파싱 헬퍼 (쉼표 포함 문자열 → 숫자)
// ─────────────────────────────────────────
function parseNumber(str) {
  if (!str || str === '' || str === '-') return 0;
  return Number(String(str).replace(/[,원%]/g, '')) || 0;
}


// ================================================================
// 📊 펀드 대시보드 데이터 가져오기 (메인 함수)
// ================================================================
export async function fetchFundData() {
  try {
    const [dailyRows, portfolioRows, settingsRows] = await Promise.all([
      fetchSheetCSV(SHEET_NAMES.daily),
      fetchSheetCSV(SHEET_NAMES.portfolio),
      fetchSheetCSV(SHEET_NAMES.settings),
    ]);

    // ── 설정값 ──
    const settings = parseSettings(settingsRows);

    // ── 일별성과 → KPI + 차트 데이터 ──
    const dailyData = parseDailyData(dailyRows);
    const kpi = calculateKPI(dailyData, settings);

    // ── 포트폴리오 → 종목 테이블 ──
    const portfolio = parsePortfolio(portfolioRows);

    return {
      kpi,
      dailyData,
      portfolio,
      settings,
      lastUpdated: dailyData.length > 0
        ? dailyData[dailyData.length - 1].date
        : null,
    };
  } catch (err) {
    console.error('펀드 데이터 가져오기 실패:', err);
    return null;
  }
}


// ─────────────────────────────────────────
// 설정 시트 파싱
// ─────────────────────────────────────────
function parseSettings(rows) {
  const settings = {
    initialCapital: 10000000,
    startDate: '2025-10-01',
    cash: 0,
    riskFreeRate: 3.5,
  };

  if (!rows || rows.length < 2) return settings;

  // rows[0] = 헤더, rows[1~] = 데이터
  for (let i = 1; i < rows.length; i++) {
    const key = (rows[i][0] || '').trim();
    const val = rows[i][1];

    if (key.includes('투자원금'))      settings.initialCapital = parseNumber(val);
    if (key.includes('운용시작일'))    settings.startDate = val;
    if (key.includes('현금'))          settings.cash = parseNumber(val);
    if (key.includes('무위험이자율'))  settings.riskFreeRate = parseNumber(val);
  }

  return settings;
}


// ─────────────────────────────────────────
// 일별성과 시트 파싱
// 컬럼: 날짜, VIPS총자산, KOSPI종가, 투자원금, 누적수익금, VIPS수익률(%), KOSPI수익률(%), 초과수익률(%)
// ─────────────────────────────────────────
function parseDailyData(rows) {
  if (!rows || rows.length < 2) return [];

  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || row[0] === '') continue;

    data.push({
      date:          row[0],
      totalAssets:   parseNumber(row[1]),
      kospiClose:    parseNumber(row[2]),
      initialCapital: parseNumber(row[3]),
      profit:        parseNumber(row[4]),
      vipsReturn:    parseNumber(row[5]),
      kospiReturn:   parseNumber(row[6]),
      excessReturn:  parseNumber(row[7]),
    });
  }

  return data;
}


// ─────────────────────────────────────────
// 포트폴리오 시트 파싱
// 컬럼: 종목명, 종목코드, 보유수량, 평균매수가, 현재가, 평가금액, 수익률(%), 비중(%)
// ─────────────────────────────────────────
function parsePortfolio(rows) {
  if (!rows || rows.length < 2) return [];

  const holdings = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[0] || '').trim();

    // 빈 행, 합계 행 건너뛰기
    if (!name || name === '' || name === '합계') continue;

    holdings.push({
      name:       name,
      code:       (row[1] || '').trim(),
      quantity:   parseNumber(row[2]),
      avgPrice:   parseNumber(row[3]),
      currentPrice: parseNumber(row[4]),
      value:      parseNumber(row[5]),
      returnPct:  parseNumber(row[6]),
      weight:     parseNumber(row[7]),
    });
  }

  return holdings;
}


// ─────────────────────────────────────────
// KPI 계산 (ssuvips.com에 표시할 지표만)
//
// ⚠️ Sharpe Ratio, MDD는 여기서 계산하지 않음
//    → 노션 전용 (구글시트 📋 성과지표 시트에서 관리)
//
// ssuvips.com에 새 지표를 추가하고 싶으면
// 이 함수에 계산 로직을 추가하세요.
// ─────────────────────────────────────────
function calculateKPI(dailyData, settings) {
  if (dailyData.length === 0) {
    return {
      totalAssets: 0,
      profit: 0,
      vipsReturn: 0,
      kospiReturn: 0,
      excessReturn: 0,
      // ssuvips.com에 새 KPI를 추가하려면 여기에 기본값 추가
    };
  }

  const latest = dailyData[dailyData.length - 1];

  return {
    totalAssets:   latest.totalAssets,
    profit:        latest.profit,
    vipsReturn:    latest.vipsReturn,
    kospiReturn:   latest.kospiReturn,
    excessReturn:  latest.excessReturn,
    // ─────────────────────────────────────
    // 🔧 ssuvips.com에 새 KPI 추가 예시:
    //
    // winRate: calcWinRate(dailyData),
    // maxProfit: calcMaxProfit(dailyData),
    // ─────────────────────────────────────
  };
}


// ─────────────────────────────────────────
// 차트용 데이터 가공 (인덱스 = 기준일 100)
// ─────────────────────────────────────────
export function getChartData(dailyData) {
  if (dailyData.length === 0) return [];

  const firstAssets = dailyData[0].totalAssets;
  const firstKospi  = dailyData[0].kospiClose;

  return dailyData.map(d => ({
    date: d.date,
    vipsIndex:  firstAssets > 0 ? (d.totalAssets / firstAssets) * 100 : 100,
    kospiIndex: firstKospi > 0  ? (d.kospiClose / firstKospi) * 100  : 100,
  }));
}


// ─────────────────────────────────────────
// 포트폴리오 파이차트용 데이터
// ─────────────────────────────────────────
export function getPieChartData(portfolio) {
  return portfolio
    .filter(h => h.value > 0)
    .map(h => ({
      name: h.name,
      value: h.value,
      weight: h.weight,
    }));
}