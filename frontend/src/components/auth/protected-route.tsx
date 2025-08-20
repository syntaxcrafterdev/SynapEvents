"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRole?: string
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = "/auth/login" 
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the attempted URL for redirecting after login
      sessionStorage.setItem('redirectAfterLogin', pathname)
      router.push(redirectTo)
    } else if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // User doesn't have the required role
      router.push('/unauthorized')
    }
  }, [isAuthenticated, isLoading, router, pathname, redirectTo, requiredRole, user?.role])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Verifying your session...</p>
      </div>
    )
  }

  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null
  }

  return <>{children}</>
}
