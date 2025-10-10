'use client'

import { HeroUIProvider as Provider } from '@heroui/react'
import { Toaster } from 'react-hot-toast'

export function HeroUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </Provider>
  )
}
