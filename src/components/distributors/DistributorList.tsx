'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Pagination } from '@heroui/react'
import { PlusIcon } from '@/icons'

// Inline icons
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

const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ToggleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

import type { DistributorWithZone } from '@/features/distributors/types'

const INITIAL_VISIBLE_COLUMNS = ['zone', 'name', 'locality', 'contact', 'active', 'actions']

const columns = [
  { name: 'ZONA', uid: 'zone', sortable: true },
  { name: 'NOMBRE', uid: 'name', sortable: true },
  { name: 'LOCALIDAD', uid: 'locality', sortable: true },
  { name: 'CONTACTO', uid: 'contact' },
  { name: 'ESTADO', uid: 'active' },
  { name: 'ACCIONES', uid: 'actions' },
]

type DistributorListProps = {
  distributors: DistributorWithZone[]
}

export function DistributorList({ distributors }: DistributorListProps) {
  const router = useRouter()
  const [filterValue, setFilterValue] = useState('')
  const [zoneFilter, setZoneFilter] = useState<string>('all')
  const [selectedKeys, setSelectedKeys] = useState(new Set([]))
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS))
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortDescriptor, setSortDescriptor] = useState({ column: 'name', direction: 'ascending' })
  const [page, setPage] = useState(1)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este distribuidor?\n\nEsta acción no se puede deshacer.')) {
      return
    }

    setIsDeleting(id)

    try {
      const res = await fetch(`/api/distributors/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al eliminar el distribuidor')
      }

      alert('✅ Distribuidor eliminado exitosamente')
      router.refresh()
    } catch (error: any) {
      console.error('Error eliminando distribuidor:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setIsDeleting(null)
    }
  }

  const toggleActive = async (id: number, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/distributors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al actualizar estado')
      }

      router.refresh()
    } catch (error: any) {
      console.error('Error toggling active:', error)
      alert(`❌ Error: ${error.message}`)
    }
  }

  const hasSearchFilter = Boolean(filterValue)

  const headerColumns = useMemo(() => {
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  // Get unique zones
  const zones = useMemo(() => {
    const uniqueZones = new Set(
      distributors.map(d => d.zone.name).filter(Boolean)
    )
    return Array.from(uniqueZones).sort()
  }, [distributors])

  const filteredItems = useMemo(() => {
    let filteredDistributors = [...distributors]

    // Search filter
    if (hasSearchFilter) {
      filteredDistributors = filteredDistributors.filter((distributor) =>
        distributor.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        distributor.locality.toLowerCase().includes(filterValue.toLowerCase()) ||
        distributor.address.toLowerCase().includes(filterValue.toLowerCase()) ||
        (distributor.email && distributor.email.toLowerCase().includes(filterValue.toLowerCase())) ||
        (distributor.phone && distributor.phone.toLowerCase().includes(filterValue.toLowerCase()))
      )
    }

    // Zone filter
    if (zoneFilter !== 'all') {
      filteredDistributors = filteredDistributors.filter(
        (distributor) => distributor.zone.name === zoneFilter
      )
    }

    return filteredDistributors
  }, [distributors, filterValue, zoneFilter, hasSearchFilter])

  const pages = Math.ceil(filteredItems.length / rowsPerPage)

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredItems.slice(start, end)
  }, [page, filteredItems, rowsPerPage])

  const sortedItems = useMemo(() => {
    return [...items].sort((a: DistributorWithZone, b: DistributorWithZone) => {
      let first: string | number | boolean = ''
      let second: string | number | boolean = ''

      if (sortDescriptor.column === 'zone') {
        first = a.zone.name
        second = b.zone.name
      } else {
        first = a[sortDescriptor.column as keyof DistributorWithZone] as string | number | boolean
        second = b[sortDescriptor.column as keyof DistributorWithZone] as string | number | boolean
      }

      const cmp = first < second ? -1 : first > second ? 1 : 0
      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, items])

  const renderCell = useCallback((distributor: DistributorWithZone, columnKey: React.Key): React.ReactNode => {
    switch (columnKey) {
      case 'zone':
        return (
          <div className="flex items-center">
            <span className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-900/30 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-400">
              {distributor.zone.name}
            </span>
          </div>
        )
      case 'name':
        return (
          <div className="flex flex-col">
            <span className="text-theme-sm font-medium text-gray-900 dark:text-white">{distributor.name}</span>
            {distributor.email && (
              <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                {distributor.email}
              </span>
            )}
          </div>
        )
      case 'locality':
        return (
          <div className="flex flex-col">
            <span className="text-sm text-gray-700 dark:text-gray-200">{distributor.locality}</span>
            {distributor.address && (
              <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1" title={distributor.address}>
                {distributor.address}
              </span>
            )}
          </div>
        )
      case 'contact':
        return (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {distributor.phone || '—'}
          </div>
        )
      case 'active':
        return (
          <div className="flex items-center">
            {distributor.active ? (
              <span className="inline-flex items-center rounded-full bg-success-50 dark:bg-success-900/30 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:text-success-400">
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                Inactivo
              </span>
            )}
          </div>
        )
      case 'actions':
        return (
          <div className="flex justify-end gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => router.push(`/distributors/${distributor.id}/edit`)}
              title="Editar distribuidor"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color={distributor.active ? 'warning' : 'success'}
              onPress={() => toggleActive(distributor.id, distributor.active)}
              title={distributor.active ? 'Desactivar' : 'Activar'}
            >
              <ToggleIcon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => handleDelete(distributor.id)}
              isDisabled={isDeleting === distributor.id}
              title="Eliminar distribuidor"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        )
      default:
        return null
    }
  }, [router, isDeleting])

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-end">
          <div className="w-full sm:max-w-[44%]">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar distribuidores..."
                value={filterValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </div>
              {filterValue && (
                <button
                  onClick={onClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <select
              value={zoneFilter}
              onChange={(e) => {
                setZoneFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            >
              <option value="all">Todas las zonas</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>

            <Button
              color="primary"
              endContent={<PlusIcon />}
              onPress={() => router.push('/distributors/new')}
            >
              Nuevo Distribuidor
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            {distributors.length} distribuidores totales
          </span>
          <label className="flex items-center text-default-400 text-small">
            Filas por página:
            <select
              className="bg-transparent outline-none text-default-400 text-small ml-1"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                setPage(1)
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </label>
        </div>
      </div>
    )
  }, [filterValue, zoneFilter, zones, distributors.length, rowsPerPage, onSearchChange, onClear, router])

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-gray-600 dark:text-gray-400">
          {filteredItems.length > 0
            ? `${(page - 1) * rowsPerPage + 1}-${Math.min(page * rowsPerPage, filteredItems.length)} de ${filteredItems.length}`
            : '0 resultados'}
        </span>
        <Pagination
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages || 1}
          onChange={setPage}
          className="gap-2"
          size="lg"
          variant="bordered"
          classNames={{
            wrapper: 'gap-2 overflow-visible h-10',
            item: 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base min-w-9 sm:min-w-10 text-gray-700 dark:text-gray-200',
            cursor: 'bg-primary-500 text-white dark:text-white',
            next: 'text-gray-700 dark:text-gray-200',
            prev: 'text-gray-700 dark:text-gray-200',
          }}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          {/* Placeholder for future actions */}
        </div>
      </div>
    )
  }, [page, pages, filteredItems.length, rowsPerPage])

  return (
    <div className="w-full space-y-4">
      {topContent}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {headerColumns.map((column) => (
                <th
                  key={column.uid}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    if (column.sortable) {
                      setSortDescriptor({
                        column: column.uid,
                        direction:
                          sortDescriptor.column === column.uid && sortDescriptor.direction === 'ascending'
                            ? 'descending'
                            : 'ascending',
                      })
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {column.name}
                    {column.sortable && sortDescriptor.column === column.uid && (
                      <span>{sortDescriptor.direction === 'ascending' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={headerColumns.length} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron distribuidores
                </td>
              </tr>
            ) : (
              sortedItems.map((distributor) => (
                <tr key={distributor.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  {headerColumns.map((column) => (
                    <td key={column.uid} className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {renderCell(distributor, column.uid)}
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
  )
}
