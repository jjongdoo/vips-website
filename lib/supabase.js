// lib/supabase.js
// Supabase 클라이언트 + Alumni/Research/Member 헬퍼 함수
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// 인증 (Admin 로그인/로그아웃)
// ============================================

export async function adminLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
// 회원 시스템 (Member)
// ============================================

// 회원가입
export async function memberSignUp(email, password, name, studentId, generation) {
  // 1. Supabase Auth로 계정 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) throw authError;

  // 2. members 테이블에 정보 저장 (승인 대기)
  const { data, error } = await supabase
    .from('members')
    .insert([{
      user_id: authData.user?.id,
      email,
      name,
      student_id: studentId,
      generation,
      role: 'member',
      status: 'pending',
    }])
    .select();

  if (error) throw error;
  return data;
}

// 회원 로그인
export async function memberLogin(email, password) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw authError;

  // members 테이블에서 상태 확인
  const { data: memberData } = await supabase
    .from('members')
    .select('*')
    .eq('email', email)
    .single();

  return { auth: authData, member: memberData };
}

// 현재 로그인한 유저의 member 정보 가져오기
export async function getCurrentMember() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  return data;
}

// 관리자인지 확인 (members 테이블에 role='admin' 이거나 members에 없으면 기존 admin)
export async function checkIsAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  // members 테이블에서 admin role 확인
  const { data } = await supabase
    .from('members')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  // members 테이블에 없으면 기존 관리자 (직접 Supabase에서 생성한 계정)
  if (!data) return true;
  return data.role === 'admin';
}

// ============================================
// 회원 관리 (관리자 전용)
// ============================================

export async function getPendingMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllMembers(status = null) {
  let query = supabase.from('members').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function approveMember(id) {
  const { data, error } = await supabase
    .from('members')
    .update({ status: 'approved' })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function rejectMember(id) {
  const { data, error } = await supabase
    .from('members')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteMember(id) {
  const { data, error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return data;
}

// ============================================
// Alumni 신청 (공개 - 누구나 가능)
// ============================================

export async function submitAlumniApplication(applicationData) {
  const { data, error } = await supabase
    .from('alumni_applications')
    .insert([{
      name: applicationData.name,
      student_id: applicationData.studentId,
      graduation_year: applicationData.studentId, // 호환성 유지
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

export async function getAlumniApplications(status = null) {
  let query = supabase
    .from('alumni_applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function approveAlumni(id) {
  const { data, error } = await supabase
    .from('alumni_applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function rejectAlumni(id) {
  const { data, error } = await supabase
    .from('alumni_applications')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function getApprovedAlumni() {
  const { data, error } = await supabase
    .from('alumni_applications')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteAlumniApplication(id) {
  const { data, error } = await supabase
    .from('alumni_applications')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return data;
}

// ============================================
// 리서치
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
  const { data, error } = await supabase.from('research').insert([reportData]).select();
  if (error) throw error;
  return data;
}

export async function updateResearch(id, reportData) {
  const { data, error } = await supabase.from('research').update(reportData).eq('id', id).select();
  if (error) throw error;
  return data;
}

export async function deleteResearch(id) {
  const { data, error } = await supabase.from('research').delete().eq('id', id);
  if (error) throw error;
  return data;
}

export async function uploadPDF(file) {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('research-files').upload(fileName, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('research-files').getPublicUrl(fileName);
  return urlData.publicUrl;
}