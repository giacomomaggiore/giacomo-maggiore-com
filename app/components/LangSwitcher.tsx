'use client'

export default function LangSwitcher() {
  const switchLang = (lang: 'it' | 'en') => {
    document.cookie = `lang=${lang};path=/;max-age=31536000`
    window.location.reload()
  }

  return (
    <div className="flex gap-2 text-sm">
      <button onClick={() => switchLang('it')}>🇮🇹 Italiano</button>
      <button onClick={() => switchLang('en')}>🇬🇧 English</button>
    </div>
  )
}
