// @ts-nocheck
import { supabase } from '../../lib/supabase';
import { adminLogin, getSession, getApprovedAlumni, getAlumniApplications } from '../../lib/supabase';
import AlumniApplicationForm from './AlumniApplicationForm';
import AdminPanel from './AdminPanel';
import FundDashboard from './FundDashboard';
import { fetchDailyPerformance, calculateMetrics } from '../../lib/googleSheets';
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid, Legend } from "recharts";
import { TrendingUp, FileText, Users, BarChart3, ChevronRight, ExternalLink, ArrowUpRight, ArrowDownRight, BookOpen, Award, Briefcase, Mail, Globe, Star, Calendar, Target, Zap, LogIn, Shield, RefreshCw, Menu, X } from "lucide-react";

const texts = {
  ko: {
    nav: { home: "홈", research: "리서치", fund: "펀드성과", alumni: "Alumni" },
    hero: { sub: "숭실대학교 가치투자학회", tagline: "가치투자의 본질을 탐구하고,\n시장을 이기는 전략을 연구합니다", cta1: "리서치 보기", cta2: "펀드 성과" },
    stats: { returnLabel: "누적 수익률", returnSub: "VIPS 펀드", alphaLabel: "초과수익 (α)", alphaSub: "vs KOSPI 벤치마크", researchLabel: "발간 리서치", researchSub: "2025년 누적", alumniLabel: "Alumni 네트워크", alumniSub: "금융업계 진출" },
    home: { chartTitle: "펀드 수익률 추이", detail: "자세히", latestResearch: "최신 리서치", viewAll: "전체보기", aboutTitle: "About VIPS", aboutText: "VIPS(Value Investment Pioneers)는 숭실대학교 금융학부 소속 가치투자 학회입니다. VIPS는 전통적인 가치 분석을 넘어, 기술의 혁신과 기업의 성장 잠재력을 심도 있게 분석합니다.매 학기 자체 펀드를 운용하며, 정기적으로 리서치 리포트를 발간하고, 금융업계 진출을 위한 커리어 역량을 키워나갑니다. CFA, AICPA 등 금융 자격증 스터디와 현직자 특강, Alumni 네트워킹을 통해 실전 금융 인재를 양성합니다.", loading: "데이터 불러오는 중..." },
    research: { title: "VIPS 리서치", desc: "VIPS 애널리스트들이 직접 작성한 기업 분석 리포트", all: "전체", target: "목표가", download: "전문은 PDF로 다운로드 가능합니다 (로그인 필요)" },
    fund: { title: "VIPS 펀드 성과", desc: "KOSPI 벤치마크 대비 VIPS 펀드 운용 수익률" },
    alumni: { title: "Alumni Network", desc: "VIPS 출신 동문들의 금융업계 진출 현황", registerTitle: "Alumni 등록", registerDesc: "VIPS 졸업생이신가요? 동문 네트워크에 등록하고 후배들과 연결되세요.", registerBtn: "등록 신청하기" },
    footer: { org: "숭실대학교 가치투자학회 · Value Investment Pioneers", addr: "서울특별시 동작구 상도로 369 숭실대학교" },
  },
  en: {
    nav: { home: "Home", research: "Research", fund: "Fund", alumni: "Alumni" },
    hero: { sub: "SOONGSIL UNIVERSITY VALUE INVESTING CLUB", tagline: "We explore the essence of value investing\nand research strategies to beat the market", cta1: "View Research", cta2: "Fund Performance" },
    stats: { returnLabel: "Cumulative Return", returnSub: "VIPS Fund", alphaLabel: "Excess Return (α)", alphaSub: "vs KOSPI Benchmark", researchLabel: "Research Published", researchSub: "2025 YTD", alumniLabel: "Alumni Network", alumniSub: "Finance Industry" },
    home: { chartTitle: "Fund Performance Trend", detail: "Details", latestResearch: "Latest Research", viewAll: "View All", aboutTitle: "About VIPS", aboutText: "VIPS (Value Investment Pioneers) is a value investing club under Soongsil University's Department of Finance. Based on the value investing philosophy of Benjamin Graham and Warren Buffett, we analyze intrinsic value of companies and research long-term investment strategies. Each semester, we manage our own fund, publish research reports regularly, and build career competencies for entering the finance industry. Through CFA and AICPA study groups, industry expert lectures, and alumni networking, we cultivate practical finance professionals.", loading: "Loading data..." },
    research: { title: "VIPS Research", desc: "Equity research reports written by VIPS analysts", all: "All", target: "Target Price", download: "Full report available for PDF download (login required)" },
    fund: { title: "VIPS Fund Performance", desc: "VIPS fund returns vs KOSPI benchmark" },
    alumni: { title: "Alumni Network", desc: "Career paths of VIPS alumni in the finance industry", registerTitle: "Alumni Registration", registerDesc: "Are you a VIPS alumnus? Register and connect with current members.", registerBtn: "Register Now" },
    footer: { org: "Soongsil University Value Investment Club · Value Investment Pioneers", addr: "369 Sangdo-ro, Dongjak-gu, Seoul, Korea" },
  },
};

