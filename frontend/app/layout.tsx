import type React from "react"
import type { Metadata } from "next"
import { Roboto } from "next/font/google"
import { AuthProvider } from "@/hooks/useAuth"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Task Manager - Productivity App",
  description: "A modern task management application for tracking your productivity goals",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
