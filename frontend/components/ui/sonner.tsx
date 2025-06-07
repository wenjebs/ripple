"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={{
        ["--normal-bg" as string]: "#262626", // neutral-800
        ["--normal-text" as string]: "#f5f5f5", // neutral-100
        ["--normal-border" as string]: "#404040", // neutral-700  
        ["--error-bg" as string]: "#dc2626", // red-600
        ["--error-text" as string]: "#fef2f2", // red-50
        ["--success-bg" as string]: "#16a34a", // green-600
        ["--success-text" as string]: "#f0fdf4", // green-50
        ["--info-bg" as string]: "#2563eb", // blue-600
        ["--info-text" as string]: "#eff6ff", // blue-50
        ["--warning-bg" as string]: "#ea580c", // orange-600
        ["--warning-text" as string]: "#fff7ed", // orange-50
      }}
      toastOptions={{
        style: {
          background: "#262626",
          color: "#f5f5f5",
          border: "1px solid #404040",
          borderRadius: "8px",
          fontSize: "14px",
        },
        className: "group toast",
        descriptionClassName: "group-[.toast]:text-neutral-400",
        actionButtonStyle: {
          background: "#7c3aed",
          color: "#ffffff",
        },
        cancelButtonStyle: {
          background: "#525252",
          color: "#f5f5f5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
