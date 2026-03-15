// @ts-nocheck
// app/components/AdminPanel.tsx
// 관리자 패널 - Alumni 승인 + 리서치 관리 + 회원 관리
'use client';

import React, { useState, useEffect } from 'react';
import { X, LogOut, UserCheck, UserX, Trash2, CheckCircle, XCircle, FileText, Upload, Edit3, Save, ChevronDown, ChevronUp, Users, BookOpen, Shield, UserPlus } from 'lucide-react';
import { getAlumniApplications, approveAlumni, rejectAlumni, deleteAlumniApplication, getResearchReports, createResearch, updateResearch, deleteResearch, uploadPDF, adminLogout, getAllMembers, approveMember, rejectMember, deleteMember } from '../../lib/supabase';

export default function AdminPanel({ isOpen, onClose, onLogout, colors }) {
  const [activeTab, setActiveTab] = useState('alumni');

  // Alumni
  const [applications, setApplications] = useState([]);
  const [alumniFilter, setAlumniFilter] = useState('pending');
  const [alumniLoading, setAlumniLoading] = useState(false);
  const [expandedApp, setExpandedApp] = useState(null);

  // Members
  const [members, setMembers] = useState([]);
  const [memberFilter, setMemberFilter] = useState('pending');
  const [memberLoading, setMemberLoading] = useState(false);

  // Research
  const [reports, setReports] = useState([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [showResearchForm, setShowResearchForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [researchForm, setResearchForm] = useState({ title: '', author: '', summary: '', rating: 'BUY', sector: 'IT/Semiconductor', target_price: '', pdf_url: '' });
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (isOpen) { loadAlumni(); loadResearch(); loadMembers(); } }, [isOpen]);
  useEffect(() => { if (isOpen) loadAlumni(); }, [alumniFilter]);
  useEffect(() => { if (isOpen) loadMembers(); }, [memberFilter]);

  const loadAlumni = async () => {
    setAlumniLoading(true);
    try { const d = await getAlumniApplications(alumniFilter === 'all' ? null : alumniFilter); setApplications(d || []); } catch (e) {}
    finally { setAlumniLoading(false); }
  };
  const loadResearch = async () => {
    setResearchLoading(true);
    try { const d = await getResearchReports(); setReports(d || []); } catch (e) {}
    finally { setResearchLoading(false); }
  };
  const loadMembers = async () => {
    setMemberLoading(true);
    try { const d = await getAllMembers(memberFilter === 'all' ? null : memberFilter); setMembers(d || []); } catch (e) {}
    finally { setMemberLoading(false); }
  };

  const handleApproveAlumni = async (id) => { try { await approveAlumni(id); await loadAlumni(); } catch (e) { alert('오류 발생'); } };
  const handleRejectAlumni = async (id) => { try { await rejectAlumni(id); await loadAlumni(); } catch (e) { alert('오류 발생'); } };
  const handleDeleteAlumni = async (id) => { if (!confirm('삭제?')) return; try { await deleteAlumniApplication(id); await loadAlumni(); } catch (e) { alert('오류 발생'); } };

  const handleApproveMember = async (id) => { try { await approveMember(id); await loadMembers(); } catch (e) { alert('오류 발생'); } };
  const handleRejectMember = async (id) => { try { await rejectMember(id); await loadMembers(); } catch (e) { alert('오류 발생'); } };
  const handleDeleteMember = async (id) => { if (!confirm('삭제?')) return; try { await deleteMember(id); await loadMembers(); } catch (e) { alert('오류 발생'); } };

  const resetResearchForm = () => { setResearchForm({ title: '', author: '', summary: '', rating: 'BUY', sector: 'IT/Semiconductor', target_price: '', pdf_url: '' }); setPdfFile(null); setEditingReport(null); setShowResearchForm(false); };
  const handleEditResearch = (r) => { setResearchForm({ title: r.title||'', author: r.author||'', summary: r.summary||'', rating: r.rating||'BUY', sector: r.sector||'IT/Semiconductor', target_price: r.target_price||'', pdf_url: r.pdf_url||'' }); setEditingReport(r); setShowResearchForm(true); };
  const handleSubmitResearch = async () => {
    if (!researchForm.title || !researchForm.author) { alert('제목과 작성자 필수'); return; }
    setUploading(true);
    try {
      let url = researchForm.pdf_url;
      if (pdfFile) url = await uploadPDF(pdfFile);
      const d = { ...researchForm, pdf_url: url };
      if (editingReport) await updateResearch(editingReport.id, d); else await createResearch(d);
      await loadResearch(); resetResearchForm();
    } catch (e) { alert('저장 오류'); } finally { setUploading(false); }
  };
  const handleDeleteResearch = async (id) => { if (!confirm('삭제?')) return; try { await deleteResearch(id); await loadResearch(); } catch (e) { alert('오류'); } };
  const handleLogout = async () => { try { await adminLogout(); onLogout(); onClose(); } catch (e) {} };

  if (!isOpen) return null;

  const overlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' };
  const panel = { backgroundColor: colors.bg, borderRadius: '16px', border: `1px solid ${colors.border}`, width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
  const tabBtn = (active) => ({ padding: '8px 16px', backgroundColor: active ? colors.primary : 'transparent', color: active ? '#fff' : colors.textSecondary, border: active ? 'none' : `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' });
  const filterBtn = (active) => ({ padding: '5px 12px', backgroundColor: active ? `${colors.primary}22` : 'transparent', color: active ? colors.primary : colors.textSecondary, border: `1px solid ${active ? colors.primary + '44' : colors.border}`, borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' });
  const input = { width: '100%', padding: '9px 12px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const card = { backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '16px', marginBottom: '10px' };
  const statusC = { pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444' };
  const statusL = { pending: '대기중', approved: '승인됨', rejected: '거절됨' };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Shield size={20} color={colors.primary} /><span style={{ color: colors.text, fontSize: '17px', fontWeight: 700 }}>관리자 패널</span></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleLogout} style={{ padding: '6px 14px', backgroundColor: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.textSecondary, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><LogOut size={14} /> 로그아웃</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
          </div>
        </div>

        {/* 탭 */}
        <div style={{ padding: '12px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('alumni')} style={tabBtn(activeTab === 'alumni')}><Users size={14} /> Alumni</button>
          <button onClick={() => setActiveTab('members')} style={tabBtn(activeTab === 'members')}><UserPlus size={14} /> 회원</button>
          <button onClick={() => setActiveTab('research')} style={tabBtn(activeTab === 'research')}><BookOpen size={14} /> 리서치</button>
        </div>

        {/* 콘텐츠 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

          {/* ===== ALUMNI 탭 ===== */}
          {activeTab === 'alumni' && (<div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['pending', 'approved', 'rejected', 'all'].map(f => (
                <button key={f} onClick={() => setAlumniFilter(f)} style={filterBtn(alumniFilter === f)}>
                  {{ pending: '⏳ 대기중', approved: '✅ 승인됨', rejected: '❌ 거절됨', all: '📋 전체' }[f]}
                </button>
              ))}
            </div>
            {alumniLoading ? <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>로딩 중...</div> :
            applications.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>해당하는 신청이 없습니다.</div> :
            applications.map(app => (
              <div key={app.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusC[app.status] || '#666' }} />
                    <div>
                      <div style={{ color: colors.text, fontWeight: 600, fontSize: '15px' }}>{app.name}{app.generation && <span style={{ color: colors.textSecondary, fontWeight: 400, marginLeft: 8, fontSize: 13 }}>{app.generation}</span>}</div>
                      <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{app.major} · {app.student_id || app.graduation_year}학번 · {new Date(app.created_at).toLocaleDateString('ko-KR')} 신청</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: `${statusC[app.status]}22`, color: statusC[app.status] }}>{statusL[app.status]}</span>
                    {expandedApp === app.id ? <ChevronUp size={16} color={colors.textSecondary} /> : <ChevronDown size={16} color={colors.textSecondary} />}
                  </div>
                </div>
                {expandedApp === app.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                      <div><span style={{ color: colors.textSecondary }}>이메일:</span> {app.email}</div>
                      <div><span style={{ color: colors.textSecondary }}>전화:</span> {app.phone || '-'}</div>
                      <div><span style={{ color: colors.textSecondary }}>직장:</span> {app.current_company || '-'}</div>
                      <div><span style={{ color: colors.textSecondary }}>직책:</span> {app.job_role || '-'}</div>
                      {app.linkedin && <div style={{ gridColumn: '1/-1' }}><span style={{ color: colors.textSecondary }}>SNS:</span> <span style={{ color: colors.primary }}>{app.linkedin}</span></div>}
                      {app.message && <div style={{ gridColumn: '1/-1' }}><span style={{ color: colors.textSecondary }}>한마디:</span><div style={{ marginTop: 4, padding: '8px 12px', backgroundColor: colors.bg, borderRadius: 8, lineHeight: 1.5 }}>{app.message}</div></div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                      {app.status === 'pending' && (<>
                        <button onClick={() => handleApproveAlumni(app.id)} style={{ padding: '7px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><UserCheck size={14} /> 승인</button>
                        <button onClick={() => handleRejectAlumni(app.id)} style={{ padding: '7px 16px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><UserX size={14} /> 거절</button>
                      </>)}
                      <button onClick={() => handleDeleteAlumni(app.id)} style={{ padding: '7px 12px', backgroundColor: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={14} /> 삭제</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>)}

          {/* ===== MEMBERS 탭 ===== */}
          {activeTab === 'members' && (<div>
            <p style={{ color: colors.textSecondary, fontSize: 13, margin: '0 0 16px' }}>회원가입 신청을 승인하면 해당 회원이 Alumni 목록을 열람할 수 있습니다.</p>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['pending', 'approved', 'rejected', 'all'].map(f => (
                <button key={f} onClick={() => setMemberFilter(f)} style={filterBtn(memberFilter === f)}>
                  {{ pending: '⏳ 대기중', approved: '✅ 승인됨', rejected: '❌ 거절됨', all: '📋 전체' }[f]}
                </button>
              ))}
            </div>
            {memberLoading ? <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>로딩 중...</div> :
            members.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>해당하는 회원이 없습니다.</div> :
            members.map(m => (
              <div key={m.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{m.name} <span style={{ color: colors.textSecondary, fontWeight: 400, fontSize: 12 }}>{m.generation || ''}</span></div>
                    <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{m.email} · {m.student_id ? m.student_id + '학번' : ''} · {new Date(m.created_at).toLocaleDateString('ko-KR')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: `${statusC[m.status]}22`, color: statusC[m.status] }}>{statusL[m.status]}</span>
                    {m.status === 'pending' && (<>
                      <button onClick={() => handleApproveMember(m.id)} style={{ padding: '5px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>승인</button>
                      <button onClick={() => handleRejectMember(m.id)} style={{ padding: '5px 12px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>거절</button>
                    </>)}
                    <button onClick={() => handleDeleteMember(m.id)} style={{ padding: '5px 8px', backgroundColor: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>)}

          {/* ===== RESEARCH 탭 ===== */}
          {activeTab === 'research' && (<div>
            {!showResearchForm && (
              <button onClick={() => { resetResearchForm(); setShowResearchForm(true); }} style={{ padding: '10px 20px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Upload size={15} /> 새 리서치 등록</button>
            )}
            {showResearchForm && (
              <div style={{ ...card, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ color: colors.text, fontWeight: 700, fontSize: 15 }}>{editingReport ? '리서치 수정' : '새 리서치 등록'}</span>
                  <button onClick={resetResearchForm} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, display: 'block' }}>제목 *</label><input value={researchForm.title} onChange={e => setResearchForm(p => ({ ...p, title: e.target.value }))} style={input} /></div>
                    <div><label style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, display: 'block' }}>작성자 *</label><input value={researchForm.author} onChange={e => setResearchForm(p => ({ ...p, author: e.target.value }))} style={input} /></div>
                  </div>
                  <div><label style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, display: 'block' }}>요약</label><textarea value={researchForm.summary} onChange={e => setResearchForm(p => ({ ...p, summary: e.target.value }))} rows={3} style={{ ...input, resize: 'vertical' }} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div><label style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, display: 'block' }}>투자의견</label><select value={researchForm.rating} onChange={e => setResearchForm(p => ({ ...p, rating: e.target.value }))} style={input}><option value="STRONG BUY">STRONG BUY</option><option value="BUY">BUY</option><option value="HOLD">HOLD</option><option value="SELL">SELL</option></select></div>
                    <div><label style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, display: 'block' }}>섹터</label><input value={researchForm.sector} onChange={e => setResearchForm(p => ({ ...p, sector: e.target.value }))} style={input} /></div>
                    <div><label style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, display: 'block' }}>목표가</label><input value={researchForm.target_price} onChange={e => setResearchForm(p => ({ ...p, target_price: e.target.value }))} style={input} /></div>
                  </div>
                  <div><label style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, display: 'block' }}>PDF 파일</label><input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} style={{ ...input, padding: 8 }} />{researchForm.pdf_url && !pdfFile && <div style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>기존 PDF 있음</div>}</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button onClick={resetResearchForm} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>취소</button>
                    <button onClick={handleSubmitResearch} disabled={uploading} style={{ padding: '8px 20px', backgroundColor: uploading ? colors.border : colors.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Save size={14} /> {uploading ? '업로드 중...' : (editingReport ? '수정 완료' : '등록')}</button>
                  </div>
                </div>
              </div>
            )}
            {researchLoading ? <div style={{ textAlign: 'center', padding: 40, color: colors.textSecondary }}>로딩 중...</div> :
            reports.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: colors.textSecondary }}>등록된 리서치가 없습니다.</div> :
            reports.map(r => (
              <div key={r.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={15} color={colors.primary} /><span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{r.title}</span><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: r.rating === 'BUY' ? '#3b82f622' : r.rating === 'STRONG BUY' ? '#22c55e22' : '#f59e0b22', color: r.rating === 'BUY' ? '#3b82f6' : r.rating === 'STRONG BUY' ? '#22c55e' : '#f59e0b' }}>{r.rating}</span></div>
                    <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{r.author} · {r.sector} · {new Date(r.created_at || r.date).toLocaleDateString('ko-KR')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleEditResearch(r)} style={{ padding: '5px 10px', backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}44`, borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}><Edit3 size={12} /> 수정</button>
                    <button onClick={() => handleDeleteResearch(r.id)} style={{ padding: '5px 10px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}><Trash2 size={12} /> 삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>)}
        </div>
      </div>
    </div>
  );
}