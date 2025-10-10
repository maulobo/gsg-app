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
import type { ProductListItem } from '@/features/products/types'

type Category = {
  id: number
  name: string
  slug: string
}

const INITIAL_VISIBLE_COLUMNS = ['name', 'code', 'category', 'variants_count', 'actions']

const columns = [
  { name: 'NOMBRE', uid: 'name', sortable: true },
  { name: 'CÓDIGO', uid: 'code', sortable: true },
  { name: 'CATEGORÍA', uid: 'category', sortable: true },
  { name: 'VARIANTES', uid: 'variants_count', sortable: true },
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
      case 'actions':
        return (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="flat" onPress={() => router.push(`/products/${product.code}/edit`)} className="text-gray-700 dark:text-gray-300">
              Editar
            </Button>
            <Button size="sm" variant="flat" color="danger" onPress={() => { if (confirm('¿Eliminar este producto?')) console.log('Delete', product.id) }} className="text-error-600 dark:text-error-400">
              Eliminar
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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end flex-1">
            <div className="relative w-full sm:max-w-[350px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={filterValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
              {filterValue && (
                <button
                  type="button"
                  onClick={onClear}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <select
              className="w-full sm:w-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-theme-sm text-gray-900 dark:text-white shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
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
          </div>
          <div className="flex gap-3">
            <Button 
              color="primary" 
              endContent={<PlusIcon className="w-4 h-4" />}
              onPress={() => router.push('/products/new')}
              className="bg-brand-500 hover:bg-brand-600 text-white shadow-theme-xs"
            >
              Crear Producto
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 text-theme-sm">
            {filteredItems.length} de {products.length} productos
          </span>
          <label className="flex items-center text-gray-500 dark:text-gray-400 text-theme-sm">
            Filas por página:
            <select
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded ml-2 px-2 py-1 text-theme-sm"
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
    return (
      <div className="py-4 px-2 flex justify-between items-center border-t border-gray-200 dark:border-gray-700 mt-4">
        <span className="w-[30%] text-theme-sm text-gray-500 dark:text-gray-400">
          {typeof selectedKeys === 'string' && selectedKeys === 'all'
            ? 'Todos los elementos seleccionados'
            : `${(selectedKeys as Set<any>).size} de ${filteredItems.length} seleccionados`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
          classNames={{
            wrapper: 'gap-0 overflow-visible h-8',
            item: 'w-8 h-8 text-sm',
            cursor: 'bg-brand-500 text-white font-medium shadow-theme-xs',
          }}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
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
  }, [selectedKeys, filteredItems.length, page, pages, onPreviousPage, onNextPage])

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Productos</h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Gestiona todos los productos de tu inventario
          </p>
        </div>
        <div className="p-6">
          {topContent}
          <div className="overflow-auto shadow-sm rounded-md">
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
          {bottomContent}
        </div>
      </div>
    </div>
  )
}
