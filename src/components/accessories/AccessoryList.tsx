'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Pagination } from '@heroui/react'
import { PlusIcon } from '@/icons'
import type { AccessoryListItem } from '@/features/accessories/types'

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

const INITIAL_VISIBLE_COLUMNS = ['code', 'name', 'has_media', 'actions']

const columns = [
  { name: 'CÓDIGO', uid: 'code', sortable: true },
  { name: 'NOMBRE', uid: 'name', sortable: true },
  { name: 'MEDIA', uid: 'has_media' },
  { name: 'ACCIONES', uid: 'actions' },
]

interface Props {
  accessories: AccessoryListItem[]
}

export default function AccessoryList({ accessories }: Props) {
  const router = useRouter()
  const [filterValue, setFilterValue] = useState('')
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
    let filteredAccessories = [...accessories]

    // Filtro por búsqueda
    if (hasSearchFilter) {
      filteredAccessories = filteredAccessories.filter((accessory) =>
        accessory.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        accessory.code.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    return filteredAccessories
  }, [accessories, filterValue, hasSearchFilter])

  const pages = Math.ceil(filteredItems.length / rowsPerPage)

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredItems.slice(start, end)
  }, [page, filteredItems, rowsPerPage])

  const sortedItems = useMemo(() => {
    return [...items].sort((a: AccessoryListItem, b: AccessoryListItem) => {
      const first = a[sortDescriptor.column as keyof AccessoryListItem] as string
      const second = b[sortDescriptor.column as keyof AccessoryListItem] as string
      const cmp = first < second ? -1 : first > second ? 1 : 0

      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, items])

  const handleDelete = async (code: string) => {
    if (!confirm('¿Estás seguro de eliminar este accesorio?')) return

    try {
      const res = await fetch(`/api/accessories/${code}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      router.refresh()
    } catch (error) {
      alert('Error al eliminar el accesorio')
      console.error(error)
    }
  }

  const renderCell = useCallback((accessory: AccessoryListItem, columnKey: React.Key): React.ReactNode => {
    switch (columnKey) {
      case 'code':
        return <div className="font-mono text-sm text-gray-700 dark:text-gray-200">{accessory.code}</div>
      case 'name':
        return (
          <div className="flex flex-col">
            <span className="text-theme-sm font-medium text-gray-900 dark:text-white">{accessory.name}</span>
            <span className="text-theme-xs text-gray-500 dark:text-gray-400">ID: {accessory.id}</span>
          </div>
        )
      case 'has_media':
        return (
          <div className="flex items-center gap-3">
            {/* Has Photo */}
            <div className="flex items-center gap-1" title={accessory.has_photo ? 'Tiene foto' : 'Sin foto'}>
              {accessory.has_photo ? (
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400">Foto</span>
            </div>
            
            {/* Has PDF */}
            <div className="flex items-center gap-1" title={accessory.has_pdf ? 'Tiene PDF' : 'Sin PDF'}>
              {accessory.has_pdf ? (
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400">PDF</span>
            </div>
          </div>
        )
      case 'tones':
        return (
          <div className="flex flex-wrap gap-1">
            {accessory.light_tones && accessory.light_tones.length > 0 ? (
              accessory.light_tones.map((tone) => (
                <span
                  key={tone.id}
                  className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                >
                  {tone.name}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        )
      case 'finishes':
        return (
          <div className="flex flex-wrap gap-1">
            {accessory.finishes && accessory.finishes.length > 0 ? (
              accessory.finishes.map((finish) => (
                <span
                  key={finish.id}
                  className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                >
                  {finish.name}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        )
      case 'actions':
        return (
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              variant="flat" 
              isIconOnly
              onPress={() => router.push(`/accessories/${accessory.code}`)} 
              className="text-gray-700 dark:text-gray-300"
              aria-label="Ver accesorio"
            >
              <EyeIcon />
            </Button>
            <Button 
              size="sm" 
              variant="flat" 
              isIconOnly
              onPress={() => router.push(`/accessories/${accessory.code}/edit`)} 
              className="text-gray-700 dark:text-gray-300"
              aria-label="Editar accesorio"
            >
              <PencilIcon />
            </Button>
            <Button 
              size="sm" 
              variant="flat" 
              color="danger" 
              isIconOnly
              onPress={() => handleDelete(accessory.code)} 
              className="text-error-600 dark:text-error-400"
              aria-label="Eliminar accesorio"
            >
              <TrashIcon />
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
          </div>
          <div className="flex gap-3">
            <Button 
              color="primary" 
              endContent={<PlusIcon className="w-4 h-4" />}
              onPress={() => router.push('/accessories/new')}
              className="bg-brand-500 hover:bg-brand-600 text-white shadow-theme-xs"
            >
              Crear Accesorio
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 text-theme-sm">
            {filteredItems.length} de {accessories.length} accesorios
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
  }, [filterValue, onSearchChange, onRowsPerPageChange, accessories.length, filteredItems.length, onClear, router, rowsPerPage])

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1
    const end = Math.min(page * rowsPerPage, filteredItems.length)
    
    return (
      <div className="py-4 px-2 flex justify-between items-center border-t border-gray-200 dark:border-gray-700 mt-4">
        <span className="w-[30%] text-theme-sm text-gray-500 dark:text-gray-400">
          {filteredItems.length > 0 ? `${start}-${end} de ${filteredItems.length}` : '0 de 0'}
        </span>
        <Pagination
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
          size="lg"
          classNames={{
            wrapper: 'gap-2 overflow-visible h-10',
            item: 'w-9 h-9 text-sm min-w-9',
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
  }, [page, rowsPerPage, filteredItems.length, pages, onPreviousPage, onNextPage])

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Accesorios</h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Gestiona todos los accesorios de tu inventario
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
                      No se encontraron accesorios
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
