// lib/supabase.js
// Supabase 클라이언트 + Alumni/Research 헬퍼 함수
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// 인증 (Admin 로그인/로그아웃)
// ============================================

export async function adminLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function adminLogout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ============================================
// Alumni 신청 (공개 - 누구나 가능)
// ============================================

export async function submitAlumniApplication(applicationData) {
  const { data, error } = await supabase
    .from('alumni_applications')
    .insert([{
      name: applicationData.name,
      graduation_year: applicationData.graduationYear,
      major: applicationData.major,
      generation: applicationData.generation,
      current_company: applicationData.currentCompany,
      job_role: applicationData.currentRole,
      email: applicationData.email,
      phone: applicationData.phone,
      linkedin: applicationData.linkedin,
      message: applicationData.message,
      status: 'pending',
    }])
    .select();

  if (error) throw error;
  return data;
}

// ============================================
// Alumni 관리 (관리자 전용)
// ============================================

// 모든 신청 조회 (상태별 필터 가능)
export async function getAlumniApplications(status = null) {
  let query = supabase
    .from('alumni_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// 신청 승인
export async function approveAlumni(id) {
  const { data, error } = await supabase
    .from('alumni_applications')
    .update({ 
      status: 'approved',
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
}

// 신청 거절
export async function rejectAlumni(id) {
  const { data, error } = await supabase
    .from('alumni_applications')
    .update({ 
      status: 'rejected',
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
}

// 승인된 Alumni 목록 (홈페이지 Alumni 탭에 표시)
export async function getApprovedAlumni() {
  const { data, error } = await supabase
    .from('alumni_applications')
    .select('*')
    .eq('status', 'approved')
    .order('graduation_year', { ascending: false });

  if (error) throw error;
  return data;
}

// Alumni 삭제
export async function deleteAlumniApplication(id) {
  const { data, error } = await supabase
    .from('alumni_applications')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return data;
}

// ============================================
// 리서치 (기존 함수 - 변경 없음)
// ============================================

export async function getResearchReports() {
  const { data, error } = await supabase
    .from('research')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createResearch(reportData) {
  const { data, error } = await supabase
    .from('research')
    .insert([reportData])
    .select();

  if (error) throw error;
  return data;
}

export async function updateResearch(id, reportData) {
  const { data, error } = await supabase
    .from('research')
    .update(reportData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
}

export async function deleteResearch(id) {
  const { data, error } = await supabase
    .from('research')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return data;
}

// PDF 업로드
export async function uploadPDF(file) {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('research-files')
    .upload(fileName, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('research-files')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}