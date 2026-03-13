// app/components/AlumniApplicationForm.tsx
// Alumni 신청 폼 - 누구나 ssuvips.com에서 신청 가능
'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import { submitAlumniApplication } from '../../lib/supabase';

interface AlumniApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function AlumniApplicationForm({ isOpen, onClose, colors }: AlumniApplicationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    graduationYear: '',
    major: '',
    generation: '',
    currentCompany: '',
    currentRole: '',
    email: '',
    phone: '',
    linkedin: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    // 필수 필드 확인
    if (!formData.name || !formData.graduationYear || !formData.major || !formData.email) {
      setError('이름, 졸업년도, 전공, 이메일은 필수 항목입니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await submitAlumniApplication(formData);
      setIsSubmitted(true);
    } catch (err: any) {
      setError('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Alumni application error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '', graduationYear: '', major: '', generation: '',
      currentCompany: '', currentRole: '', email: '', phone: '',
      linkedin: '', message: '',
    });
    setIsSubmitted(false);
    setError('');
    onClose();
  };

  // 스타일
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: colors.cardBg,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    width: '100%',
    maxWidth: '560px',
    maxHeight: '85vh',
    overflow: 'auto',
    padding: '32px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    color: colors.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: colors.textSecondary,
    marginBottom: '6px',
  };

  const requiredMark = <span style={{ color: colors.primary, marginLeft: '2px' }}>*</span>;

  // 제출 완료 화면
  if (isSubmitted) {
    return (
      <div style={overlayStyle} onClick={handleClose}>
        <div style={{ ...modalStyle, textAlign: 'center', padding: '48px 32px' }} onClick={e => e.stopPropagation()}>
          <CheckCircle size={56} color={colors.primary} style={{ marginBottom: '16px' }} />
          <h2 style={{ color: colors.text, fontSize: '22px', fontWeight: 700, margin: '0 0 12px' }}>
            신청이 완료되었습니다!
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>
            관리자 승인 후 Alumni 네트워크에 등록됩니다.<br />
            승인 결과는 입력하신 이메일로 안내드리겠습니다.
          </p>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 32px',
              backgroundColor: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: colors.text, fontSize: '20px', fontWeight: 700, margin: 0 }}>
              Alumni 등록 신청
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: '13px', margin: '4px 0 0' }}>
              VIPS 졸업생 네트워크에 참여하세요
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* 폼 필드들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 이름 + 기수 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>이름 {requiredMark}</label>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="홍길동" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>VIPS 기수</label>
              <input name="generation" value={formData.generation} onChange={handleChange} placeholder="예: 15기" style={inputStyle} />
            </div>
          </div>

          {/* 졸업년도 + 전공 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>졸업년도 {requiredMark}</label>
              <select
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">선택</option>
                {Array.from({ length: 30 }, (_, i) => 2030 - i).map(year => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>전공 {requiredMark}</label>
              <input name="major" value={formData.major} onChange={handleChange} placeholder="경영학과" style={inputStyle} />
            </div>
          </div>

          {/* 현재 직장 + 직책 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>현재 직장</label>
              <input name="currentCompany" value={formData.currentCompany} onChange={handleChange} placeholder="삼성증권" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>직책/직무</label>
              <input name="currentRole" value={formData.currentRole} onChange={handleChange} placeholder="애널리스트" style={inputStyle} />
            </div>
          </div>

          {/* 이메일 */}
          <div>
            <label style={labelStyle}>이메일 {requiredMark}</label>
            <input name="email" value={formData.email} onChange={handleChange} placeholder="alumni@email.com" type="email" style={inputStyle} />
          </div>

          {/* 전화번호 */}
          <div>
            <label style={labelStyle}>전화번호</label>
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="010-0000-0000" style={inputStyle} />
          </div>

          {/* SNS */}
          <div>
            <label style={labelStyle}>SNS (Instagram, LinkedIn 등)</label>
            <input name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="@instagram_id 또는 URL" style={inputStyle} />
          </div>

          {/* 한마디 */}
          <div>
            <label style={labelStyle}>한마디 (선택)</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="후배들에게 한마디, 또는 자기소개..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '24px',
            backgroundColor: isSubmitting ? colors.border : colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Send size={16} />
          {isSubmitting ? '제출 중...' : 'Alumni 등록 신청'}
        </button>
      </div>
    </div>
  );
}