const alumniData = [
  { id: 1, name: "김OO", generation: { ko: "1기", en: "Gen 1" }, year: "2018", current: { ko: "삼성증권 리서치센터", en: "Samsung Securities Research" }, role: { ko: "애널리스트", en: "Analyst" }, field: { ko: "IT/반도체 섹터", en: "IT/Semiconductor Sector" } },
  { id: 2, name: "이OO", generation: { ko: "1기", en: "Gen 1" }, year: "2018", current: { ko: "맥킨지 서울 오피스", en: "McKinsey Seoul" }, role: { ko: "경영 컨설턴트", en: "Management Consultant" }, field: { ko: "전략 컨설팅", en: "Strategy Consulting" } },
  { id: 3, name: "박OO", generation: { ko: "2기", en: "Gen 2" }, year: "2019", current: { ko: "KB자산운용", en: "KB Asset Management" }, role: { ko: "펀드매니저", en: "Fund Manager" }, field: { ko: "국내 주식형 펀드", en: "Domestic Equity Fund" } },
  { id: 4, name: "최OO", generation: { ko: "2기", en: "Gen 2" }, year: "2019", current: { ko: "JP모간 홍콩", en: "JP Morgan Hong Kong" }, role: { ko: "IB Analyst", en: "IB Analyst" }, field: { ko: "M&A Advisory", en: "M&A Advisory" } },
  { id: 5, name: "정OO", generation: { ko: "3기", en: "Gen 3" }, year: "2020", current: { ko: "미래에셋증권", en: "Mirae Asset Securities" }, role: { ko: "WM 본부", en: "Wealth Management" }, field: { ko: "자산관리", en: "Asset Management" } },
  { id: 6, name: "한OO", generation: { ko: "3기", en: "Gen 3" }, year: "2020", current: { ko: "서울대 경영대학원", en: "SNU Business School" }, role: { ko: "석사과정", en: "Master's Program" }, field: { ko: "재무관리 전공", en: "Finance Major" } },
  { id: 7, name: "윤OO", generation: { ko: "4기", en: "Gen 4" }, year: "2021", current: { ko: "NH투자증권", en: "NH Investment & Securities" }, role: { ko: "리서치 인턴", en: "Research Intern" }, field: { ko: "소비재 섹터", en: "Consumer Sector" } },
  { id: 8, name: "조OO", generation: { ko: "5기", en: "Gen 5" }, year: "2022", current: { ko: "한국투자증권", en: "Korea Investment & Securities" }, role: { ko: "트레이더", en: "Trader" }, field: { ko: "채권 트레이딩", en: "Bond Trading" } },
];

const C = { navy: "#1a2a5e", blue: "#2c4ea3", lightBlue: "#4a7ae5", accent: "#1e56b0", bg: "#f8f9fc", card: "#ffffff", border: "#e2e7f1", textPrimary: "#1a1f36", textSecondary: "#5a6278", textMuted: "#8c94a8", green: "#0ea55a", red: "#dc3545", heroBg: "linear-gradient(135deg, #1a2a5e 0%, #2c4ea3 50%, #4a7ae5 100%)" };
const colorsForModals = { primary: C.blue, bg: C.bg, cardBg: C.card, text: C.textPrimary, textSecondary: C.textSecondary, border: C.border, accent: C.lightBlue };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (<div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}><p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>{label}</p>{payload.map((p, i) => (<p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600, margin: "3px 0 0" }}>{p.name}: {p.value > 0 ? "+" : ""}{p.value}%</p>))}</div>);
  }
  return null;
};

/* ===== 핵심: CSS로 네비 표시/숨김 처리 (SSR에서도 작동) ===== */
const RESPONSIVE_CSS = `
*{box-sizing:border-box}
::selection{background:${C.lightBlue}33}
button{font-family:inherit}
input{font-family:inherit}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}

/* 데스크톱: 네비 보이고 햄버거 숨김 */
.vips-desktop-nav { display: flex !important; }
.vips-mobile-burger { display: none !important; }

/* 그리드 기본값 (데스크톱) */
.vips-stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
.vips-two-col { grid-template-columns: 1fr 1fr !important; }
.vips-hero-btns { flex-direction: row !important; }
.vips-hero-btns button { justify-content: flex-start !important; }
.vips-footer-inner { flex-direction: row !important; text-align: left !important; }
.vips-footer-logo { justify-content: flex-start !important; }
.vips-footer-right { text-align: right !important; }
.vips-fund-top3 { grid-template-columns: repeat(3, 1fr) !important; }
.vips-port-grid { grid-template-columns: 1fr 320px !important; }

@media (max-width: 768px) {
  /* 모바일: 네비 숨기고 햄버거 보임 */
  .vips-desktop-nav { display: none !important; }
  .vips-mobile-burger { display: flex !important; }

  /* 그리드 모바일 */
  .vips-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
  .vips-two-col { grid-template-columns: 1fr !important; gap: 12px !important; }
  .vips-hero-btns { flex-direction: column !important; }
  .vips-hero-btns button { justify-content: center !important; width: 100% !important; }
  .vips-footer-inner { flex-direction: column !important; text-align: center !important; }
  .vips-footer-logo { justify-content: center !important; }
  .vips-footer-right { text-align: center !important; }
  .vips-fund-top3 { grid-template-columns: 1fr !important; }
  .vips-port-grid { grid-template-columns: 1fr !important; }

  .vips-main { padding: 0 16px 60px !important; }
  .vips-header-inner { padding: 0 16px !important; }
  .vips-hero { padding: 32px 24px !important; border-radius: 16px !important; margin-top: 16px !important; }
  .vips-hero-title { font-size: 36px !important; }
  .vips-hero-title-s { font-size: 28px !important; }
  .vips-hero-sub { font-size: 10px !important; letter-spacing: 2px !important; }
  .vips-hero-tagline { font-size: 14px !important; }
  .vips-stat-value { font-size: 22px !important; }
  .vips-section-title { font-size: 20px !important; }
  .vips-about { padding: 24px 20px !important; }
  .vips-card-inner { padding: 18px !important; }
  .vips-research-item { padding: 14px 16px !important; }
  .vips-alumni-register { padding: 24px 20px !important; }
  .vips-category-btn { padding: 4px 10px !important; font-size: 11px !important; }
  .vips-modal-inner { padding: 24px !important; }
  .vips-footer { padding: 24px 16px !important; }
}

@media (max-width: 480px) {
  .vips-hero-title { font-size: 30px !important; }
  .vips-hero-title-s { font-size: 22px !important; }
  .vips-stat-value { font-size: 20px !important; }
}
`;

