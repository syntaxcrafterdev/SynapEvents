'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Close sidebar when route changes on mobile
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }
    
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    })
    
    return () => {
      window.removeEventListener('resize', () => {})
      window.removeEventListener('routeChangeStart', handleRouteChange)
    }
  }, [])
  
  const toggle = () => setIsOpen(!isOpen)
  const setOpen = (open: boolean) => setIsOpen(open)
  
  return (
    <SidebarContext.Provider value={{ isOpen, toggle, setOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
