"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        // TODO: Replace with actual API call to check auth status
        const token = localStorage.getItem("token")
        if (token) {
          // TODO: Verify token with backend
          // For now, just set a mock user
          setUser({
            id: "1",
            name: "John Doe",
            email: "john@example.com",
          })
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // TODO: Replace with actual API call
      console.log("Logging in with:", { email, password })
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Mock response
      const mockUser = {
        id: "1",
        name: "John Doe",
        email,
        token: "mock-jwt-token",
      }
      
      localStorage.setItem("token", mockUser.token)
      setUser({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
      })
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      })
      
      return { success: true }
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      })
      return { success: false }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      // TODO: Replace with actual API call
      console.log("Registering with:", { name, email, password })
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Mock response
      const mockUser = {
        id: "1",
        name,
        email,
        token: "mock-jwt-token",
      }
      
      localStorage.setItem("token", mockUser.token)
      setUser({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
      })
      
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      })
      
      return { success: true }
    } catch (error) {
      console.error("Registration failed:", error)
      toast({
        title: "Registration failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
      return { success: false }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    router.push("/auth/login")
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }
}
