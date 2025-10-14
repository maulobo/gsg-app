'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { ProductListItem } from '@/features/products/types'

type Category = {
  id: number
  name: string
  slug: string
}

type ProductsDashboardProps = {
  products: ProductListItem[]
  categories: Category[]
}

export function ProductsDashboard({ products, categories }: ProductsDashboardProps) {
  const router = useRouter()

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalProducts = products.length
    const totalVariants = products.reduce((sum, p) => sum + p.variants_count, 0)
    const totalCategories = categories.length
    const featuredProducts = products.filter(p => p.is_featured).length

    // Productos por categoría
    const productsByCategory = categories.map(cat => ({
      name: cat.name,
      count: products.filter(p => p.category.id === cat.id).length,
      id: cat.id
    })).filter(c => c.count > 0)

    // Categoría con más productos
    const topCategory = productsByCategory.length > 0
      ? productsByCategory.reduce((max, cat) => cat.count > max.count ? cat : max)
      : null

    // Promedio de variantes por producto
    const avgVariants = totalProducts > 0
      ? (totalVariants / totalProducts).toFixed(1)
      : '0'

    return {
      totalProducts,
      totalVariants,
      totalCategories,
      featuredProducts,
      productsByCategory,
      topCategory,
      avgVariants
    }
  }, [products, categories])

  // Productos recientes (últimos 5)
  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [products])

  // Colores para el gráfico
  const chartColors = [
    'bg-brand-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-md font-bold text-gray-900 dark:text-white">
            Dashboard de Productos
          </h1>
          <p className="text-theme-sm text-gray-600 dark:text-gray-400 mt-1">
            Resumen y estadísticas de tu inventario
          </p>
        </div>
        <button
          onClick={() => router.push('/products')}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
        >
          Ver Todos los Productos
        </button>
      </div>

      {/* Cards de métricas principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Productos */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Productos
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalProducts}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/[0.12]">
              <svg className="h-6 w-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              En {stats.totalCategories} categorías
            </span>
          </div>
        </div>

        {/* Total Variantes */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Variantes
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalVariants}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/[0.12]">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Promedio: {stats.avgVariants} por producto
            </span>
          </div>
        </div>

        {/* Productos Destacados */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Destacados
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.featuredProducts}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-500/[0.12]">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {((stats.featuredProducts / stats.totalProducts) * 100).toFixed(0)}% del total
            </span>
          </div>
        </div>

        {/* Categorías */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Categorías
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalCategories}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-500/[0.12]">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {stats.topCategory && (
              <span className="text-gray-600 dark:text-gray-400">
                Top: {stats.topCategory.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos y tablas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Productos por Categoría */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Productos por Categoría
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.productsByCategory.map((cat, index) => {
                const percentage = (cat.count / stats.totalProducts) * 100
                return (
                  <div key={cat.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {cat.name}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {cat.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-full ${chartColors[index % chartColors.length]} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Productos Recientes */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Productos Recientes
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </h4>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {product.code}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">•</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {product.category.name}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span className="inline-flex items-center justify-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400">
                      {product.variants_count} var.
                    </span>
                    <button
                      onClick={() => router.push(`/products/${product.code}`)}
                      className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {recentProducts.length === 0 && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-8">
                No hay productos recientes
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Accesos Rápidos
          </h3>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => router.push('/products/new')}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/[0.06]"
            >
              <svg className="h-8 w-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Crear Producto
              </span>
            </button>

            <button
              onClick={() => router.push('/products')}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/[0.06]"
            >
              <svg className="h-8 w-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Ver Todos
              </span>
            </button>

            <button
              onClick={() => router.push('/products?featured=true')}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/[0.06]"
            >
              <svg className="h-8 w-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Destacados
              </span>
            </button>

            <button
              onClick={() => router.push('/categories')}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/[0.06]"
            >
              <svg className="h-8 w-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Categorías
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