export default function VIPSHomepage() {
  const [lang, setLang] = useState("ko");
  const [activeTab, setActiveTab] = useState("home");
  const [animateIn, setAnimateIn] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterCategory, setFilterCategory] = useState("전체");
  const [dbResearch, setDbResearch] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAlumniForm, setShowAlumniForm] = useState(false);
  const [approvedAlumni, setApprovedAlumni] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [fundLoading, setFundLoading] = useState(true);

  useEffect(() => { const f = async () => { const { data } = await supabase.from('research').select('*').order('created_at', { ascending: false }); if (data && data.length > 0) { setDbResearch(data.map(item => ({ id: item.id, title: { ko: item.title, en: item.title }, author: item.author, date: item.date, category: { ko: item.sector?.replace('IT/Semiconductor','IT/반도체').replace('Automotive','자동차').replace('Internet/Platform','인터넷/플랫폼').replace('Finance','금융').replace('Bio/Healthcare','바이오/헬스케어') || 'IT/반도체', en: item.sector || 'IT/Semiconductor' }, rating: item.rating || 'BUY', target: item.target_price || '', summary: { ko: item.summary || '', en: item.summary || '' }, pdf_url: item.pdf_url || '' }))); } }; f(); }, []);
  useEffect(() => { const f = async () => { try { const s = await getSession(); if (s) { setIsAdmin(true); const p = await getAlumniApplications('pending'); setPendingCount(p?.length || 0); } } catch(e){} }; f(); }, []);
  useEffect(() => { const f = async () => { try { const d = await getApprovedAlumni(); if (d && d.length > 0) setApprovedAlumni(d); } catch(e){} }; f(); }, []);
  useEffect(() => { const f = async () => { setFundLoading(true); try { const d = await fetchDailyPerformance(); if (d && d.length >= 1) { setLiveMetrics(calculateMetrics(d)); } } catch(e){} finally { setFundLoading(false); } }; f(); }, []);

  const t = texts[lang];
  useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);
  useEffect(() => { setAnimateIn(false); setTimeout(() => setAnimateIn(true), 50); }, [activeTab]);
  useEffect(() => { document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [mobileMenuOpen]);

  const handleTabChange = (id) => { setActiveTab(id); setSelectedReport(null); setFilterCategory(lang === "ko" ? "전체" : "All"); setMobileMenuOpen(false); };
  const handleAdminLogin = async () => { setLoginLoading(true); setLoginError(''); try { await adminLogin(loginEmail, loginPassword); setIsAdmin(true); setShowLoginModal(false); setLoginEmail(''); setLoginPassword(''); const p = await getAlumniApplications('pending'); setPendingCount(p?.length || 0); } catch(e) { setLoginError('이메일 또는 비밀번호가 올바르지 않습니다.'); } finally { setLoginLoading(false); } };
  const handleAdminLogout = () => { setIsAdmin(false); setPendingCount(0); };

  const categories = lang === "ko" ? ["전체","IT/반도체","자동차","인터넷/플랫폼","금융","바이오/헬스케어"] : ["All","IT/Semiconductor","Automotive","Internet/Platform","Finance","Bio/Healthcare"];
  const activeResearch = dbResearch.length > 0 ? dbResearch : [];
  const filteredReports = (filterCategory === "전체" || filterCategory === "All") ? activeResearch : activeResearch.filter(r => r.category[lang] === filterCategory);
  const latestVIPS = liveMetrics ? liveMetrics.vipsReturn : null;
  const alpha = liveMetrics ? liveMetrics.alpha : null;
  const homeChartData = liveMetrics && liveMetrics.chartData.length > 0 ? liveMetrics.chartData : [];
  const navItems = [{ id: "home", label: t.nav.home, icon: <Star size={15}/> },{ id: "research", label: t.nav.research, icon: <FileText size={15}/> },{ id: "fund", label: t.nav.fund, icon: <BarChart3 size={15}/> },{ id: "alumni", label: t.nav.alumni, icon: <Users size={15}/> }];
  const ratingColor = (r) => r === "STRONG BUY" ? C.green : r === "BUY" ? C.blue : r === "HOLD" ? C.textMuted : C.red;
  const ratingBg = (r) => r === "STRONG BUY" ? "#e6f9ef" : r === "BUY" ? "#e8effc" : r === "HOLD" ? "#f0f1f4" : "#fde8ea";
  const cardStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
  const displayReturn = (v) => v === null || v === undefined ? '-' : `${v > 0 ? '+' : ''}${v}%`;
  const displayColor = (v, p, n) => v === null || v === undefined ? C.textMuted : v >= 0 ? p : n;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.textPrimary, fontFamily: "'Noto Sans KR','Inter',-apple-system,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{RESPONSIVE_CSS}</style>

      {/* HEADER */}
      <header style={{ position:"sticky",top:0,zIndex:50,background:"rgba(255,255,255,0.92)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.border}` }}>
        <div className="vips-header-inner" style={{ maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,padding:"0 24px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer" }} onClick={() => handleTabChange("home")}>
            <div style={{ display:"flex",alignItems:"baseline" }}>
              <span style={{ fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:26,color:C.navy,letterSpacing:-1,lineHeight:1 }}>VIP</span>
              <span style={{ fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:20,color:C.lightBlue,letterSpacing:-1,lineHeight:1 }}>s</span>
            </div>
            <div style={{ height:20,width:1,background:C.border }} />
            <span style={{ fontSize:10,color:C.textMuted,letterSpacing:0.5,lineHeight:1.2 }}>Value Investment<br/>Pioneers</span>
          </div>

          {/* 데스크톱 네비 - CSS로 표시/숨김 */}
          <nav className="vips-desktop-nav" style={{ alignItems:"center",gap:2 }}>
            {navItems.map(item => (<button key={item.id} onClick={() => handleTabChange(item.id)} style={{ background:activeTab===item.id?`${C.blue}0d`:"transparent",border:"none",color:activeTab===item.id?C.blue:C.textSecondary,padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:activeTab===item.id?600:500,transition:"all 0.15s",display:"flex",alignItems:"center",gap:5 }}>{item.icon}<span>{item.label}</span></button>))}
            <div style={{ marginLeft:8,display:"flex",alignItems:"center",background:"#f0f2f5",borderRadius:8,padding:2 }}>
              {["ko","en"].map(l => (<button key={l} onClick={() => {setLang(l);setFilterCategory(l==="ko"?"전체":"All");}} style={{ background:lang===l?"#fff":"transparent",border:"none",color:lang===l?C.navy:C.textMuted,padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600,boxShadow:lang===l?"0 1px 3px rgba(0,0,0,0.08)":"none" }}>{l==="ko"?"한국어":"EN"}</button>))}
            </div>
            {!isAdmin ? (<button onClick={() => setShowLoginModal(true)} style={{ background:'none',border:'none',color:C.textMuted,cursor:'pointer',padding:'6px',marginLeft:6,opacity:0.4 }}><LogIn size={16}/></button>) : (<button onClick={() => setShowAdminPanel(true)} style={{ padding:'6px 14px',marginLeft:8,backgroundColor:`${C.blue}15`,color:C.blue,border:`1px solid ${C.blue}33`,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:5,position:'relative' }}><Shield size={14}/>{lang==='ko'?'관리자':'Admin'}{pendingCount>0&&<span style={{ position:'absolute',top:-6,right:-6,backgroundColor:'#ef4444',color:'#fff',fontSize:10,fontWeight:700,width:18,height:18,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}>{pendingCount}</span>}</button>)}
          </nav>

          {/* 모바일 햄버거 - CSS로 표시/숨김 */}
          <button className="vips-mobile-burger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",color:C.navy,padding:6 }}>
            {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>

      </header>

      {/* 모바일 풀스크린 메뉴 - header 바깥에 위치해야 stacking context 문제 없음 */}
      {mobileMenuOpen && (
        <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"#ffffff",display:"flex",flexDirection:"column",paddingTop:70,paddingLeft:24,paddingRight:24,paddingBottom:24,zIndex:9999 }}>
          <button onClick={() => setMobileMenuOpen(false)} style={{ position:"absolute",top:18,right:16,background:"none",border:"none",cursor:"pointer",color:C.navy,padding:6 }}><X size={24}/></button>
          <div style={{ display:"flex",alignItems:"baseline",marginBottom:24 }}>
            <span style={{ fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:26,color:C.navy,letterSpacing:-1 }}>VIP</span>
            <span style={{ fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:20,color:C.lightBlue,letterSpacing:-1 }}>s</span>
          </div>
          {navItems.map(item => (<button key={item.id} onClick={() => handleTabChange(item.id)} style={{ background:activeTab===item.id?`${C.blue}0d`:"transparent",border:"none",color:activeTab===item.id?C.blue:C.textSecondary,padding:"14px 16px",borderRadius:10,cursor:"pointer",fontSize:16,fontWeight:activeTab===item.id?700:500,display:"flex",alignItems:"center",gap:10,textAlign:"left",width:"100%" }}>{item.icon}<span>{item.label}</span></button>))}
          <div style={{ borderTop:`1px solid ${C.border}`,marginTop:16,paddingTop:16,display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ display:"flex",background:"#f0f2f5",borderRadius:8,padding:2 }}>
              {["ko","en"].map(l => (<button key={l} onClick={() => {setLang(l);setFilterCategory(l==="ko"?"전체":"All");}} style={{ background:lang===l?"#fff":"transparent",border:"none",color:lang===l?C.navy:C.textMuted,padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,boxShadow:lang===l?"0 1px 3px rgba(0,0,0,0.08)":"none" }}>{l==="ko"?"한국어":"EN"}</button>))}
            </div>
            {!isAdmin ? (<button onClick={() => {setShowLoginModal(true);setMobileMenuOpen(false);}} style={{ background:'none',border:'none',color:C.textMuted,cursor:'pointer',padding:'6px',opacity:0.4 }}><LogIn size={18}/></button>) : (<button onClick={() => {setShowAdminPanel(true);setMobileMenuOpen(false);}} style={{ padding:'6px 14px',backgroundColor:`${C.blue}15`,color:C.blue,border:`1px solid ${C.blue}33`,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:5 }}><Shield size={14}/>{lang==='ko'?'관리자':'Admin'}</button>)}
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="vips-main" style={{ maxWidth:1120,margin:"0 auto",padding:"0 24px 80px",opacity:animateIn?1:0,transform:animateIn?"translateY(0)":"translateY(10px)",transition:"all 0.45s cubic-bezier(0.22,1,0.36,1)" }}>

        {activeTab === "home" && (<div>
          {/* Hero */}
          <div className="vips-hero" style={{ background:C.heroBg,borderRadius:20,padding:"56px 48px",marginTop:24,position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",top:-60,right:-40,width:260,height:260,borderRadius:"50%",background:"rgba(255,255,255,0.06)" }} />
            <div style={{ position:"absolute",bottom:-80,left:-50,width:300,height:300,borderRadius:"50%",background:"rgba(255,255,255,0.03)" }} />
            <div style={{ position:"relative",zIndex:1 }}>
              <div className="vips-hero-sub" style={{ fontSize:11,letterSpacing:3,color:"rgba(255,255,255,0.6)",marginBottom:12,fontWeight:600,textTransform:"uppercase" }}>{t.hero.sub}</div>
              <div style={{ display:"flex",alignItems:"baseline",marginBottom:16 }}>
                <span className="vips-hero-title" style={{ fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:52,color:"#fff",letterSpacing:-2,lineHeight:1 }}>VIP</span>
                <span className="vips-hero-title-s" style={{ fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:40,color:"rgba(255,255,255,0.7)",letterSpacing:-2,lineHeight:1 }}>s</span>
              </div>
              <p className="vips-hero-tagline" style={{ fontSize:16,color:"rgba(255,255,255,0.75)",lineHeight:1.7,whiteSpace:"pre-line",margin:"0 0 28px" }}>{t.hero.tagline}</p>
              <div className="vips-hero-btns" style={{ display:"flex",gap:10 }}>
                <button onClick={() => setActiveTab("research")} style={{ background:"#fff",color:C.navy,border:"none",padding:"11px 24px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}><FileText size={15}/> {t.hero.cta1}</button>
                <button onClick={() => setActiveTab("fund")} style={{ background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.25)",padding:"11px 24px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,backdropFilter:"blur(4px)" }}><TrendingUp size={15}/> {t.hero.cta2}</button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="vips-stats-grid" style={{ display:"grid",gap:14,marginTop:20 }}>
            {[{ label:t.stats.returnLabel,value:fundLoading?'-':displayReturn(latestVIPS),sub:t.stats.returnSub,color:fundLoading?C.textMuted:displayColor(latestVIPS,C.green,C.red),icon:<TrendingUp size={18}/> },{ label:t.stats.alphaLabel,value:fundLoading?'-':displayReturn(alpha),sub:t.stats.alphaSub,color:fundLoading?C.textMuted:displayColor(alpha,C.blue,C.red),icon:<Zap size={18}/> },{ label:t.stats.researchLabel,value:`${activeResearch.length}${lang==="ko"?"편":""}`,sub:t.stats.researchSub,color:C.lightBlue,icon:<BookOpen size={18}/> },{ label:t.stats.alumniLabel,value:`${approvedAlumni.length>0?approvedAlumni.length:alumniData.length}${lang==="ko"?"명":""}`,sub:t.stats.alumniSub,color:C.navy,icon:<Users size={18}/> }].map((s,i) => (
              <div key={i} style={{ ...cardStyle,padding:"20px 18px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <div style={{ fontSize:12,color:C.textMuted,marginBottom:6,fontWeight:500 }}>{s.label}</div>
                  <div style={{ color:s.color,opacity:0.5 }}>{s.icon}</div>
                </div>
                <div className="vips-stat-value" style={{ fontSize:26,fontWeight:800,color:s.color,fontFamily:"'Inter',sans-serif",letterSpacing:-0.5 }}>{s.value}</div>
                <div style={{ fontSize:11,color:C.textMuted,marginTop:4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Chart + Research */}
          <div className="vips-two-col" style={{ display:"grid",gap:16,marginTop:16 }}>
            <div className="vips-card-inner" style={{ ...cardStyle,padding:24 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
                <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:C.navy }}>{t.home.chartTitle}</h3>
                <button onClick={() => setActiveTab("fund")} style={{ background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:3,fontWeight:500 }}>{t.home.detail} <ChevronRight size={14}/></button>
              </div>
              {fundLoading ? (<div style={{ height:190,display:'flex',alignItems:'center',justifyContent:'center' }}><div style={{ textAlign:'center' }}><RefreshCw size={20} color={C.textMuted} style={{ animation:'spin 1s linear infinite' }}/><p style={{ color:C.textMuted,fontSize:12,marginTop:8 }}>{t.home.loading}</p></div></div>) : homeChartData.length > 0 ? (<ResponsiveContainer width="100%" height={190}><AreaChart data={homeChartData}><defs><linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.2}/><stop offset="100%" stopColor={C.blue} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#eef0f5"/><XAxis dataKey="date" tick={{ fill:C.textMuted,fontSize:10 }} axisLine={false} tickLine={false} interval={Math.max(0,Math.floor(homeChartData.length/6))}/><YAxis tick={{ fill:C.textMuted,fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`}/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="vips" stroke={C.blue} strokeWidth={2.5} fill="url(#blueGrad)" name="VIPS"/><Line type="monotone" dataKey="kospi" stroke="#c0c7d4" strokeWidth={1.5} strokeDasharray="5 3" name="KOSPI" dot={false}/></AreaChart></ResponsiveContainer>) : (<div style={{ height:190,display:'flex',alignItems:'center',justifyContent:'center' }}><p style={{ color:C.textMuted,fontSize:13 }}>{lang==='ko'?'데이터가 쌓이면 차트가 표시됩니다.':'Chart will appear as data accumulates.'}</p></div>)}
            </div>
            <div className="vips-card-inner" style={{ ...cardStyle,padding:24 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
                <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:C.navy }}>{t.home.latestResearch}</h3>
                <button onClick={() => setActiveTab("research")} style={{ background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:3,fontWeight:500 }}>{t.home.viewAll} <ChevronRight size={14}/></button>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {activeResearch.length > 0 ? activeResearch.slice(0,4).map(r => (<div key={r.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,cursor:"pointer" }} onClick={() => {setActiveTab("research");setSelectedReport(r);}}><div style={{ minWidth:0,flex:1 }}><div style={{ fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{r.title[lang]}</div><div style={{ fontSize:11,color:C.textMuted,marginTop:2 }}>{r.author} · {r.date}</div></div><span style={{ fontSize:10,fontWeight:700,color:ratingColor(r.rating),background:ratingBg(r.rating),padding:"3px 8px",borderRadius:4,flexShrink:0,marginLeft:8 }}>{r.rating}</span></div>)) : (<div style={{ padding:20,textAlign:'center',color:C.textMuted,fontSize:13 }}>{lang==='ko'?'등록된 리서치가 없습니다.':'No research reports yet.'}</div>)}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="vips-about" style={{ ...cardStyle,marginTop:16,padding:"32px 36px",borderLeft:`4px solid ${C.blue}` }}>
            <h3 style={{ fontSize:18,margin:"0 0 12px",color:C.navy,fontWeight:700 }}>{t.home.aboutTitle}</h3>
            <p style={{ color:C.textSecondary,lineHeight:1.8,fontSize:14,margin:0 }}>{t.home.aboutText}</p>
          </div>
        </div>)}

        {activeTab === "research" && (<div style={{ paddingTop:32 }}>
          <h2 className="vips-section-title" style={{ fontSize:24,margin:"0 0 6px",fontWeight:800,color:C.navy,display:"flex",alignItems:"center",gap:8 }}><BookOpen size={22} style={{ color:C.blue }}/> {t.research.title}</h2>
          <p style={{ color:C.textMuted,fontSize:14,margin:"0 0 20px" }}>{t.research.desc}</p>
          <div style={{ display:"flex",gap:6,marginBottom:20,flexWrap:"wrap" }}>{categories.map(cat => (<button className="vips-category-btn" key={cat} onClick={() => setFilterCategory(cat)} style={{ background:filterCategory===cat?C.blue:"#fff",border:`1px solid ${filterCategory===cat?C.blue:C.border}`,color:filterCategory===cat?"#fff":C.textSecondary,padding:"5px 14px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:500 }}>{cat}</button>))}</div>
          {selectedReport && (<div className="vips-card-inner" style={{ ...cardStyle,padding:28,marginBottom:16,borderTop:`3px solid ${C.blue}` }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}><div style={{ flex:1,minWidth:0 }}><div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:8,flexWrap:"wrap" }}><span style={{ fontSize:11,background:`${C.blue}10`,color:C.blue,padding:"2px 8px",borderRadius:4,fontWeight:500 }}>{selectedReport.category[lang]}</span><span style={{ fontSize:11,fontWeight:700,color:ratingColor(selectedReport.rating),background:ratingBg(selectedReport.rating),padding:"2px 8px",borderRadius:4 }}>{selectedReport.rating}</span></div><h3 style={{ margin:"0 0 6px",fontSize:20,fontWeight:700,color:C.navy }}>{selectedReport.title[lang]}</h3><div style={{ fontSize:13,color:C.textMuted }}>{selectedReport.author} · {selectedReport.date} · {t.research.target} ₩{selectedReport.target}</div></div><button onClick={() => setSelectedReport(null)} style={{ background:"#f0f2f5",border:"none",color:C.textMuted,cursor:"pointer",width:28,height:28,borderRadius:6,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:12 }}>✕</button></div><p style={{ color:C.textSecondary,lineHeight:1.7,marginTop:14,fontSize:14 }}>{selectedReport.summary[lang]}</p>{selectedReport.pdf_url ? (<a href={selectedReport.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display:"block",marginTop:14,padding:14,borderRadius:8,background:"#f8f9fb",border:`1px solid ${C.border}`,fontSize:13,color:C.blue,textDecoration:"none",fontWeight:600 }}>📄 PDF 다운로드</a>) : (<div style={{ marginTop:14,padding:14,borderRadius:8,background:"#f8f9fb",border:`1px solid ${C.border}`,fontSize:13,color:C.textMuted }}>📄 {t.research.download}</div>)}</div>)}
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>{filteredReports.map(r => (<div key={r.id} onClick={() => setSelectedReport(r)} className="vips-research-item" style={{ ...cardStyle,display:"grid",gridTemplateColumns:"1fr auto",alignItems:"center",padding:"18px 22px",cursor:"pointer",borderColor:selectedReport?.id===r.id?C.lightBlue:C.border,background:selectedReport?.id===r.id?`${C.blue}04`:"#fff" }}><div><div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:5 }}><span style={{ fontSize:11,color:C.textMuted,background:"#f0f2f5",padding:"2px 8px",borderRadius:4 }}>{r.category[lang]}</span><span style={{ fontSize:11,fontWeight:700,color:ratingColor(r.rating) }}>{r.rating}</span></div><div style={{ fontSize:15,fontWeight:600,marginBottom:3,color:C.navy }}>{r.title[lang]}</div><div style={{ fontSize:12,color:C.textMuted }}>{r.author} · {r.date} · {t.research.target} <span style={{ color:C.blue,fontWeight:600 }}>₩{r.target}</span></div></div><ChevronRight size={16} style={{ color:C.textMuted }}/></div>))}</div>
        </div>)}

        {activeTab === "fund" && <FundDashboard lang={lang} />}

        {activeTab === "alumni" && (<div style={{ paddingTop:32 }}>
          <h2 className="vips-section-title" style={{ fontSize:24,margin:"0 0 6px",fontWeight:800,color:C.navy,display:"flex",alignItems:"center",gap:8 }}><Award size={22} style={{ color:C.blue }}/> {t.alumni.title}</h2>
          <p style={{ color:C.textMuted,fontSize:14,margin:"0 0 24px" }}>{t.alumni.desc}</p>
          <div className="vips-two-col" style={{ display:"grid",gap:12 }}>
            {approvedAlumni.length > 0 ? approvedAlumni.map(a => (<div key={a.id} style={{ ...cardStyle,padding:18 }}><div style={{ display:"flex",gap:12,alignItems:"flex-start" }}><div style={{ width:42,height:42,borderRadius:10,flexShrink:0,background:`linear-gradient(135deg,${C.blue}18,${C.lightBlue}10)`,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${C.blue}20`,color:C.blue }}><Users size={18}/></div><div style={{ flex:1,minWidth:0 }}><div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap" }}><span style={{ fontWeight:600,fontSize:14,color:C.navy }}>{a.name}</span>{a.generation&&<span style={{ fontSize:10,color:C.blue,background:`${C.blue}0d`,padding:"1px 6px",borderRadius:3,fontWeight:600 }}>{a.generation} ({a.graduation_year})</span>}</div><div style={{ fontSize:13,color:C.textPrimary,marginBottom:1,display:"flex",alignItems:"center",gap:4 }}><Briefcase size={11} style={{ color:C.textMuted,flexShrink:0 }}/><span style={{ overflow:"hidden",textOverflow:"ellipsis" }}>{a.job_role}{a.current_company?` @ ${a.current_company}`:''}</span></div><div style={{ fontSize:12,color:C.textMuted }}>{a.major}</div>{(a.phone||a.linkedin)&&<div style={{ display:'flex',gap:10,marginTop:6,fontSize:11,color:C.textMuted,flexWrap:'wrap' }}>{a.phone&&<span>📞 {a.phone}</span>}{a.linkedin&&<span>🔗 {a.linkedin}</span>}</div>}{a.message&&<div style={{ fontSize:12,color:C.textSecondary,marginTop:6,fontStyle:'italic' }}>"{a.message}"</div>}</div></div></div>)) : alumniData.map(a => (<div key={a.id} style={{ ...cardStyle,padding:18 }}><div style={{ display:"flex",gap:12,alignItems:"flex-start" }}><div style={{ width:42,height:42,borderRadius:10,flexShrink:0,background:`linear-gradient(135deg,${C.blue}18,${C.lightBlue}10)`,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${C.blue}20`,color:C.blue }}><Users size={18}/></div><div style={{ flex:1,minWidth:0 }}><div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap" }}><span style={{ fontWeight:600,fontSize:14,color:C.navy }}>{a.name}</span><span style={{ fontSize:10,color:C.blue,background:`${C.blue}0d`,padding:"1px 6px",borderRadius:3,fontWeight:600 }}>{a.generation[lang]} ({a.year})</span></div><div style={{ fontSize:13,color:C.textPrimary,marginBottom:1,display:"flex",alignItems:"center",gap:4 }}><Briefcase size={11} style={{ color:C.textMuted,flexShrink:0 }}/><span>{a.current[lang]}</span></div><div style={{ fontSize:12,color:C.textMuted }}>{a.role[lang]} · {a.field[lang]}</div></div></div></div>))}
          </div>
          <div className="vips-alumni-register" style={{ ...cardStyle,marginTop:24,padding:"28px 32px",textAlign:"center",background:`linear-gradient(135deg,${C.blue}08,${C.lightBlue}05)`,border:`1px solid ${C.blue}18` }}><Mail size={20} style={{ color:C.blue,marginBottom:8 }}/><h4 style={{ margin:"0 0 6px",fontSize:16,fontWeight:700,color:C.navy }}>{t.alumni.registerTitle}</h4><p style={{ fontSize:13,color:C.textMuted,margin:"0 0 14px" }}>{t.alumni.registerDesc}</p><button onClick={() => setShowAlumniForm(true)} style={{ background:C.heroBg,color:"#fff",border:"none",padding:"10px 24px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 8px rgba(26,42,94,0.25)" }}>{t.alumni.registerBtn}</button></div>
        </div>)}
      </main>

      {/* FOOTER */}
      <footer className="vips-footer" style={{ borderTop:`1px solid ${C.border}`,padding:"28px 24px",background:"#fff" }}>
        <div className="vips-footer-inner" style={{ maxWidth:1120,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
          <div><div className="vips-footer-logo" style={{ display:"flex",alignItems:"baseline" }}><span style={{ fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:18,color:C.navy }}>VIP</span><span style={{ fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:14,color:C.lightBlue }}>s</span></div><div style={{ fontSize:11,color:C.textMuted,marginTop:3 }}>{t.footer.org}</div></div>
          <div className="vips-footer-right" style={{ fontSize:11,color:C.textMuted }}><div>© 2025 VIPS. All rights reserved.</div><div style={{ marginTop:2 }}>{t.footer.addr}</div></div>
        </div>
      </footer>

      {showLoginModal && (<div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20 }} onClick={() => setShowLoginModal(false)}><div className="vips-modal-inner" style={{ backgroundColor:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:32,width:'100%',maxWidth:400,boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}><div style={{ textAlign:'center',marginBottom:24 }}><div style={{ width:48,height:48,borderRadius:12,margin:'0 auto 12px',background:`${C.blue}12`,display:'flex',alignItems:'center',justifyContent:'center' }}><Shield size={24} color={C.blue}/></div><h3 style={{ color:C.textPrimary,fontSize:18,fontWeight:700,margin:'0 0 4px' }}>{lang==='ko'?'관리자 로그인':'Admin Login'}</h3><p style={{ color:C.textMuted,fontSize:13,margin:0 }}>{lang==='ko'?'VIPS 관리자 계정으로 로그인하세요':'Sign in with your VIPS admin account'}</p></div>{loginError&&<div style={{ padding:10,backgroundColor:'rgba(220,53,69,0.08)',border:'1px solid rgba(220,53,69,0.2)',borderRadius:8,color:C.red,fontSize:13,marginBottom:16,textAlign:'center' }}>{loginError}</div>}<div style={{ display:'flex',flexDirection:'column',gap:12 }}><input type="email" placeholder={lang==='ko'?'이메일':'Email'} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleAdminLogin()} style={{ width:'100%',padding:'11px 14px',backgroundColor:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPrimary,fontSize:14,outline:'none',boxSizing:'border-box' }}/><input type="password" placeholder={lang==='ko'?'비밀번호':'Password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleAdminLogin()} style={{ width:'100%',padding:'11px 14px',backgroundColor:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPrimary,fontSize:14,outline:'none',boxSizing:'border-box' }}/><button onClick={handleAdminLogin} disabled={loginLoading} style={{ width:'100%',padding:12,marginTop:4,background:loginLoading?C.border:C.heroBg,color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:loginLoading?'not-allowed':'pointer',boxShadow:loginLoading?'none':'0 2px 8px rgba(26,42,94,0.3)' }}>{loginLoading?(lang==='ko'?'로그인 중...':'Signing in...'):(lang==='ko'?'로그인':'Sign In')}</button></div></div></div>)}

      <AlumniApplicationForm isOpen={showAlumniForm} onClose={() => setShowAlumniForm(false)} colors={colorsForModals} />
      <AdminPanel isOpen={showAdminPanel} onClose={async () => { setShowAdminPanel(false); try { const d = await getApprovedAlumni(); if(d) setApprovedAlumni(d); const p = await getAlumniApplications('pending'); setPendingCount(p?.length||0); const {data:r} = await supabase.from('research').select('*').order('created_at',{ascending:false}); if(r&&r.length>0){setDbResearch(r.map(item=>({id:item.id,title:{ko:item.title,en:item.title},author:item.author,date:item.date,category:{ko:item.sector?.replace('IT/Semiconductor','IT/반도체').replace('Automotive','자동차').replace('Internet/Platform','인터넷/플랫폼').replace('Finance','금융').replace('Bio/Healthcare','바이오/헬스케어')||'IT/반도체',en:item.sector||'IT/Semiconductor'},rating:item.rating||'BUY',target:item.target_price||'',summary:{ko:item.summary||'',en:item.summary||''},pdf_url:item.pdf_url||''})));} } catch(e){console.error('Refresh error:',e);} }} onLogout={handleAdminLogout} colors={colorsForModals} />
    </div>
  );
}