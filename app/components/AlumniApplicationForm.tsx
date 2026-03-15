// app/components/AlumniApplicationForm.tsx
// Alumni 신청 폼 - 회원가입 없이 누구나 신청 가능
// 졸업년도 → 학번으로 변경
// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import { submitAlumniApplication } from '../../lib/supabase';

export default function AlumniApplicationForm({ isOpen, onClose, colors }) {
  const [formData, setFormData] = useState({
    name: '', studentId: '', major: '', generation: '',
    currentCompany: '', currentRole: '', email: '', phone: '',
    linkedin: '', message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.studentId || !formData.major || !formData.email) {
      setError('이름, 학번, 전공, 이메일은 필수 항목입니다.');
      return;
    }
    setIsSubmitting(true); setError('');
    try {
      await submitAlumniApplication(formData);
      setIsSubmitted(true);
    } catch (err) {
      setError('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally { setIsSubmitting(false); }
  };

  const handleClose = () => {
    setFormData({ name: '', studentId: '', major: '', generation: '', currentCompany: '', currentRole: '', email: '', phone: '', linkedin: '', message: '' });
    setIsSubmitted(false); setError(''); onClose();
  };

  const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' };
  const modalStyle = { backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, width: '100%', maxWidth: '560px', maxHeight: '85vh', overflow: 'auto', padding: '32px' };
  const inputStyle = { width: '100%', padding: '10px 14px', backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' };
  const req = <span style={{ color: colors.primary, marginLeft: '2px' }}>*</span>;

  if (isSubmitted) {
    return (
      <div style={overlayStyle} onClick={handleClose}>
        <div style={{ ...modalStyle, textAlign: 'center', padding: '48px 32px' }} onClick={e => e.stopPropagation()}>
          <CheckCircle size={56} color={colors.primary} style={{ marginBottom: '16px' }} />
          <h2 style={{ color: colors.text, fontSize: '22px', fontWeight: 700, margin: '0 0 12px' }}>신청이 완료되었습니다!</h2>
          <p style={{ color: colors.textSecondary, fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>
            관리자 승인 후 Alumni 네트워크에 등록됩니다.<br />승인 결과는 입력하신 이메일로 안내드리겠습니다.
          </p>
          <button onClick={handleClose} style={{ padding: '10px 32px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>확인</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: colors.text, fontSize: '20px', fontWeight: 700, margin: 0 }}>Alumni 등록 신청</h2>
            <p style={{ color: colors.textSecondary, fontSize: '13px', margin: '4px 0 0' }}>VIPS 졸업생 네트워크에 참여하세요 (회원가입 불필요)</p>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 이름 + 기수 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>이름 {req}</label><input name="name" value={formData.name} onChange={handleChange} placeholder="홍길동" style={inputStyle} /></div>
            <div><label style={labelStyle}>VIPS 기수</label><input name="generation" value={formData.generation} onChange={handleChange} placeholder="예: 15기" style={inputStyle} /></div>
          </div>

          {/* 학번 + 전공 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>학번 {req}</label><input name="studentId" value={formData.studentId} onChange={handleChange} placeholder="예: 20" style={inputStyle} /></div>
            <div><label style={labelStyle}>전공 {req}</label><input name="major" value={formData.major} onChange={handleChange} placeholder="경영학과" style={inputStyle} /></div>
          </div>

          {/* 현재 직장 + 직책 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>현재 직장</label><input name="currentCompany" value={formData.currentCompany} onChange={handleChange} placeholder="삼성증권" style={inputStyle} /></div>
            <div><label style={labelStyle}>직책/직무</label><input name="currentRole" value={formData.currentRole} onChange={handleChange} placeholder="애널리스트" style={inputStyle} /></div>
          </div>

          <div><label style={labelStyle}>이메일 {req}</label><input name="email" value={formData.email} onChange={handleChange} placeholder="alumni@email.com" type="email" style={inputStyle} /></div>
          <div><label style={labelStyle}>전화번호</label><input name="phone" value={formData.phone} onChange={handleChange} placeholder="010-0000-0000" style={inputStyle} /></div>
          <div><label style={labelStyle}>SNS (Instagram, LinkedIn 등)</label><input name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="@instagram_id 또는 URL" style={inputStyle} /></div>
          <div><label style={labelStyle}>한마디 (선택)</label><textarea name="message" value={formData.message} onChange={handleChange} placeholder="후배들에게 한마디..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
        </div>

        <button onClick={handleSubmit} disabled={isSubmitting} style={{
          width: '100%', padding: '12px', marginTop: '24px',
          backgroundColor: isSubmitting ? colors.border : colors.primary,
          color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600,
          cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}><Send size={16} />{isSubmitting ? '제출 중...' : 'Alumni 등록 신청'}</button>
      </div>
    </div>
  );
}