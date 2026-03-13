// lib/googleSheets.js
// 구글 시트 v3 연동 - 자동화된 시트 구조에 맞춤
// 시트명: "일별성과", "포트폴리오"

const SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '';

// ============================================
// CSV 가져오기 & 파싱
// ============================================

async function fetchSheetCSV(sheetName) {
  if (!SHEET_ID) return '';
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { next: { revalidate: 300 } }); // 5분 캐시
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${sheetName}`);
  return await res.text();
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());

    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

// ============================================
// 일별성과 데이터 (차트 + 지표 계산용)
// Apps Script가 자동 기록하는 시트
// 컬럼: 날짜, VIPS총자산, KOSPI종가, 투자원금, 누적수익금, 누적수익률(%)
// ============================================
export async function fetchDailyPerformance() {
  try {
    const csv = await fetchSheetCSV('일별성과');
    const rows = parseCSV(csv);

    return rows
      .filter(r => r['날짜'] && r['VIPS총자산'])
      .map(r => ({
        date: r['날짜'],
        vipsTotal: parseFloat(r['VIPS총자산'].replace(/,/g, '')) || 0,
        kospiClose: parseFloat(r['KOSPI종가'].replace(/,/g, '')) || 0,
        initialCapital: parseFloat(r['투자원금']?.replace(/,/g, '')) || 0,
      }))
      .filter(r => r.vipsTotal > 0);
  } catch (err) {
    console.error('Failed to fetch daily performance:', err);
    return [];
  }
}

// ============================================
// 포트폴리오 (현재 보유종목)
// Apps Script가 자동 업데이트하는 시트
// 컬럼: 종목명, 종목코드, 섹터, 보유수량, 평균매수가, 현재가, 평가금액, 수익률, 비중
// ============================================
export async function fetchPortfolio() {
  try {
    const csv = await fetchSheetCSV('포트폴리오');
    const rows = parseCSV(csv);

    return rows
      .filter(r => r['종목명'] && r['평가금액'] && r['종목명'] !== '합계')
      .map(r => {
        // 수익률: 시트에서 0.835 (비율) 또는 83.5 (퍼센트) 둘 다 처리
        let ret = parseFloat(r['수익률']?.replace(/[%,]/g, '')) || 0;
        if (Math.abs(ret) < 5 && ret !== 0) ret = ret * 100; // 비율 → 퍼센트 변환
        
        return {
          name: r['종목명'],
          code: r['종목코드'] || '',
          sector: r['섹터'] || '',
          shares: parseInt(r['보유수량']?.replace(/,/g, '')) || 0,
          avgPrice: parseFloat(r['평균매수가']?.replace(/,/g, '')) || 0,
          currentPrice: parseFloat(r['현재가']?.replace(/,/g, '')) || 0,
          value: parseFloat(r['평가금액']?.replace(/,/g, '')) || 0,
          returnPct: ret,
          weight: parseFloat(r['비중']?.replace(/[%,]/g, '')) || 0,
        };
      });
  } catch (err) {
    console.error('Failed to fetch portfolio:', err);
    return [];
  }
}

// ============================================
// 성과 지표 계산
// ============================================
export function calculateMetrics(dailyData) {
  if (!dailyData || dailyData.length === 0) {
    return {
      vipsReturn: 0, kospiReturn: 0, alpha: 0,
      sharpeRatio: 0, mdd: 0,
      totalAssets: 0, cumulativeProfit: 0,
      initialAssets: 0, chartData: [],
    };
  }

  // 데이터 1개면 기본값 반환 (차트는 못 그리지만 숫자는 표시)
  if (dailyData.length === 1) {
    const d = dailyData[0];
    const capital = d.initialCapital || d.vipsTotal;
    const profit = d.vipsTotal - capital;
    const ret = capital > 0 ? (profit / capital) * 100 : 0;
    return {
      vipsReturn: Number(ret.toFixed(2)),
      kospiReturn: 0, alpha: Number(ret.toFixed(2)),
      sharpeRatio: 0, mdd: 0,
      totalAssets: Math.round(d.vipsTotal),
      cumulativeProfit: Math.round(profit),
      initialAssets: Math.round(capital),
      chartData: [{ date: d.date, vips: 0, kospi: 0 }],
    };
  }

  const initial = dailyData[0];
  const latest = dailyData[dailyData.length - 1];

  // 투자원금 (설정 시트에서 가져온 값)
  const initialCapital = latest.initialCapital || initial.vipsTotal;

  // 누적 수익률
  const vipsReturn = ((latest.vipsTotal - initialCapital) / initialCapital) * 100;
  const kospiReturn = initial.kospiClose > 0
    ? ((latest.kospiClose - initial.kospiClose) / initial.kospiClose) * 100
    : 0;
  const alpha = vipsReturn - kospiReturn;

  const totalAssets = latest.vipsTotal;
  const cumulativeProfit = latest.vipsTotal - initialCapital;

  // 일별 수익률
  const dailyReturns = [];
  for (let i = 1; i < dailyData.length; i++) {
    const prev = dailyData[i - 1].vipsTotal;
    const curr = dailyData[i].vipsTotal;
    if (prev > 0) dailyReturns.push((curr - prev) / prev);
  }

  // Sharpe Ratio (연환산, 무위험이자율 3.5%)
  const riskFreeDaily = 0.035 / 252;
  const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (dailyReturns.length || 1);
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? ((meanReturn - riskFreeDaily) / stdDev) * Math.sqrt(252) : 0;

  // MDD
  let peak = dailyData[0].vipsTotal;
  let maxDrawdown = 0;
  for (const d of dailyData) {
    if (d.vipsTotal > peak) peak = d.vipsTotal;
    const drawdown = (peak - d.vipsTotal) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  const mdd = maxDrawdown * 100;

  // 차트 데이터 (기준=100 인덱스)
  const chartData = dailyData.map(d => ({
    date: d.date,
    vips: Number((((d.vipsTotal - initial.vipsTotal) / initial.vipsTotal) * 100).toFixed(2)),
    kospi: initial.kospiClose > 0
      ? Number((((d.kospiClose - initial.kospiClose) / initial.kospiClose) * 100).toFixed(2))
      : 0,
  }));

  return {
    vipsReturn: Number(vipsReturn.toFixed(2)),
    kospiReturn: Number(kospiReturn.toFixed(2)),
    alpha: Number(alpha.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    mdd: Number(mdd.toFixed(2)),
    totalAssets: Math.round(totalAssets),
    cumulativeProfit: Math.round(cumulativeProfit),
    initialAssets: Math.round(initialCapital),
    chartData,
  };
}

export function formatKRW(amount) {
  if (Math.abs(amount) >= 100000000) {
    return (amount / 100000000).toFixed(1) + '억원';
  }
  if (Math.abs(amount) >= 10000) {
    return Math.round(amount / 10000).toLocaleString('ko-KR') + '만원';
  }
  return amount.toLocaleString('ko-KR') + '원';
}