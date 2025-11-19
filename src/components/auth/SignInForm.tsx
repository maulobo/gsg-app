"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from "next/link";
import React, { useState } from "react";


export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter()
  const { refreshSession } = useAuth()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const form = new FormData(e.currentTarget)
      const email = String(form.get('email') ?? '').trim()
      const password = String(form.get('password') ?? '')

      if (!email || !password) {
        setError('Email and password are required')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const access_token = data?.session?.access_token
      const refresh_token = data?.session?.refresh_token

      // If we have tokens, ask the server to set the session cookies so
      // middleware and server-side code can read the session.
      if (access_token && refresh_token) {
        const setSessionResponse = await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token, refresh_token }),
          credentials: 'include',
        })
        
        if (!setSessionResponse.ok) {
          throw new Error('Failed to set session on server')
        }
        
        // Force refresh the client session to sync with server cookies
        await refreshSession()
        
        // Delay to ensure session is fully set and cookies are propagated
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Use window.location to do a full page reload so middleware sees the cookies
        window.location.href = '/'
        return
      }
    } catch (err: any) {
      setError(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 sm:px-0">
        <div className="mb-8">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Link href="/" className="block">
              <svg
                viewBox="0 0 206.01 136.16"
                style={{ height: '60px', width: 'auto' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <style>{`.cls-1 { fill: #f53e16; }`}</style>
                </defs>
                <g>
                  <g>
                    <g>
                      <path
                        className="cls-1"
                        d="M166.01,136.16c-.24-.19-.56-.15-.84-.25-.71-.2-1.21-.86-1.2-1.6,0-.32-.03-.65-.09-1-.27-1.94.66-3.5,1.63-5,.7-1.03,1.48-2,2.35-2.9.7-.76.69-.87.09-1.68s-1.13-1.47-1.65-2.23c-.5-.75-.84-1.59-1-2.48,0-.16,0-.4-.19-.44s-.27.18-.38.3c-1.03,1.02-2.16,1.94-3.38,2.74-.99.69-2.25.88-3.4.52-.56-.14-1.02-.55-1.21-1.09-.39-.96-.85-1.89-1.39-2.77-.5-.75-.7-.84-1.4-.25s-1.34,1.21-2,1.84c-.23.25-.49.47-.78.65-1.12.72-2.19,1.52-3.21,2.39-.84.84-1.87,1.47-3,1.83-.35.07-.55,0-.61-.3-.29-.83-.53-1.67-.72-2.53-.07-.73,0-1.46-.08-2.2s.85-1.41,1.54-1.35c.4,0,.44.43.7.65.17-.14.28-.35.3-.57.3-1.36.47-2.75.49-4.15,0-.22.05-.49-.21-.6-.22-.06-.46,0-.63.16-1.22.94-2.39,1.94-3.51,3-1,.89-1.93,1.85-2.78,2.88-.48.57-1.07,1.04-1.73,1.37-1.32.78-2.86,1.11-4.38.92-.86-.13-1.59-.69-1.94-1.48-.2-.43-.37-.87-.59-1.28s-.58-.59-1-.15c-.45.41-.86.85-1.23,1.33-.84,1.22-2,1.26-3.29,1-1.52-.27-2.69-1.48-2.92-3-.08-.67-.33-1.31-.72-1.86-.71.58-1.29,1.3-1.71,2.12-.83,1.19-1.77,2.31-2.8,3.33-.57.71-1.24,1.32-2,1.81-.4.25-.86.39-1.33.41-.99.11-1.88-.6-1.99-1.58-.03-.27,0-.55.09-.81.12-.51.29-1.01.49-1.5.16-.39.14-.83-.06-1.2-.2-.4-.32-.85-.55-1.23-.2-.33-.13-.75.15-1,.51-.68,1.2-1.2,2-1.49.3-.1.57-.3.76-.56.6-.76,1.27-1.47,2-2.12,1.11-1,2.09-2.18,3.27-3.14.62-.55,1.32-1,2.07-1.35.32-.09.56-.33.65-.65,1.03-3.46,2.43-6.79,4.2-9.94.28-.73.88-1.3,1.63-1.53.65-.16,1.05.11,1.08.78.1,1.17-.07,2.35-.51,3.44-.1.26-.17.54-.18.82,0,.21-.02.42-.1.61-.48,1.18-.9,2.39-1.25,3.62-.36.95-.81,1.86-1.33,2.73-.23.34-.06.72-.17,1.09-.37,1.22-.69,2.46-1,3.69-.47,1.72-.06,3.57,1.1,4.93.61.61,1.6.61,2.21,0,.12-.12.22-.26.29-.41.38-.61.83-1.17,1.35-1.66.35-.29.25-.73.31-1.1.25-1.88,1.02-3.65,2.21-5.12.6-.94,1.38-1.75,2.3-2.39.73-.42,1.61-.5,2.4-.21.82.28.91,1.12,1,1.83.07,1.23-.28,2.44-1,3.44-.86,1.34-1.9,2.56-3.07,3.63-1.08,1.07-.8,2.16.66,2.63,1.03.21,2.1.03,3-.5.56-.2,1.02-.6,1.29-1.12.26-.54.84-.78,1.32-1.12,1.19-.86,2.27-1.87,3.2-3,.43-.5,1-.9,1.44-1.36.78-.77,1.54-1.56,2.33-2.33.65-.58,1.59-.7,2.36-.3.62.33.82,1,.75,1.91-.32,2.94-1.02,5.83-2.06,8.6-.05.17-.26.4-.05.56s.42-.08.58-.21c.92-.64,1.76-1.38,2.5-2.21,1.22-1.71,3.06-2.79,4.29-4.49.62-.85,2.24-.4,2.62.7.21.63.35,1.27.43,1.93.15.91.36,1.81.63,2.69.19.76.58,1,1.34.8,1.06-.35,1.99-1.02,2.65-1.92.41-.45.76-1,1.19-1.37.81-.87,1.43-1.89,1.84-3,.41-.91.97-1.75,1.66-2.48.94-1.08,1.93-2.12,2.82-3.26.53-.72,1.33-1.21,2.22-1.34.59-.2,1.23.12,1.43.72.02.05.03.11.04.16.25.7.17,1.48-.23,2.11-1.01,1.47-2.13,2.84-3.37,4.12-.55.59-1.1,1.2-1.67,1.77-1.06,1.01-1.28,2.61-.55,3.88.5.91,1.11,1.76,1.81,2.53.26.28.46.31.73,0,1.14-1.15,2.21-2.38,3.18-3.68.7-1,1.66-1.65,2.41-2.55,1.14-1.36,2.36-2.67,3.55-4,.56-.68,1.35-1.12,2.22-1.23.75-.21,1.54.23,1.75.98.05.17.06.34.05.51-.03,1.07-.25,2.14-.63,3.14-.29,1.15-.68,2.27-1.17,3.35-.16.27-.2.58-.11.88.28,0,.35-.28.5-.43,1.14-1.36,2.36-2.64,3.65-3.85.68-.63,1.55-1.03,2.48-1.13.96-.09,1.85.53,2.11,1.46.29.85.55,1.72.9,2.55s.94,1.06,1.81.43c.25.57.49,1.14.75,1.7.1.21,0,.3-.16.42-.5.4-1,.83-1.49,1.22-.83.79-2.15.75-2.94-.08-.14-.15-.26-.32-.35-.5-.58-.97-1.21-1.9-1.9-2.8-.14-.29-.49-.4-.78-.26-.04.02-.09.05-.12.08-.52.29-.91.75-1.4,1-1.63,1-2.56,2.74-3.95,4-.44.41-.86.85-1.29,1.27-.23.23-.52.38-.84.44-1.32.25-2-.54-1.6-1.88.59-1.94,1.2-3.87,1.8-5.81,0-.06.06-.1.06-.16,0-.25.2-.55-.08-.72s-.52,0-.73.17-.49.42-.71.65c-.53.61-1.11,1.18-1.74,1.7-.76.72-1.43,1.53-2,2.41-.6.74-1.09,1.56-1.69,2.28-.34.3-.38.83-.07,1.17.04.05.09.09.14.13.74.84,1.26,1.85,1.49,2.94.47,1.64.14,3.42-.89,4.78-1.35,2.06-3.36,3.59-5.71,4.32-.26.08-.56-.06-.78.18l-1.07.1ZM171.51,129c-.06-.85-.32-1.67-.78-2.39-.42-.68-.62-.68-1.11-.06-1.05,1.32-1.85,2.8-2.8,4.18-.46.7-.8,1.46-1,2.27-.14.33.01.7.34.84.08.03.16.05.25.05.28.06.56.06.84,0,1.91-.62,3.42-2.1,4.08-4,.11-.28.18-.58.18-.89ZM121.71,111.43c-.92.81-1.77,1.7-2.53,2.66-1.21,1.49-2.29,3.09-3.23,4.76-.14.27-.52.66-.24.88s.63-.16.88-.38c1.18-1.06,2.23-2.25,3.13-3.55.75-.95,1.36-1.99,1.83-3.1.22-.39.28-.85.16-1.28h0ZM135.42,111.24c0-.12-.07-.24-.16-.32-.2-.13-.34,0-.45.12-.71.67-1.24,1.51-1.53,2.45-.05.15-.09.31.07.41.15.08.34.02.42-.13,0,0,0-.01.01-.02.37-.52.78-1.01,1.23-1.47.25-.29.4-.66.41-1.05h0Z"
                        fill="#f53e16"
                      />
                      <path
                        d="M206.01,7.89c-.22.2-.14.49-.19.74-.77,3.92-4.57,6.48-8.5,5.71-3.92-.77-6.48-4.57-5.71-8.5.77-3.92,4.57-6.48,8.5-5.71,3.07.6,5.41,3.11,5.79,6.22,0,.08,0,.15.11.18v1.36ZM198.73,13.34c3.4.01,6.19-2.72,6.24-6.12.03-3.41-2.72-6.2-6.13-6.23-3.41-.03-6.2,2.72-6.23,6.13-.02,3.4,2.7,6.18,6.1,6.22h.02Z"
                        fill="#f53e16"
                      />
                      <path
                        d="M88.77,49.08h50.69c18.09-.07,36.18,0,54.27,0,1.61-.17,3.16.69,3.86,2.16.81,1.57.64,3.47-.43,4.88-.66.93-1.74,1.47-2.88,1.44h-.17l-124.6.06h-31c-4.16,0-5.24-4-3.8-6.59.62-1.19,1.85-1.93,3.19-1.94h50.87Z"
                        fill="#f53e16"
                      />
                      <path
                        d="M59.59,72.74v10.73c.12,1.62-.75,3.16-2.21,3.88-3.7,2.07-7.75,3.46-11.94,4.1-2.55.42-5.14.61-7.73.55-6.8-.1-13.45-2.06-19.22-5.65-6.25-3.84-11.29-9.36-14.54-15.93-2.02-4.07-3.28-8.48-3.73-13-.79-7.15.53-14.37,3.79-20.78,4.82-9.85,13.66-17.15,24.25-20,3.82-1.1,7.78-1.59,11.75-1.45,6.32.19,12.49,1.91,18,5,1.33.7,2.04,2.2,1.73,3.68-.19,1.86-1.51,3.41-3.32,3.89-1.16.27-2.37.09-3.4-.51-5.14-2.99-11.08-4.32-17-3.8-9.98.63-18.96,6.28-23.86,15-2.46,4.11-3.84,8.77-4.01,13.55-.62,13.5,7.75,25.78,20.54,30.14,3.84,1.25,7.89,1.73,11.91,1.39,3.6-.24,7.13-1.14,10.41-2.66.39-.14.63-.53.58-.94v-18.33c0-.54.14-.71.69-.7,2.29.06,4.58.1,6.87.1.46,0,.45.23.45.56v11.18Z"
                        fill="#f53e16"
                      />
                      <path
                        d="M197.21,72.73v10.67c.11,1.68-.8,3.26-2.31,4-3.68,2.02-7.68,3.37-11.83,4-2.6.41-5.22.58-7.85.52-8.73-.15-17.13-3.33-23.76-9-6.35-5.24-10.83-12.4-12.76-20.41-.13-.53-.22-1.07-.36-1.6-.1-.37,0-.51.39-.51,2.44,0,4.88,0,7.32,0,.44,0,.54.21.62.55.91,3.7,2.55,7.18,4.83,10.24,4.28,5.99,10.65,10.16,17.85,11.68,6.48,1.44,13.25.71,19.28-2.07.39-.14.63-.53.58-.94v-18.33c0-.54.13-.71.68-.7,2.29.06,4.58.1,6.86.1.46,0,.47.22.47.56-.01,3.79-.01,7.51-.01,11.24Z"
                        fill="#f53e16"
                      />
                      <path
                        d="M175.39,15.24c6.84-.08,13.59,1.58,19.62,4.82,1.61.77,2.43,2.61,1.91,4.32-.46,2.39-2.77,3.94-5.16,3.48-.54-.1-1.05-.31-1.51-.6-3.72-2.13-7.87-3.41-12.14-3.73-9.3-.87-18.46,2.71-24.7,9.67-3.23,3.41-5.53,7.59-6.69,12.14-.03.41-.39.71-.79.68-.03,0-.06,0-.09-.01h-7.15c-.46,0-.62,0-.5-.58,2.56-11.29,9-19.69,19-25.37,4.37-2.44,9.18-3.99,14.15-4.56,1.34-.17,2.7-.26,4.05-.26Z"
                        fill="#f53e16"
                      />
                      <path
                        d="M73.65,46h-3.69c-.43,0-.52-.14-.44-.53,1.26-6,3.98-11.6,7.93-16.3,4.61-5.55,10.7-9.68,17.56-11.91,10.52-3.53,22.05-2.44,31.72,3,1.46.87,2.07,2.67,1.46,4.25-.54,2.35-2.88,3.81-5.23,3.27-.46-.11-.9-.29-1.3-.53-3.29-1.85-6.91-3.06-10.65-3.56-14.92-2.04-29.04,7.3-33,21.83-.04.31-.33.53-.64.48,0,0-.02,0-.03,0h-3.69Z"
                        fill="#f53e16"
                      />
                      <path
                        d="M89.47,92c-6.68-.02-13.25-1.74-19.09-5-1.68-.94-2.33-3.05-1.46-4.77.73-2.25,3.15-3.49,5.4-2.76.34.11.67.27.98.46,4.22,2.37,8.94,3.69,13.78,3.85,7.39.3,14.62-2.2,20.25-7,4.71-3.88,8.08-9.15,9.6-15.06.03-.29.29-.5.58-.48.01,0,.03,0,.04,0h7.38c.51,0,.54.19.46.6-3.12,14.07-13.88,25.2-27.84,28.8-2.83.75-5.74,1.18-8.67,1.26-.47,0-.94.09-1.41.09Z"
                        fill="#f53e16"
                      />
                    </g>
                  </g>
                </g>
              </svg>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="mb-2 font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">
              Dashboard de GSGDesign
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Acceso al sistema de gestión de productos
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:text-red-400 dark:bg-red-900/10 dark:border-red-800">
              {error}
            </div>
          )}
          
          {/* Email Input */}
          <div>
            <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Correo Electrónico <span className="text-error-500">*</span>
            </Label>
            <Input 
              placeholder="tu@email.com" 
              type="email"
              name="email"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          
          {/* Password Input */}
          <div>
            <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Contraseña <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                name="password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeIcon className="fill-current" />
                ) : (
                  <EyeCloseIcon className="fill-current" />
                )}
              </button>
            </div>
          </div>
          
          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mantenerme conectado
              </span>
            </label>

          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 mt-2 text-sm font-semibold text-white transition rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

      </div>
    </div>
  );
}
