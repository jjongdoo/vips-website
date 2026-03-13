'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        setMessage('회원가입 실패: ' + error.message)
      } else {
        setMessage('회원가입 성공! 이메일을 확인해주세요.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setMessage('로그인 실패: ' + error.message)
      } else {
        window.location.href = '/'
      }
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          VIPS
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '24px'
        }}>
          {isSignUp ? '회원가입' : '로그인'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@ssu.ac.kr"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '처리중...' : (isSignUp ? '회원가입' : '로그인')}
          </button>
        </form>

        {message && (
          <p style={{
            marginTop: '16px',
            textAlign: 'center',
            color: message.includes('실패') ? 'red' : 'green',
            fontSize: '14px'
          }}>
            {message}
          </p>
        )}

        <p style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          {isSignUp ? '이미 계정이 있나요? ' : '계정이 없나요? '}
          <span
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ color: '#2563eb', cursor: 'pointer' }}
          >
            {isSignUp ? '로그인' : '회원가입'}
          </span>
        </p>
      </div>
    </div>
  )
}