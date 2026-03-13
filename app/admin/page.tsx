'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // 리서치 폼
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [sector, setSector] = useState('IT/Semiconductor')
  const [rating, setRating] = useState('BUY')
  const [targetPrice, setTargetPrice] = useState('')
  const [summary, setSummary] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  // 기존 리서치 목록
  const [researchList, setResearchList] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) loadResearch()
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoginError('로그인 실패: ' + error.message)
    } else {
      setUser(data.user)
      loadResearch()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const loadResearch = async () => {
    const { data } = await supabase
      .from('research')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setResearchList(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setMessage('')

    let pdfUrl = ''

    // PDF 업로드
    if (pdfFile) {
      const fileName = `${Date.now()}_${pdfFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('research-files')
        .upload(fileName, pdfFile)

      if (uploadError) {
        setMessage('PDF 업로드 실패: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('research-files')
        .getPublicUrl(fileName)

      pdfUrl = urlData.publicUrl
    }

    if (editingId) {
      // 수정
      const updateData: any = { title, author, sector, rating, target_price: targetPrice, summary }
      if (pdfUrl) updateData.pdf_url = pdfUrl

      const { error } = await supabase
        .from('research')
        .update(updateData)
        .eq('id', editingId)

      if (error) {
        setMessage('수정 실패: ' + error.message)
      } else {
        setMessage('수정 완료!')
        setEditingId(null)
      }
    } else {
      // 새 글 작성
      const { error } = await supabase.from('research').insert({
        title,
        author,
        sector,
        rating,
        target_price: targetPrice,
        summary,
        pdf_url: pdfUrl,
      })

      if (error) {
        setMessage('업로드 실패: ' + error.message)
      } else {
        setMessage('리서치 업로드 완료!')
      }
    }

    // 폼 초기화
    setTitle('')
    setAuthor('')
    setSector('IT/Semiconductor')
    setRating('BUY')
    setTargetPrice('')
    setSummary('')
    setPdfFile(null)
    setUploading(false)
    loadResearch()
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setTitle(item.title)
    setAuthor(item.author)
    setSector(item.sector || 'IT/Semiconductor')
    setRating(item.rating || 'BUY')
    setTargetPrice(item.target_price || '')
    setSummary(item.summary || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('research').delete().eq('id', id)
    loadResearch()
  }

  // 로그인 안 된 상태
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>VIPS 관리자</h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>관리자 로그인</p>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>이메일</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>비밀번호</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
              로그인
            </button>
          </form>
          {loginError && <p style={{ marginTop: '16px', textAlign: 'center', color: 'red', fontSize: '14px' }}>{loginError}</p>}
        </div>
      </div>
    )
  }

  // 로그인 된 상태 - 관리자 페이지
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>VIPS 리서치 관리</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          로그아웃
        </button>
      </div>

      {/* 업로드 폼 */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
          {editingId ? '리서치 수정' : '새 리서치 업로드'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>제목 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="삼성전자 반도체 사이클 분석"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>작성자 *</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} required placeholder="김민수"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>섹터</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option>IT/Semiconductor</option>
                <option>Automotive</option>
                <option>Internet/Platform</option>
                <option>Finance</option>
                <option>Bio/Healthcare</option>
                <option>Energy</option>
                <option>Consumer</option>
                <option>Industrial</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>투자의견</label>
              <select value={rating} onChange={(e) => setRating(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option>STRONG BUY</option>
                <option>BUY</option>
                <option>HOLD</option>
                <option>SELL</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>목표가</label>
              <input value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="87,000"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>요약</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="리서치 요약 내용..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>PDF 파일</label>
            <input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              style={{ fontSize: '14px' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={uploading}
              style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}>
              {uploading ? '업로드 중...' : (editingId ? '수정하기' : '업로드')}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setTitle(''); setAuthor(''); setSummary(''); setTargetPrice(''); setPdfFile(null); }}
                style={{ padding: '12px 24px', background: '#eee', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
                취소
              </button>
            )}
          </div>
        </form>
        {message && <p style={{ marginTop: '16px', color: message.includes('실패') ? 'red' : 'green', fontSize: '14px' }}>{message}</p>}
      </div>

      {/* 기존 리서치 목록 */}
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>등록된 리서치 ({researchList.length}건)</h2>
      {researchList.map((item) => (
        <div key={item.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ padding: '2px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>{item.sector}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: item.rating === 'STRONG BUY' ? '#dc2626' : item.rating === 'BUY' ? '#2563eb' : '#666' }}>
                  {item.rating}
                </span>
              </div>
              <p style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{item.title}</p>
              <p style={{ color: '#666', fontSize: '13px' }}>
                {item.author} · {item.date} {item.target_price && `· 목표가 ₩${item.target_price}`}
              </p>
              {item.pdf_url && (
                <a href={item.pdf_url} target="_blank" style={{ color: '#2563eb', fontSize: '13px', marginTop: '4px', display: 'inline-block' }}>
                  📄 PDF 보기
                </a>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleEdit(item)}
                style={{ padding: '6px 12px', background: '#f0f0f0', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                수정
              </button>
              <button onClick={() => handleDelete(item.id)}
                style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                삭제
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}