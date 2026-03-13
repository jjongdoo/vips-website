// app/components/AdminPanel.tsx
// 관리자 패널 - Alumni 승인 + 리서치 관리
// VIPSHomepage 내에서 관리자 로그인 시 표시됨
'use client';

import React, { useState, useEffect } from 'react';
import {
  X, LogOut, UserCheck, UserX, Trash2, Clock, CheckCircle,
  XCircle, FileText, Upload, Edit3, Save, ChevronDown, ChevronUp,
  Users, BookOpen, Shield
} from 'lucide-react';
import {
  getAlumniApplications, approveAlumni, rejectAlumni, deleteAlumniApplication,
  getResearchReports, createResearch, updateResearch, deleteResearch, uploadPDF,
  adminLogout
} from '../../lib/supabase';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  colors: {
    primary: string;
    bg: string;
    cardBg: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
  };
}

type AdminTab = 'alumni' | 'research';
type AlumniFilter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminPanel({ isOpen, onClose, onLogout, colors }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('alumni');
  
  // Alumni 상태
  const [applications, setApplications] = useState<any[]>([]);
  const [alumniFilter, setAlumniFilter] = useState<AlumniFilter>('pending');
  const [alumniLoading, setAlumniLoading] = useState(false);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);

  // Research 상태
  const [reports, setReports] = useState<any[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [showResearchForm, setShowResearchForm] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [researchForm, setResearchForm] = useState({
    title: '', author: '', summary: '', rating: 'BUY',
    sector: 'IT/Semiconductor', target_price: '', pdf_url: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadAlumniApplications();
      loadResearchReports();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) loadAlumniApplications();
  }, [alumniFilter]);

  const loadAlumniApplications = async () => {
    setAlumniLoading(true);
    try {
      const data = await getAlumniApplications(alumniFilter === 'all' ? null : alumniFilter);
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setAlumniLoading(false);
    }
  };

  const loadResearchReports = async () => {
    setResearchLoading(true);
    try {
      const data = await getResearchReports();
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setResearchLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveAlumni(id);
      await loadAlumniApplications();
    } catch (err) {
      alert('승인 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectAlumni(id);
      await loadAlumniApplications();
    } catch (err) {
      alert('거절 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteAlumni = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteAlumniApplication(id);
      await loadAlumniApplications();
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 리서치 폼 핸들러
  const resetResearchForm = () => {
    setResearchForm({
      title: '', author: '', summary: '', rating: 'BUY',
      sector: 'IT/Semiconductor', target_price: '', pdf_url: ''
    });
    setPdfFile(null);
    setEditingReport(null);
    setShowResearchForm(false);
  };

  const handleEditResearch = (report: any) => {
    setResearchForm({
      title: report.title || '',
      author: report.author || '',
      summary: report.summary || '',
      rating: report.rating || 'BUY',
      sector: report.sector || 'IT/Semiconductor',
      target_price: report.target_price || '',
      pdf_url: report.pdf_url || '',
    });
    setEditingReport(report);
    setShowResearchForm(true);
  };

  const handleSubmitResearch = async () => {
    if (!researchForm.title || !researchForm.author) {
      alert('제목과 작성자는 필수입니다.');
      return;
    }

    setUploading(true);
    try {
      let pdfUrl = researchForm.pdf_url;
      
      // PDF 파일 업로드
      if (pdfFile) {
        pdfUrl = await uploadPDF(pdfFile);
      }

      const reportData = { ...researchForm, pdf_url: pdfUrl };

      if (editingReport) {
        await updateResearch(editingReport.id, reportData);
      } else {
        await createResearch(reportData);
      }

      await loadResearchReports();
      resetResearchForm();
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResearch = async (id: number) => {
    if (!confirm('이 리서치를 삭제하시겠습니까?')) return;
    try {
      await deleteResearch(id);
      await loadResearchReports();
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      onLogout();
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!isOpen) return null;

  // ============== 스타일 ==============
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  };

  const panelStyle: React.CSSProperties = {
    backgroundColor: colors.bg,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    backgroundColor: active ? colors.primary : 'transparent',
    color: active ? '#fff' : colors.textSecondary,
    border: active ? 'none' : `1px solid ${colors.border}`,
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    backgroundColor: active ? `${colors.primary}22` : 'transparent',
    color: active ? colors.primary : colors.textSecondary,
    border: `1px solid ${active ? colors.primary + '44' : colors.border}`,
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    color: colors.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '10px',
  };

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    approved: '#22c55e',
    rejected: '#ef4444',
  };

  const statusLabels: Record<string, string> = {
    pending: '대기중',
    approved: '승인됨',
    rejected: '거절됨',
  };

  const pendingCount = applications.filter(a => alumniFilter === 'all' ? a.status === 'pending' : false).length || 
    (alumniFilter === 'pending' ? applications.length : 0);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        
        {/* ===== 헤더 ===== */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={20} color={colors.primary} />
            <span style={{ color: colors.text, fontSize: '17px', fontWeight: 700 }}>관리자 패널</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleLogout} style={{
              padding: '6px 14px', backgroundColor: 'transparent', border: `1px solid ${colors.border}`,
              borderRadius: '8px', color: colors.textSecondary, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <LogOut size={14} /> 로그아웃
            </button>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', padding: '4px',
            }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ===== 탭 전환 ===== */}
        <div style={{
          padding: '12px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
        }}>
          <button onClick={() => setActiveTab('alumni')} style={btnStyle(activeTab === 'alumni')}>
            <Users size={15} /> Alumni 관리
          </button>
          <button onClick={() => setActiveTab('research')} style={btnStyle(activeTab === 'research')}>
            <BookOpen size={15} /> 리서치 관리
          </button>
        </div>

        {/* ===== 콘텐츠 영역 ===== */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

          {/* ---------- ALUMNI 탭 ---------- */}
          {activeTab === 'alumni' && (
            <div>
              {/* 필터 */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {(['pending', 'approved', 'rejected', 'all'] as AlumniFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setAlumniFilter(f)}
                    style={filterBtnStyle(alumniFilter === f)}
                  >
                    {f === 'pending' && '⏳ '}
                    {f === 'approved' && '✅ '}
                    {f === 'rejected' && '❌ '}
                    {f === 'all' && '📋 '}
                    {{ pending: '대기중', approved: '승인됨', rejected: '거절됨', all: '전체' }[f]}
                  </button>
                ))}
              </div>

              {/* 신청 목록 */}
              {alumniLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
                  로딩 중...
                </div>
              ) : applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
                  {alumniFilter === 'pending' ? '대기중인 신청이 없습니다.' : '해당하는 신청이 없습니다.'}
                </div>
              ) : (
                applications.map(app => (
                  <div key={app.id} style={cardStyle}>
                    {/* 요약 행 */}
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: statusColors[app.status] || '#666',
                        }} />
                        <div>
                          <div style={{ color: colors.text, fontWeight: 600, fontSize: '15px' }}>
                            {app.name}
                            {app.generation && <span style={{ color: colors.textSecondary, fontWeight: 400, marginLeft: '8px', fontSize: '13px' }}>{app.generation}</span>}
                          </div>
                          <div style={{ color: colors.textSecondary, fontSize: '12px', marginTop: '2px' }}>
                            {app.major} · {app.graduation_year}졸 · {new Date(app.created_at).toLocaleDateString('ko-KR')} 신청
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                          backgroundColor: `${statusColors[app.status]}22`,
                          color: statusColors[app.status],
                        }}>
                          {statusLabels[app.status]}
                        </span>
                        {expandedApp === app.id ? <ChevronUp size={16} color={colors.textSecondary} /> : <ChevronDown size={16} color={colors.textSecondary} />}
                      </div>
                    </div>

                    {/* 상세 정보 (확장) */}
                    {expandedApp === app.id && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                          <div><span style={{ color: colors.textSecondary }}>이메일:</span> <span style={{ color: colors.text }}>{app.email}</span></div>
                          <div><span style={{ color: colors.textSecondary }}>전화:</span> <span style={{ color: colors.text }}>{app.phone || '-'}</span></div>
                          <div><span style={{ color: colors.textSecondary }}>직장:</span> <span style={{ color: colors.text }}>{app.current_company || '-'}</span></div>
                          <div><span style={{ color: colors.textSecondary }}>직책:</span> <span style={{ color: colors.text }}>{app.job_role || '-'}</span></div>
                          {app.linkedin && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <span style={{ color: colors.textSecondary }}>SNS:</span>{' '}
                              <span style={{ color: colors.primary }}>{app.linkedin}</span>
                            </div>
                          )}
                          {app.message && (
                            <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                              <span style={{ color: colors.textSecondary }}>한마디:</span>
                              <div style={{ color: colors.text, marginTop: '4px', padding: '8px 12px', backgroundColor: colors.bg, borderRadius: '8px', lineHeight: 1.5 }}>
                                {app.message}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 액션 버튼 */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                          {app.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(app.id)} style={{
                                padding: '7px 16px', backgroundColor: '#22c55e', color: '#fff',
                                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                              }}>
                                <UserCheck size={14} /> 승인
                              </button>
                              <button onClick={() => handleReject(app.id)} style={{
                                padding: '7px 16px', backgroundColor: 'transparent', color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '13px',
                                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                              }}>
                                <UserX size={14} /> 거절
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDeleteAlumni(app.id)} style={{
                            padding: '7px 12px', backgroundColor: 'transparent', color: colors.textSecondary,
                            border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '13px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            <Trash2 size={14} /> 삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ---------- RESEARCH 탭 ---------- */}
          {activeTab === 'research' && (
            <div>
              {/* 새 리서치 버튼 */}
              {!showResearchForm && (
                <button
                  onClick={() => { resetResearchForm(); setShowResearchForm(true); }}
                  style={{
                    padding: '10px 20px', backgroundColor: colors.primary, color: '#fff',
                    border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <Upload size={15} /> 새 리서치 등록
                </button>
              )}

              {/* 리서치 등록/수정 폼 */}
              {showResearchForm && (
                <div style={{ ...cardStyle, marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ color: colors.text, fontWeight: 700, fontSize: '15px' }}>
                      {editingReport ? '리서치 수정' : '새 리서치 등록'}
                    </span>
                    <button onClick={resetResearchForm} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px', display: 'block' }}>제목 *</label>
                        <input value={researchForm.title} onChange={e => setResearchForm(p => ({ ...p, title: e.target.value }))} placeholder="삼성전자 분석 리포트" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px', display: 'block' }}>작성자 *</label>
                        <input value={researchForm.author} onChange={e => setResearchForm(p => ({ ...p, author: e.target.value }))} placeholder="홍길동" style={inputStyle} />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px', display: 'block' }}>요약</label>
                      <textarea
                        value={researchForm.summary}
                        onChange={e => setResearchForm(p => ({ ...p, summary: e.target.value }))}
                        placeholder="리서치 요약..."
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px', display: 'block' }}>투자의견</label>
                        <select value={researchForm.rating} onChange={e => setResearchForm(p => ({ ...p, rating: e.target.value }))} style={inputStyle}>
                          <option value="STRONG BUY">STRONG BUY</option>
                          <option value="BUY">BUY</option>
                          <option value="HOLD">HOLD</option>
                          <option value="SELL">SELL</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px', display: 'block' }}>섹터</label>
                        <input value={researchForm.sector} onChange={e => setResearchForm(p => ({ ...p, sector: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px', display: 'block' }}>목표가</label>
                        <input value={researchForm.target_price} onChange={e => setResearchForm(p => ({ ...p, target_price: e.target.value }))} placeholder="80,000" style={inputStyle} />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px', display: 'block' }}>PDF 파일</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={e => setPdfFile(e.target.files?.[0] || null)}
                        style={{ ...inputStyle, padding: '8px' }}
                      />
                      {researchForm.pdf_url && !pdfFile && (
                        <div style={{ fontSize: '12px', color: colors.primary, marginTop: '4px' }}>
                          기존 PDF 있음 (새 파일 선택 시 교체됨)
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button onClick={resetResearchForm} style={{
                        padding: '8px 16px', backgroundColor: 'transparent', color: colors.textSecondary,
                        border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                      }}>
                        취소
                      </button>
                      <button onClick={handleSubmitResearch} disabled={uploading} style={{
                        padding: '8px 20px', backgroundColor: uploading ? colors.border : colors.primary,
                        color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <Save size={14} /> {uploading ? '업로드 중...' : (editingReport ? '수정 완료' : '등록')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 리서치 목록 */}
              {researchLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>로딩 중...</div>
              ) : reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>등록된 리서치가 없습니다.</div>
              ) : (
                reports.map(report => (
                  <div key={report.id} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={15} color={colors.primary} />
                          <span style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>{report.title}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                            backgroundColor: report.rating === 'STRONG BUY' ? '#22c55e22' : report.rating === 'BUY' ? '#3b82f622' : report.rating === 'HOLD' ? '#f59e0b22' : '#ef444422',
                            color: report.rating === 'STRONG BUY' ? '#22c55e' : report.rating === 'BUY' ? '#3b82f6' : report.rating === 'HOLD' ? '#f59e0b' : '#ef4444',
                          }}>
                            {report.rating}
                          </span>
                        </div>
                        <div style={{ color: colors.textSecondary, fontSize: '12px', marginTop: '4px' }}>
                          {report.author} · {report.sector} · {new Date(report.created_at || report.date).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleEditResearch(report)} style={{
                          padding: '5px 10px', backgroundColor: 'transparent', color: colors.primary,
                          border: `1px solid ${colors.primary}44`, borderRadius: '6px', fontSize: '12px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px',
                        }}>
                          <Edit3 size={12} /> 수정
                        </button>
                        <button onClick={() => handleDeleteResearch(report.id)} style={{
                          padding: '5px 10px', backgroundColor: 'transparent', color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontSize: '12px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px',
                        }}>
                          <Trash2 size={12} /> 삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}