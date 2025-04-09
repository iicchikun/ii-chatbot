'use client'

import Link from 'next/link'
import React from 'react'
import { SiGithub } from 'react-icons/si'
import { useTheme } from 'next-themes'
import { Button } from './ui/button'
import { MoonIcon, SunIcon } from './ui/icons'

const Footer: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Only show the theme toggle after component is mounted on the client
  // This prevents hydration mismatch errors
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }
  
  return (
    <footer className="w-fit p-1 md:p-2 fixed bottom-0 right-0 hidden lg:block">
      <div className="flex justify-end items-center gap-2">
        {mounted && (
          <Button
            variant={'ghost'}
            size={'icon'}
            className="text-muted-foreground/50 hover:text-foreground/80 transition-colors"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </Button>
        )}
        <Button
          variant={'ghost'}
          size={'icon'}
          className="text-muted-foreground/50 hover:text-foreground/80 transition-colors"
        >
          <Link href="https://github.com/iicchisan" target="_blank">
            <SiGithub size={18} />
          </Link>
        </Button>
      </div>
    </footer>
  )
}

export default Footer