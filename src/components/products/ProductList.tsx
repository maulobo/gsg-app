'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Pagination } from '@heroui/react'
import { PlusIcon } from '@/icons'

// Iconos simples inline
const SearchIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const EyeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const PencilIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
import type { ProductListItem } from '@/features/products/types'

type Category = {
  id: number
  name: string
  slug: string
}

const INITIAL_VISIBLE_COLUMNS = ['name', 'code', 'category', 'variants_count', 'media_status', 'actions']

const columns = [
  { name: 'NOMBRE', uid: 'name', sortable: true },
  { name: 'CÓDIGO', uid: 'code', sortable: true },
  { name: 'CATEGORÍA', uid: 'category', sortable: true },
  { name: 'VARIANTES', uid: 'variants_count', sortable: true },
  { name: 'MEDIA', uid: 'media_status' },
  { name: 'ACCIONES', uid: 'actions' },
]

type ProductListProps = {
  products: ProductListItem[]
  categories: Category[]
}

export function ProductList({ products, categories }: ProductListProps) {

  const router = useRouter()
  const [filterValue, setFilterValue] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedKeys, setSelectedKeys] = useState(new Set([]))
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS))
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortDescriptor, setSortDescriptor] = useState({ column: 'name', direction: 'ascending' })
  const [page, setPage] = useState(1)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (code: string) => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este producto?\n\nSe eliminarán:\n- El producto\n- Todas sus variantes\n- Todas las configuraciones\n- Todas las imágenes en R2\n\nEsta acción no se puede deshacer.')) {
      return
    }

    setIsDeleting(code)

    try {
      const res = await fetch(`/api/products/${code}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al eliminar el producto')
      }

      alert('✅ Producto eliminado exitosamente')
      router.refresh()
    } catch (error: any) {
      console.error('Error eliminando producto:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setIsDeleting(null)
    }
  }

  const hasSearchFilter = Boolean(filterValue)

  const headerColumns = useMemo(() => {
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  const filteredItems = useMemo(() => {
    let filteredProducts = [...products]

    // Filtro por búsqueda
    if (hasSearchFilter) {
      filteredProducts = filteredProducts.filter((product) =>
        product.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        product.code.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    // Filtro por categoría
    if (categoryFilter !== 'all') {
      filteredProducts = filteredProducts.filter(
        (product) => product.category.id.toString() === categoryFilter
      )
    }

    return filteredProducts
  }, [products, filterValue, categoryFilter, hasSearchFilter])

  const pages = Math.ceil(filteredItems.length / rowsPerPage)

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredItems.slice(start, end)
  }, [page, filteredItems, rowsPerPage])

  const sortedItems = useMemo(() => {
    return [...items].sort((a: ProductListItem, b: ProductListItem) => {
      const first = a[sortDescriptor.column as keyof ProductListItem] as string
      const second = b[sortDescriptor.column as keyof ProductListItem] as string
      const cmp = first < second ? -1 : first > second ? 1 : 0

      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, items])

  const renderCell = useCallback((product: ProductListItem, columnKey: React.Key): React.ReactNode => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex flex-col">
            <span className="text-theme-sm font-medium text-gray-900 dark:text-white">{product.name}</span>
            <span className="text-theme-xs text-gray-500 dark:text-gray-400">ID: {product.id}</span>
          </div>
        )
      case 'code':
        return <div className="font-mono text-sm text-gray-700 dark:text-gray-200">{product.code}</div>
      case 'category':
        return (
          <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-theme-xs text-gray-700 dark:text-gray-300 capitalize">{product.category.name}</span>
        )
      case 'variants_count':
        return (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center justify-center rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-medium text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400">
              {product.variants_count}
            </span>
          </div>
        )
      case 'media_status':
        return (
          <div className="flex flex-col gap-2">
            {/* Cover Images */}
            <div className="flex items-center gap-1.5" title={`${product.variants_with_cover} de ${product.variants_count} variantes con foto cover`}>
              {product.variants_with_cover > 0 ? (
                <svg className="w-4 h-4 text-success-600 dark:text-success-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`text-xs ${product.variants_with_cover > 0 ? 'font-medium text-success-700 dark:text-success-400' : 'text-gray-500 dark:text-gray-500'}`}>
                Cover: {product.variants_with_cover}/{product.variants_count}
              </span>
            </div>

            {/* Tech Images */}
            <div className="flex items-center gap-1.5" title={`${product.variants_with_tech} de ${product.variants_count} variantes con foto técnica`}>
              {product.variants_with_tech > 0 ? (
                <svg className="w-4 h-4 text-success-600 dark:text-success-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`text-xs ${product.variants_with_tech > 0 ? 'font-medium text-success-700 dark:text-success-400' : 'text-gray-500 dark:text-gray-500'}`}>
                Tech: {product.variants_with_tech}/{product.variants_count}
              </span>
            </div>

            {/* PDFs */}
            <div className="flex items-center gap-1.5" title={`${product.variants_with_pdf} de ${product.variants_count} variantes con PDF`}>
              {product.variants_with_pdf > 0 ? (
                <svg className="w-4 h-4 text-success-600 dark:text-success-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`text-xs ${product.variants_with_pdf > 0 ? 'font-medium text-success-700 dark:text-success-400' : 'text-gray-500 dark:text-gray-500'}`}>
                PDF: {product.variants_with_pdf}/{product.variants_count}
              </span>
            </div>
          </div>
        )
      case 'actions':
        return (
          <div className="flex justify-end gap-2">
            <Button 
              isIconOnly
              size="sm" 
              variant="flat" 
              onPress={() => router.push(`/products/${product.code}`)} 
              className="text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10"
              aria-label="Ver producto"
            >
              <EyeIcon className="w-4 h-4" />
            </Button>
            <Button 
              isIconOnly
              size="sm" 
              variant="flat" 
              onPress={() => router.push(`/products/${product.code}/edit`)} 
              className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Editar producto"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button 
              isIconOnly
              size="sm" 
              variant="flat" 
              color="danger" 
              onPress={() => handleDelete(product.code)}
              isDisabled={isDeleting === product.code}
              className="text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10"
              aria-label="Eliminar producto"
            >
              {isDeleting === product.code ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <TrashIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        )
      default:
        return null
    }
  }, [router])

  const onNextPage = useCallback(() => {
    if (page < pages) {
      setPage(page + 1)
    }
  }, [page, pages])

  const onPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1)
    }
  }, [page])

  const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value))
    setPage(1)
  }, [])

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value)
      setPage(1)
    } else {
      setFilterValue('')
    }
  }, [])

  const onClear = useCallback(() => {
    setFilterValue('')
    setPage(1)
  }, [])

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col gap-3">
          {/* Buscador */}
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={filterValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 sm:pl-10 pr-10 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
            {filterValue && (
              <button
                type="button"
                onClick={onClear}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Filtro de categoría y botón crear */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-theme-sm text-gray-900 dark:text-white shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Button 
              color="primary" 
              endContent={<PlusIcon className="w-4 h-4" />}
              onPress={() => router.push('/products/new')}
              className="bg-brand-500 hover:bg-brand-600 text-white shadow-theme-xs w-full sm:w-auto"
            >
              Crear Producto
            </Button>
          </div>
        </div>
        
        {/* Info y selector de filas */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-theme-sm">
            {filteredItems.length} de {products.length} productos
          </span>
          <label className="flex items-center text-gray-500 dark:text-gray-400 text-xs sm:text-theme-sm">
            Filas por página:
            <select
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded ml-2 px-2 py-1 text-xs sm:text-theme-sm"
              value={rowsPerPage}
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    )
  }, [filterValue, categoryFilter, onSearchChange, onRowsPerPageChange, products.length, filteredItems.length, onClear, router, rowsPerPage, categories])

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1
    const end = Math.min(page * rowsPerPage, filteredItems.length)
    
    return (
      <div className="py-3 sm:py-4 px-2 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-200 dark:border-gray-700 mt-4">
        <span className="text-xs sm:text-theme-sm text-gray-500 dark:text-gray-400 order-1 sm:order-none">
          {filteredItems.length === 0 
            ? 'Sin productos'
            : `${start}-${end} de ${filteredItems.length}`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages || 1}
          onChange={setPage}
          classNames={{
            wrapper: 'gap-0 overflow-visible h-8',
            item: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm min-w-7 sm:min-w-8',
            cursor: 'bg-brand-500 text-white font-medium shadow-theme-xs',
            prev: 'w-7 h-7 sm:w-8 sm:h-8 min-w-7 sm:min-w-8',
            next: 'w-7 h-7 sm:w-8 sm:h-8 min-w-7 sm:min-w-8',
          }}
        />
        <div className="hidden lg:flex w-auto justify-end gap-2">
          <Button 
            isDisabled={pages === 1} 
            size="sm" 
            variant="flat" 
            onPress={onPreviousPage}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            Anterior
          </Button>
          <Button 
            isDisabled={pages === 1} 
            size="sm" 
            variant="flat" 
            onPress={onNextPage}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            Siguiente
          </Button>
        </div>
      </div>
    )
  }, [page, rowsPerPage, filteredItems.length, pages, onPreviousPage, onNextPage])

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Productos</h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Gestiona todos los productos de tu inventario
          </p>
        </div>
        <div className="p-4 sm:p-6">
          {topContent}
          
          {/* Vista de tabla para desktop */}
          <div className="hidden md:block overflow-auto shadow-sm rounded-md">
            <table className="w-full table-fixed border-collapse rounded-md">
              <thead className="bg-white/95 dark:bg-gray-900/95 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                  {headerColumns.map((col) => (
                      <th
                        key={col.uid}
                        className={`text-left px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 ${col.uid === 'actions' ? 'text-right' : ''} ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                        onClick={() => {
                          if (!col.sortable) return
                          setSortDescriptor((s) => {
                            if (s.column === col.uid) {
                              return { column: col.uid, direction: s.direction === 'ascending' ? 'descending' : 'ascending' }
                            }
                            return { column: col.uid, direction: 'ascending' }
                          })
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{col.name}</span>
                          {col.sortable && sortDescriptor.column === col.uid && (
                            <svg className="w-3 h-3 text-gray-400 ml-1" viewBox="0 0 20 20" fill="currentColor">
                              {sortDescriptor.direction === 'ascending' ? (
                                <path d="M5 12h10l-5-8-5 8z" />
                              ) : (
                                <path d="M5 8h10l-5 8-5-8z" />
                              )}
                            </svg>
                          )}
                        </div>
                      </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {sortedItems.length === 0 ? (
                    <tr>
                      <td colSpan={headerColumns.length} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">
                        No se encontraron productos
                      </td>
                    </tr>
                  ) : (
                    sortedItems.map((item) => (
                      <tr key={item.id} className="transition-colors odd:bg-white even:bg-gray-50 hover:bg-gray-100 dark:odd:bg-gray-900 dark:even:bg-gray-800 dark:hover:bg-gray-800">
                        {headerColumns.map((col) => (
                          <td key={col.uid} className={`px-4 py-3 align-top text-theme-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 ${col.uid === 'actions' ? 'text-right' : ''}`}>
                            {renderCell(item, col.uid)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>

          {/* Vista de tarjetas para móvil */}
          <div className="md:hidden space-y-3">
            {sortedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                No se encontraron productos
              </div>
            ) : (
              sortedItems.map((product) => (
                <div 
                  key={product.id} 
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/50"
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {product.code}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {product.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <span className="inline-flex items-center justify-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400">
                        {product.variants_count} var
                      </span>
                    </div>
                  </div>

                  {/* Categoría */}
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 capitalize">
                      {product.category.name}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Button 
                      size="sm" 
                      variant="flat" 
                      onPress={() => router.push(`/products/${product.code}`)} 
                      className="flex-1 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                      startContent={<EyeIcon className="w-4 h-4" />}
                    >
                      Ver
                    </Button>
                    <Button 
                      size="sm" 
                      variant="flat" 
                      onPress={() => router.push(`/products/${product.code}/edit`)} 
                      className="flex-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      startContent={<PencilIcon className="w-4 h-4" />}
                    >
                      Editar
                    </Button>
                    <Button 
                      isIconOnly
                      size="sm" 
                      variant="flat" 
                      color="danger" 
                      onPress={() => handleDelete(product.code)}
                      isDisabled={isDeleting === product.code}
                      className="text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10"
                      aria-label="Eliminar producto"
                    >
                      {isDeleting === product.code ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {bottomContent}
        </div>
      </div>
    </div>
  )
}
