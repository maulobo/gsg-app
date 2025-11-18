'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Pagination } from '@heroui/react'
import { PlusIcon } from '@/icons'

// Iconos inline
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

import type { LedProfileListItem } from '@/features/led-profiles/types'

const INITIAL_VISIBLE_COLUMNS = ['name', 'code', 'has_media', 'actions']

const columns = [
  { name: 'NOMBRE', uid: 'name', sortable: true },
  { name: 'CÓDIGO', uid: 'code', sortable: true },
  { name: 'MEDIA', uid: 'has_media' },
  { name: 'ACCIONES', uid: 'actions' },
]

type LedProfileListProps = {
  profiles: LedProfileListItem[]
}

export function LedProfileList({ profiles }: LedProfileListProps) {
  const router = useRouter()
  const [filterValue, setFilterValue] = useState('')
  const [materialFilter, setMaterialFilter] = useState<string>('all')
  const [selectedKeys, setSelectedKeys] = useState(new Set([]))
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS))
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortDescriptor, setSortDescriptor] = useState({ column: 'name', direction: 'ascending' })
  const [page, setPage] = useState(1)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (code: string) => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este perfil LED?\n\nSe eliminarán:\n- El perfil\n- Todas las relaciones con difusores\n- Todas las relaciones con acabados\n- Todos los items incluidos/opcionales\n- Todas las imágenes\n\nEsta acción no se puede deshacer.')) {
      return
    }

    setIsDeleting(code)

    try {
      const profile = profiles.find(p => p.code === code)
      if (!profile) throw new Error('Perfil no encontrado')

      const res = await fetch(`/api/led-profiles/${profile.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al eliminar el perfil')
      }

      alert('✅ Perfil LED eliminado exitosamente')
      router.refresh()
    } catch (error: any) {
      console.error('Error eliminando perfil LED:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setIsDeleting(null)
    }
  }

  const hasSearchFilter = Boolean(filterValue)

  const headerColumns = useMemo(() => {
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  // Obtener materiales únicos
  const materials = useMemo(() => {
    const uniqueMaterials = new Set(
      profiles
        .map(p => p.material)
        .filter(Boolean)
    )
    return Array.from(uniqueMaterials).sort()
  }, [profiles])

  const filteredItems = useMemo(() => {
    let filteredProfiles = [...profiles]

    // Filtro por búsqueda
    if (hasSearchFilter) {
      filteredProfiles = filteredProfiles.filter((profile) =>
        profile.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        profile.code.toLowerCase().includes(filterValue.toLowerCase()) ||
        (profile.description && profile.description.toLowerCase().includes(filterValue.toLowerCase()))
      )
    }

    // Filtro por material
    if (materialFilter !== 'all') {
      filteredProfiles = filteredProfiles.filter(
        (profile) => profile.material === materialFilter
      )
    }

    return filteredProfiles
  }, [profiles, filterValue, materialFilter, hasSearchFilter])

  const pages = Math.ceil(filteredItems.length / rowsPerPage)

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredItems.slice(start, end)
  }, [page, filteredItems, rowsPerPage])

  const sortedItems = useMemo(() => {
    return [...items].sort((a: LedProfileListItem, b: LedProfileListItem) => {
      const first = a[sortDescriptor.column as keyof LedProfileListItem] as string | number
      const second = b[sortDescriptor.column as keyof LedProfileListItem] as string | number
      const cmp = first < second ? -1 : first > second ? 1 : 0

      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, items])

  const renderCell = useCallback((profile: LedProfileListItem, columnKey: React.Key): React.ReactNode => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex flex-col">
            <span className="text-theme-sm font-medium text-gray-900 dark:text-white">{profile.name}</span>
            {profile.description && (
              <span className="text-theme-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                {profile.description}
              </span>
            )}
          </div>
        )
      case 'code':
        return <div className="font-mono text-sm text-gray-700 dark:text-gray-200">{profile.code}</div>
      case 'has_media':
        return (
          <div className="flex gap-3 items-center justify-center">
            {/* Indicador de Foto */}
            <div className="flex items-center gap-1" title={profile.has_photo ? 'Tiene foto' : 'Sin foto'}>
              {profile.has_photo ? (
                <svg className="w-4 h-4 text-success-600 dark:text-success-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`text-xs ${profile.has_photo ? 'text-success-600 dark:text-success-400' : 'text-gray-400 dark:text-gray-500'}`}>
                Foto
              </span>
            </div>
            
            {/* Indicador de PDF */}
            <div className="flex items-center gap-1" title={profile.has_pdf ? 'Tiene PDF' : 'Sin PDF'}>
              {profile.has_pdf ? (
                <svg className="w-4 h-4 text-success-600 dark:text-success-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`text-xs ${profile.has_pdf ? 'text-success-600 dark:text-success-400' : 'text-gray-400 dark:text-gray-500'}`}>
                PDF
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
              onPress={() => router.push(`/led-profiles/${profile.code}/edit`)} 
              className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Editar perfil LED"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button 
              isIconOnly
              size="sm" 
              variant="flat" 
              color="danger" 
              onPress={() => handleDelete(profile.code)}
              isDisabled={isDeleting === profile.code}
              className="text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10"
              aria-label="Eliminar perfil LED"
            >
              {isDeleting === profile.code ? (
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
  }, [router, isDeleting])

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
              placeholder="Buscar por nombre, código o descripción..."
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
          
          {/* Filtro de material y botón crear */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-theme-sm text-gray-900 dark:text-white shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              value={materialFilter}
              onChange={(e) => {
                setMaterialFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">Todos los materiales</option>
              {materials.map((material) => (
                <option key={material || 'null'} value={material || ''}>
                  {material}
                </option>
              ))}
            </select>
            <Button 
              color="primary" 
              endContent={<PlusIcon className="w-4 h-4" />}
              onPress={() => router.push('/led-profiles/new')}
              className="bg-brand-500 hover:bg-brand-600 text-white shadow-theme-xs w-full sm:w-auto"
            >
              Crear Perfil LED
            </Button>
          </div>
        </div>
        
        {/* Info y selector de filas */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-theme-sm">
            {filteredItems.length} de {profiles.length} perfiles LED
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
  }, [filterValue, materialFilter, onSearchChange, onRowsPerPageChange, profiles.length, filteredItems.length, onClear, router, rowsPerPage, materials])

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1
    const end = Math.min(page * rowsPerPage, filteredItems.length)
    
    return (
      <div className="py-3 sm:py-4 px-2 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-200 dark:border-gray-700 mt-4">
        <span className="text-xs sm:text-theme-sm text-gray-500 dark:text-gray-400 order-1 sm:order-none">
          {filteredItems.length === 0 
            ? 'Sin perfiles LED'
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
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Perfiles LED</h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Gestiona el catálogo completo de perfiles LED
          </p>
        </div>
        <div className="p-4 sm:p-6">
          {topContent}
          
          {/* Vista de tabla para desktop */}
          <div className="hidden md:block overflow-auto shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                <tr>
                  {headerColumns.map((col) => (
                    <th
                      key={col.uid}
                      className={`px-6 py-4 text-theme-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 
                        ${col.uid === 'name' ? 'text-left w-[40%]' : ''}
                        ${col.uid === 'code' ? 'text-left w-[20%]' : ''}
                        ${col.uid === 'has_media' ? 'text-center w-[25%]' : ''}
                        ${col.uid === 'actions' ? 'text-right w-[15%]' : ''}
                        ${col.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/50' : ''}`}
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
                      <div className={`flex items-center gap-2 ${col.uid === 'actions' ? 'justify-end' : col.uid === 'has_media' ? 'justify-center' : 'justify-start'}`}>
                        <span>{col.name}</span>
                        {col.sortable && sortDescriptor.column === col.uid && (
                          <svg className="w-3 h-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
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
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={headerColumns.length} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                      No se encontraron perfiles LED
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {headerColumns.map((col) => (
                        <td key={col.uid} className={`px-6 py-4 align-middle
                          ${col.uid === 'name' ? 'text-left' : ''}
                          ${col.uid === 'code' ? 'text-left' : ''}
                          ${col.uid === 'has_media' ? 'text-center' : ''}
                          ${col.uid === 'actions' ? 'text-right' : ''}`}>
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
                No se encontraron perfiles LED
              </div>
            ) : (
              sortedItems.map((profile) => (
                <div 
                  key={profile.id} 
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/50"
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                        {profile.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {profile.code}
                        </span>
                        {profile.material && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {profile.material}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  {profile.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {profile.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-3">
                    {profile.max_w_per_m && (
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {profile.max_w_per_m} W/m
                      </span>
                    )}
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/[0.12] dark:text-blue-400">
                      {profile.diffusers_count} difusores
                    </span>
                    <span className="inline-flex items-center justify-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-500/[0.12] dark:text-purple-400">
                      {profile.finishes_count} acabados
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Button 
                      size="sm" 
                      variant="flat" 
                      onPress={() => router.push(`/led-profiles/${profile.code}`)} 
                      className="flex-1 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                      startContent={<EyeIcon className="w-4 h-4" />}
                    >
                      Ver
                    </Button>
                    <Button 
                      size="sm" 
                      variant="flat" 
                      onPress={() => router.push(`/led-profiles/${profile.code}/edit`)} 
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
                      onPress={() => handleDelete(profile.code)}
                      isDisabled={isDeleting === profile.code}
                      className="text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10"
                      aria-label="Eliminar perfil LED"
                    >
                      {isDeleting === profile.code ? (
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
