import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "Питание-Трекер | Персональный нутрициолог с ИИ",
  description:
    "Анализируйте питание с помощью ИИ, получайте персональные рекомендации и достигайте целей здорового образа жизни",
  keywords: "питание, нутрициолог, ИИ, здоровье, КБЖУ, диета",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
