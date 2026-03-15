// app/components/FundDashboard.tsx
// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Target, AlertTriangle, RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import { fetchDailyPerformance, fetchPortfolio, calculateMetrics, formatKRW } from '../../lib/googleSheets';

const C = { navy: "#1a2a5e", blue: "#2c4ea3", lightBlue: "#4a7ae5", bg: "#f8f9fc", card: "#ffffff", border: "#e2e7f1", textPrimary: "#1a1f36", textSecondary: "#5a6278", textMuted: "#8c94a8", green: "#0ea55a", red: "#dc3545", heroBg: "linear-gradient(135deg, #1a2a5e 0%, #2c4ea3 50%, #4a7ae5 100%)" };
const PIE_COLORS = ['#2c4ea3','#4a7ae5','#0ea55a','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16'];

const FUND_CSS = `
.fund-top3 { grid-template-columns: repeat(3, 1fr) !important; }
.fund-port-layout { display: grid !important; grid-template-columns: 1fr 320px !important; gap: 16px !important; }
.fund-table-desktop { display: block !important; }
.fund-table-mobile { display: none !important; }
.fund-metric-value { font-size: 34px !important; }
.fund-title-row { flex-direction: row !important; }
.fund-sub2 { grid-template-columns: repeat(2, 1fr) !important; }

@media (max-width: 768px) {
  .fund-top3 { grid-template-columns: 1fr !important; gap: 10px !important; }
  .fund-port-layout { grid-template-columns: 1fr !important; }
  .fund-table-desktop { display: none !important; }
  .fund-table-mobile { display: block !important; }
  .fund-metric-value { font-size: 26px !important; }
  .fund-chart-card { padding: 16px !important; }
  .fund-principle { padding: 14px 16px !important; }
  .fund-title-row { flex-direction: column !important; gap: 8px !important; }
  .fund-section-title { font-size: 20px !important; }
  .fund-sub2 { grid-template-columns: 1fr 1fr !important; }
}
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (<div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}><p style={{ color:C.textMuted,fontSize:11,margin:0 }}>{label}</p>{payload.map((p,i) => (<p key={i} style={{ color:p.color,fontSize:13,fontWeight:600,margin:"3px 0 0" }}>{p.name}: {p.value>0?"+":""}{p.value}%</p>))}</div>);
  }
  return null;
};

export default function FundDashboard({ lang = 'ko' }) {
  const [metrics, setMetrics] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const [dailyData, portfolioData] = await Promise.all([fetchDailyPerformance(), fetchPortfolio()]);
      if (dailyData.length === 0) { setError('데이터를 불러올 수 없습니다.'); setLoading(false); return; }
      setMetrics(calculateMetrics(dailyData)); setPortfolio(portfolioData);
      setLastUpdated(dailyData[dailyData.length - 1]?.date || '');
    } catch (err) { setError('데이터 로딩 중 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const isKo = lang === 'ko';
  const cardStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };

  if (loading) return (
    <div style={{ paddingTop: 32 }}>
      <style>{FUND_CSS}</style>
      <h2 className="fund-section-title" style={{ fontSize:24,margin:"0 0 6px",fontWeight:800,color:C.navy,display:"flex",alignItems:"center",gap:8 }}><TrendingUp size={22} style={{ color:C.blue }}/> {isKo?'VIPS 펀드 성과':'VIPS Fund Performance'}</h2>
      <div style={{ ...cardStyle,padding:60,textAlign:'center',marginTop:24 }}><RefreshCw size={28} color={C.textMuted} style={{ animation:'spin 1s linear infinite' }}/><p style={{ color:C.textMuted,fontSize:14,marginTop:12 }}>{isKo?'펀드 데이터를 불러오는 중...':'Loading fund data...'}</p><style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style></div>
    </div>
  );

  if (error || !metrics) return (
    <div style={{ paddingTop: 32 }}>
      <style>{FUND_CSS}</style>
      <h2 className="fund-section-title" style={{ fontSize:24,margin:"0 0 6px",fontWeight:800,color:C.navy,display:"flex",alignItems:"center",gap:8 }}><TrendingUp size={22} style={{ color:C.blue }}/> {isKo?'VIPS 펀드 성과':'VIPS Fund Performance'}</h2>
      <div style={{ ...cardStyle,padding:40,textAlign:'center',marginTop:24,borderLeft:`3px solid ${C.lightBlue}` }}><AlertTriangle size={24} color={C.textMuted} style={{ marginBottom:8 }}/><p style={{ color:C.textSecondary,fontSize:14,margin:0 }}>{error||(isKo?'구글 시트를 연결하면 실시간 펀드 데이터가 여기에 표시됩니다.':'Connect Google Sheets to display live fund data here.')}</p><button onClick={loadData} style={{ marginTop:12,padding:'8px 16px',background:C.blue,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer' }}>{isKo?'다시 시도':'Retry'}</button></div>
    </div>
  );

  const filteredPortfolio = portfolio.filter(p => p.name !== '합계');
  const totalPortfolioValue = filteredPortfolio.reduce((sum, p) => sum + p.value, 0);
  const pieData = filteredPortfolio.filter(p => p.value > 0).map(p => ({ name: p.name, value: Number(((p.value / (totalPortfolioValue || 1)) * 100).toFixed(1)) })).sort((a, b) => b.value - a.value);

  return (
    <div style={{ paddingTop: 32 }}>
      <style>{FUND_CSS}</style>

      <div className="fund-title-row" style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24 }}>
        <div>
          <h2 className="fund-section-title" style={{ fontSize:24,margin:"0 0 6px",fontWeight:800,color:C.navy,display:"flex",alignItems:"center",gap:8 }}><TrendingUp size={22} style={{ color:C.blue }}/> {isKo?'VIPS 펀드 성과':'VIPS Fund Performance'}</h2>
          <p style={{ color:C.textMuted,fontSize:14,margin:0 }}>{isKo?'KOSPI 벤치마크 대비 VIPS 펀드 운용 수익률':'VIPS fund returns vs KOSPI benchmark'}</p>
        </div>
        {lastUpdated && (<div style={{ fontSize:11,color:C.textMuted,marginTop:4,flexShrink:0 }}>{isKo?'최종 업데이트':'Last updated'}: {lastUpdated}<button onClick={loadData} style={{ background:'none',border:'none',color:C.lightBlue,cursor:'pointer',marginLeft:6,padding:2,verticalAlign:'middle' }}><RefreshCw size={12}/></button></div>)}
      </div>

      {/* 핵심 지표 3개 */}
      <div className="fund-top3" style={{ display:"grid",gap:14,marginBottom:16 }}>
        <div style={{ background:C.heroBg,borderRadius:12,padding:20,color:"#fff" }}>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.65)",marginBottom:4,fontWeight:500 }}>{isKo?'VIPS 펀드 수익률':'VIPS Fund Return'}</div>
          <div className="fund-metric-value" style={{ fontWeight:800,fontFamily:"'Inter',sans-serif" }}>{metrics.vipsReturn>0?'+':''}{metrics.vipsReturn}%</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:4 }}>{isKo?`총자산 ${formatKRW(metrics.totalAssets)}`:`Total ${formatKRW(metrics.totalAssets)}`}</div>
        </div>
        <div style={{ ...cardStyle,padding:20 }}>
          <div style={{ fontSize:12,color:C.textMuted,marginBottom:4,fontWeight:500 }}>{isKo?'KOSPI 수익률':'KOSPI Return'}</div>
          <div className="fund-metric-value" style={{ fontWeight:800,color:C.textSecondary,fontFamily:"'Inter',sans-serif" }}>{metrics.kospiReturn>0?'+':''}{metrics.kospiReturn}%</div>
          <div style={{ fontSize:11,color:C.textMuted,marginTop:4 }}>{isKo?'동일 기간 벤치마크':'Same period benchmark'}</div>
        </div>
        <div style={{ ...cardStyle,padding:20 }}>
          <div style={{ fontSize:12,color:C.textMuted,marginBottom:4,fontWeight:500 }}>{isKo?'초과수익 (Alpha)':'Excess Return (Alpha)'}</div>
          <div className="fund-metric-value" style={{ fontWeight:800,color:metrics.alpha>=0?C.green:C.red,fontFamily:"'Inter',sans-serif" }}>{metrics.alpha>0?'+':''}{metrics.alpha}%</div>
          <div style={{ fontSize:11,color:C.textMuted,marginTop:4 }}>{isKo?'KOSPI 대비':'vs KOSPI'}</div>
        </div>
      </div>

      {/* 세부 지표 */}
      <div className="fund-sub2" style={{ display:"grid",gap:12,marginBottom:16 }}>
        {[{ label:isKo?'총 자산':'Total Assets',value:formatKRW(metrics.totalAssets),icon:<DollarSign size={16}/>,color:C.blue },{ label:isKo?'누적 수익금':'Cumulative Profit',value:`${metrics.cumulativeProfit>=0?'+':''}${formatKRW(metrics.cumulativeProfit)}`,icon:metrics.cumulativeProfit>=0?<TrendingUp size={16}/>:<TrendingDown size={16}/>,color:metrics.cumulativeProfit>=0?C.green:C.red }].map((item,i) => (
          <div key={i} style={{ ...cardStyle,padding:"16px 14px" }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}><div style={{ fontSize:11,color:C.textMuted,fontWeight:500 }}>{item.label}</div><div style={{ color:item.color,opacity:0.4 }}>{item.icon}</div></div>
            <div style={{ fontSize:20,fontWeight:800,color:item.color,fontFamily:"'Inter',sans-serif",marginTop:6,letterSpacing:-0.3 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* 차트 */}
      <div className="fund-chart-card" style={{ ...cardStyle,padding:24,marginBottom:16 }}>
        <h3 style={{ margin:"0 0 20px",fontSize:15,fontWeight:700,color:C.navy }}>{isKo?'누적 수익률 비교 차트':'Cumulative Return Comparison'}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={metrics.chartData}>
            <defs>
              <linearGradient id="fundNavyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.2}/><stop offset="100%" stopColor={C.blue} stopOpacity={0.02}/></linearGradient>
              <linearGradient id="fundGrayGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#aab0c0" stopOpacity={0.1}/><stop offset="100%" stopColor="#aab0c0" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5"/>
            <XAxis dataKey="date" tick={{ fill:C.textMuted,fontSize:9 }} axisLine={false} tickLine={false} interval={Math.max(0,Math.floor(metrics.chartData.length/5))}/>
            <YAxis tick={{ fill:C.textMuted,fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={42}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{ fontSize:11,color:C.textSecondary }}/>
            <Area type="monotone" dataKey="vips" stroke={C.blue} strokeWidth={2.5} fill="url(#fundNavyGrad)" name={isKo?'VIPS 펀드':'VIPS Fund'}/>
            <Area type="monotone" dataKey="kospi" stroke="#b0b7c8" strokeWidth={1.5} fill="url(#fundGrayGrad)" name="KOSPI" strokeDasharray="6 3"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 포트폴리오 */}
      {filteredPortfolio.length > 0 && (
        <div className="fund-port-layout" style={{ marginBottom:16 }}>
          <div style={{ ...cardStyle,overflow:'hidden' }}>
            <div style={{ padding:'16px 20px 12px',borderBottom:`1px solid ${C.border}` }}>
              <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:C.navy,display:'flex',alignItems:'center',gap:6 }}><BarChart3 size={16} color={C.blue}/>{isKo?'포트폴리오 구성':'Portfolio Holdings'}</h3>
            </div>

            {/* 데스크톱 테이블 */}
            <div className="fund-table-desktop">
              <div style={{ display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr 0.8fr',padding:'8px 20px',background:'#f8f9fb',fontSize:10,fontWeight:600,color:C.textMuted,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`1px solid ${C.border}` }}>
                <span>{isKo?'종목명':'Stock'}</span><span style={{ textAlign:'right' }}>{isKo?'평균매수가':'Avg Price'}</span><span style={{ textAlign:'right' }}>{isKo?'현재가':'Current'}</span><span style={{ textAlign:'right' }}>{isKo?'평가금액':'Value'}</span><span style={{ textAlign:'right' }}>{isKo?'수익률':'Return'}</span>
              </div>
              {filteredPortfolio.map((p,i) => (
                <div key={i} style={{ display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr 0.8fr',padding:'12px 20px',alignItems:'center',borderBottom:i<filteredPortfolio.length-1?`1px solid ${C.border}`:'none',fontSize:13 }}>
                  <div><div style={{ fontWeight:600,color:C.textPrimary }}>{p.name}</div>{p.code&&<div style={{ fontSize:10,color:C.textMuted,marginTop:1 }}>{p.code}</div>}</div>
                  <div style={{ textAlign:'right',fontFamily:"'Inter',sans-serif",color:C.textSecondary }}>{p.avgPrice.toLocaleString('ko-KR')}</div>
                  <div style={{ textAlign:'right',fontFamily:"'Inter',sans-serif",fontWeight:600 }}>{p.currentPrice.toLocaleString('ko-KR')}</div>
                  <div style={{ textAlign:'right',fontFamily:"'Inter',sans-serif",color:C.textSecondary }}>{formatKRW(p.value)}</div>
                  <div style={{ textAlign:'right',fontFamily:"'Inter',sans-serif",fontWeight:600,color:p.returnPct>=0?C.green:C.red }}>{p.returnPct>0?'+':''}{p.returnPct.toFixed(1)}%</div>
                </div>
              ))}
            </div>

            {/* 모바일 카드 리스트 */}
            <div className="fund-table-mobile" style={{ padding:'4px 16px' }}>
              {filteredPortfolio.map((p,i) => (
                <div key={i} style={{ padding:'14px 0',borderBottom:i<filteredPortfolio.length-1?`1px solid ${C.border}`:'none' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                    <div style={{ display:'flex',alignItems:'baseline',gap:6 }}>
                      <span style={{ fontWeight:700,fontSize:14,color:C.textPrimary }}>{p.name}</span>
                      {p.code&&<span style={{ fontSize:10,color:C.textMuted }}>{p.code}</span>}
                    </div>
                    <span style={{ fontWeight:700,fontSize:15,color:p.returnPct>=0?C.green:C.red,fontFamily:"'Inter',sans-serif" }}>{p.returnPct>0?'+':''}{p.returnPct.toFixed(1)}%</span>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,fontSize:11,color:C.textMuted }}>
                    <div><div style={{ fontSize:10,marginBottom:2 }}>{isKo?'매수가':'Avg'}</div><div style={{ color:C.textSecondary,fontWeight:500 }}>{p.avgPrice.toLocaleString('ko-KR')}</div></div>
                    <div><div style={{ fontSize:10,marginBottom:2 }}>{isKo?'현재가':'Cur'}</div><div style={{ color:C.textPrimary,fontWeight:600 }}>{p.currentPrice.toLocaleString('ko-KR')}</div></div>
                    <div style={{ textAlign:'right' }}><div style={{ fontSize:10,marginBottom:2 }}>{isKo?'평가금액':'Value'}</div><div style={{ color:C.textSecondary,fontWeight:500 }}>{formatKRW(p.value)}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 파이차트 */}
          <div style={{ ...cardStyle,padding:20 }}>
            <h4 style={{ margin:'0 0 8px',fontSize:14,fontWeight:700,color:C.navy,display:'flex',alignItems:'center',gap:6 }}><PieChartIcon size={14} color={C.blue}/>{isKo?'종목별 비중':'Allocation'}</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">{pieData.map((_,i) => (<Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>))}</Pie><Tooltip formatter={v => `${v}%`}/></PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex',flexDirection:'column',gap:5,marginTop:8 }}>
              {pieData.slice(0,8).map((item,i) => (<div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:12 }}><div style={{ display:'flex',alignItems:'center',gap:6 }}><div style={{ width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0 }}/><span style={{ color:C.textSecondary }}>{item.name}</span></div><span style={{ fontWeight:600,color:C.textPrimary,fontFamily:"'Inter',sans-serif" }}>{item.value}%</span></div>))}
            </div>
          </div>
        </div>
      )}

      {/* 운용 원칙 */}
      <div className="fund-principle" style={{ ...cardStyle,padding:"16px 20px",borderLeft:`3px solid ${C.blue}`,fontSize:13,color:C.textSecondary,lineHeight:1.6 }}>
        <strong style={{ color:C.navy }}>{isKo?'운용 원칙':'Investment Principles'}</strong> — {isKo?'VIPS 펀드는 가치투자 원칙에 기반하여 PER, PBR, DCF 등 정량적 밸류에이션과 산업 분석을 통해 저평가 종목에 집중 투자합니다. 포트폴리오는 분기별로 리밸런싱합니다.':'The VIPS Fund follows value investing principles, concentrating on undervalued stocks identified through quantitative valuation (PER, PBR, DCF) and industry analysis. The portfolio is rebalanced quarterly.'}
      </div>
    </div>
  );
}