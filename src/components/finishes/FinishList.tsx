'use client'

import { useMemo, useState, useCallback } from 'react'
import { Button, Pagination } from '@heroui/react'

// Iconos inline
const SearchIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const PencilIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

type Finish = {
  id: number
  name: string
  slug: string
  hex_color: string | null
}

type FinishListProps = {
  finishes: Finish[]
}

const INITIAL_VISIBLE_COLUMNS = ['name', 'slug', 'hex_color', 'preview', 'actions']

const columns = [
  { name: 'NOMBRE', uid: 'name', sortable: true },
  { name: 'SLUG', uid: 'slug', sortable: true },
  { name: 'COLOR HEX', uid: 'hex_color', sortable: false },
  { name: 'PREVIEW', uid: 'preview', sortable: false },
  { name: 'ACCIONES', uid: 'actions' },
]

export function FinishList({ finishes: initialFinishes }: FinishListProps) {
  const [finishes, setFinishes] = useState<Finish[]>(initialFinishes)
  const [filterValue, setFilterValue] = useState('')
  const [visibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS))
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortDescriptor, setSortDescriptor] = useState({ column: 'name', direction: 'ascending' })
  const [page, setPage] = useState(1)
  
  // Estado del modal de edición
  const [editingFinish, setEditingFinish] = useState<Finish | null>(null)
  const [newColor, setNewColor] = useState<string>('#000000')
  const [loading, setLoading] = useState(false)

  const hasSearchFilter = Boolean(filterValue)

  const headerColumns = useMemo(() => {
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  const filteredItems = useMemo(() => {
    let filteredFinishes = [...finishes]

    if (hasSearchFilter) {
      filteredFinishes = filteredFinishes.filter((finish) =>
        finish.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        finish.slug.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    return filteredFinishes
  }, [finishes, filterValue, hasSearchFilter])

  const pages = Math.ceil(filteredItems.length / rowsPerPage)

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredItems.slice(start, end)
  }, [page, filteredItems, rowsPerPage])

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Finish, b: Finish) => {
      const first = a[sortDescriptor.column as keyof Finish] as string
      const second = b[sortDescriptor.column as keyof Finish] as string
      const cmp = first < second ? -1 : first > second ? 1 : 0

      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, items])

  const handleEditClick = (finish: Finish) => {
    setEditingFinish(finish)
    setNewColor(finish.hex_color || '#000000')
  }

  const handleCloseModal = () => {
    setEditingFinish(null)
    setNewColor('#000000')
  }

  const handleSave = async () => {
    if (!editingFinish) return

    setLoading(true)
    try {
      const res = await fetch(`/api/finishes/${editingFinish.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hex_color: newColor })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar el color')
      }

      const { data } = await res.json()

      // Actualizar la lista optimísticamente
      setFinishes(prev =>
        prev.map(f => (f.id === editingFinish.id ? { ...f, hex_color: data.hex_color } : f))
      )

      handleCloseModal()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderCell = useCallback((finish: Finish, columnKey: React.Key): React.ReactNode => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex flex-col">
            <span className="text-theme-sm font-medium text-gray-900 dark:text-white">{finish.name}</span>
            <span className="text-theme-xs text-gray-500 dark:text-gray-400">ID: {finish.id}</span>
          </div>
        )
      case 'slug':
        return <div className="font-mono text-sm text-gray-700 dark:text-gray-200">{finish.slug}</div>
      case 'hex_color':
        return finish.hex_color ? (
          <code className="text-sm font-mono text-gray-900 dark:text-white">{finish.hex_color}</code>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 italic text-sm">Sin color</span>
        )
      case 'preview':
        return finish.hex_color ? (
          <div
            className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: finish.hex_color }}
          />
        ) : null
      case 'actions':
        return (
          <div className="flex justify-end gap-2">
            <Button 
              isIconOnly
              size="sm" 
              variant="flat" 
              onPress={() => handleEditClick(finish)} 
              className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Editar color"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
          </div>
        )
      default:
        return null
    }
  }, [])

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
              placeholder="Buscar por nombre o slug..."
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
        </div>
        
        {/* Info y selector de filas */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-theme-sm">
            {filteredItems.length} de {finishes.length} acabados
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
  }, [filterValue, onSearchChange, onRowsPerPageChange, finishes.length, filteredItems.length, onClear, rowsPerPage])

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1
    const end = Math.min(page * rowsPerPage, filteredItems.length)
    
    return (
      <div className="py-3 sm:py-4 px-2 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-200 dark:border-gray-700 mt-4">
        <span className="text-xs sm:text-theme-sm text-gray-500 dark:text-gray-400 order-1 sm:order-none">
          {filteredItems.length === 0 
            ? 'Sin acabados'
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
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Acabados</h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Gestiona los colores de los acabados de tus productos
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
                      No se encontraron acabados
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
                No se encontraron acabados
              </div>
            ) : (
              sortedItems.map((finish) => (
                <div 
                  key={finish.id} 
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/50"
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                        {finish.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {finish.slug}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {finish.id}
                        </span>
                      </div>
                    </div>
                    {finish.hex_color && (
                      <div
                        className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 ml-2"
                        style={{ backgroundColor: finish.hex_color }}
                      />
                    )}
                  </div>

                  {/* Color Hex */}
                  <div className="mb-3">
                    {finish.hex_color ? (
                      <code className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {finish.hex_color}
                      </code>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic text-sm">Sin color</span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Button 
                      size="sm" 
                      variant="flat" 
                      onPress={() => handleEditClick(finish)} 
                      className="flex-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      startContent={<PencilIcon className="w-4 h-4" />}
                    >
                      Editar Color
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {bottomContent}
        </div>
      </div>

      {/* Modal de edición */}
      {editingFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Editar Color - {editingFinish.name}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="hex-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color HEX
                </label>
                <input
                  id="hex-input"
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="#000000"
                  maxLength={7}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="color-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selector de color:
                </label>
                <input
                  id="color-picker"
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div
                  className="w-24 h-24 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: newColor }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{editingFinish.name}</span>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <Button 
                variant="flat" 
                onPress={handleCloseModal}
                className="border border-gray-300 dark:border-gray-700"
              >
                Cancelar
              </Button>
              <Button 
                color="primary" 
                onPress={handleSave} 
                isLoading={loading}
                className="bg-brand-500 hover:bg-brand-600 text-white"
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
