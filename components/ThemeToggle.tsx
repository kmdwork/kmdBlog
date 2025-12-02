// app/components/ThemeToggle.tsx
'use client'
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light'|'dark'>('dark');
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true)
    const current = document.documentElement.getAttribute('data-theme') as 'light'|'dark'|null
    setTheme(current ?? 'dark')
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('theme', next) } catch {}

    // Cookie の更新（SSR初期値の整合性）
    const oneYear = 60 * 60 * 24 * 365
    const secure = location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `theme=${next}; Path=/; Max-Age=${oneYear}; SameSite=Lax${secure}`
  }

  return (
    <button
      onClick={toggle}
      className="ml-4 px-3 py-1 border border-[var(--border)] rounded hover:border-[var(--accent-cyan)] transition"
      aria-label="テーマ切り替え"
    >
      {mounted ? (theme === 'dark' ? '☀️' : '🌙') : null}
    </button>
  )
}