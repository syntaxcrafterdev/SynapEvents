'use client'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Search, Bell, Menu } from 'lucide-react'
import { UserNav } from './user-nav'
import { useSidebar } from '../../hooks/use-sidebar'

export function Header() {
  const { toggle } = useSidebar()

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggle}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="sr-only">View notifications</span>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary">
              <span className="sr-only">New notification</span>
            </span>
          </Button>
          <UserNav />
        </div>
      </div>
    </header>
  )
}
