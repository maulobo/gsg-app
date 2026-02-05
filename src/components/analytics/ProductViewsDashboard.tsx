"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface ProductView {
  id: number;
  product_name: string;
  product_code: string;
  event_type: string;
  metadata: {
    path: string;
    referrer: string;
    timezone: string;
    viewedAt: string;
  };
  created_at: string;
}

interface ViewStats {
  productName: string;
  productCode: string;
  totalViews: number;
  lastViewed: string;
  viewsByHour: Record<number, number>;
  viewsByDay: Record<string, number>;
}

interface DateFilter {
  startDate: string;
  endDate: string;
  preset: 'today' | 'yesterday' | 'week' | 'month' | 'all';
}

export default function ProductViewsDashboard() {
  const [views, setViews] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      startDate: today,
      endDate: today,
      preset: 'today'
    };
  });

  useEffect(() => {
    fetchViews();
  }, [dateFilter]);

  async function fetchViews() {
    try {
      setLoading(true);
      
      let query = supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'view_product')
        .order('created_at', { ascending: false });

      // Aplicar filtros de fecha
      if (dateFilter.preset !== 'all') {
        // Crear fechas en la zona horaria local del usuario
        const startParts = dateFilter.startDate.split('-').map(Number);
        const start = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0);
        
        const endParts = dateFilter.endDate.split('-').map(Number);
        const end = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999);
        
        query = query
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching views:', error);
        return;
      }

      setViews(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Calcular estadísticas
  const stats = useMemo(() => {
    const productStats: Record<string, ViewStats> = {};
    
    views.forEach(view => {
      const key = view.product_code || 'unknown';
      
      if (!productStats[key]) {
        productStats[key] = {
          productName: view.product_name || 'Desconocido',
          productCode: view.product_code || 'N/A',
          totalViews: 0,
          lastViewed: view.created_at,
          viewsByHour: {},
          viewsByDay: {}
        };
      }

      productStats[key].totalViews++;
      
      // Actualizar última vista
      if (new Date(view.created_at) > new Date(productStats[key].lastViewed)) {
        productStats[key].lastViewed = view.created_at;
      }

      // Contar por hora
      const viewDate = new Date(view.metadata?.viewedAt || view.created_at);
      const hour = viewDate.getHours();
      productStats[key].viewsByHour[hour] = (productStats[key].viewsByHour[hour] || 0) + 1;

      // Contar por día
      const day = viewDate.toISOString().split('T')[0];
      productStats[key].viewsByDay[day] = (productStats[key].viewsByDay[day] || 0) + 1;
    });

    return Object.values(productStats)
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 20);
  }, [views]);

  // Estadísticas por hora del día (agregado de todos los productos)
  const viewsByHour = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    
    views.forEach(view => {
      const viewDate = new Date(view.metadata?.viewedAt || view.created_at);
      const hour = viewDate.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourCounts[i] || 0
    }));
  }, [views]);

  // Estadísticas por día
  const viewsByDay = useMemo(() => {
    const dayCounts: Record<string, number> = {};
    
    views.forEach(view => {
      const viewDate = new Date(view.metadata?.viewedAt || view.created_at);
      const day = viewDate.toISOString().split('T')[0];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [views]);

  // Top referrers
  const topReferrers = useMemo(() => {
    const referrerCounts: Record<string, number> = {};
    
    views.forEach(view => {
      const referrer = view.metadata?.referrer || 'Directo';
      const key = referrer || 'Directo';
      referrerCounts[key] = (referrerCounts[key] || 0) + 1;
    });

    return Object.entries(referrerCounts)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [views]);

  // Top rutas visitadas
  const topPaths = useMemo(() => {
    const pathCounts: Record<string, number> = {};
    
    views.forEach(view => {
      const path = view.metadata?.path || 'Desconocido';
      pathCounts[path] = (pathCounts[path] || 0) + 1;
    });

    return Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [views]);

  // Distribución por timezone (zona horaria)
  const timezoneStats = useMemo(() => {
    const timezoneCounts: Record<string, number> = {};
    
    views.forEach(view => {
      const timezone = view.metadata?.timezone || 'Desconocido';
      timezoneCounts[timezone] = (timezoneCounts[timezone] || 0) + 1;
    });

    return Object.entries(timezoneCounts)
      .map(([timezone, count]) => ({ timezone, count }))
      .sort((a, b) => b.count - a.count);
  }, [views]);

  const handlePresetChange = (preset: DateFilter['preset']) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    let endDate = new Date();

    switch (preset) {
      case 'today':
        startDate = today;
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = new Date(today);
        endDate.setDate(today.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'all':
        setDateFilter({ ...dateFilter, preset: 'all' });
        return;
    }

    setDateFilter({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      preset
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const maxHourViews = Math.max(...viewsByHour.map(h => h.count), 1);
  const maxDayViews = Math.max(...viewsByDay.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Análisis de Visualizaciones
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading ? 'Cargando...' : `${views.length} visualizaciones`}
          </p>
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2">
          {(['today', 'yesterday', 'week', 'month', 'all'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                dateFilter.preset === preset
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {preset === 'today' && 'Hoy'}
              {preset === 'yesterday' && 'Ayer'}
              {preset === 'week' && 'Última semana'}
              {preset === 'month' && 'Último mes'}
              {preset === 'all' && 'Todo'}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros de fecha personalizados */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={dateFilter.startDate}
            onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value, preset: 'week' })}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={dateFilter.endDate}
            onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value, preset: 'week' })}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchViews}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Cargando estadísticas...</p>
        </div>
      ) : views.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay visualizaciones en el período seleccionado</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Productos más vistos */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              Productos Más Vistos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">#</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Producto</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Código</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Vistas</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Última vista</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.map((stat, idx) => (
                    <tr key={stat.productCode} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-2">
                        <span className={`flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                          idx < 3 
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">
                        {stat.productName}
                      </td>
                      <td className="py-3 px-2 font-mono text-gray-600 dark:text-gray-400">
                        {stat.productCode}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-bold text-brand-600 dark:text-brand-400">
                          {stat.totalViews}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                        {formatDate(stat.lastViewed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visualizaciones por hora */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              Visualizaciones por Hora del Día
            </h3>
            <div className="relative h-64">
              {/* Eje Y - Líneas de referencia */}
              <div className="absolute inset-0 flex flex-col justify-between pr-8">
                {[...Array(6)].map((_, i) => {
                  const value = Math.round(maxHourViews * (5 - i) / 5);
                  return (
                    <div key={i} className="flex items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                        {value > 0 ? value : ''}
                      </span>
                      <div className="flex-1 ml-2 border-t border-gray-200 dark:border-gray-700 border-dashed" />
                    </div>
                  );
                })}
              </div>

              {/* Gráfico de barras */}
              <div className="absolute bottom-0 left-10 right-0 h-full pb-6 flex items-end justify-between gap-0.5">
                {viewsByHour.map(({ hour, count }) => (
                  <div key={hour} className="flex-1 flex flex-col items-center justify-end group">
                    {/* Barra */}
                    <div className="relative w-full flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t transition-all duration-300 hover:from-brand-700 hover:to-brand-500 cursor-pointer"
                        style={{ 
                          height: `${maxHourViews > 0 ? (count / maxHourViews) * 100 : 0}%`,
                          minHeight: count > 0 ? '4px' : '0px'
                        }}
                        title={`${hour.toString().padStart(2, '0')}:00 - ${count} vista${count !== 1 ? 's' : ''}`}
                      />
                      {/* Tooltip al hover */}
                      {count > 0 && (
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10">
                          {count} vista{count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Eje X - Horas */}
              <div className="absolute bottom-0 left-10 right-0 h-6 flex items-end justify-between">
                {viewsByHour.filter((_, i) => i % 2 === 0).map(({ hour }) => (
                  <span key={hour} className="text-xs text-gray-600 dark:text-gray-400 w-8 text-center">
                    {hour.toString().padStart(2, '0')}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Leyenda */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Actividad de usuarios a lo largo del día (hora local)
              </p>
            </div>
          </div>

          {/* Visualizaciones por día */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              Tendencia por Día
            </h3>
            <div className="relative h-64">
              {/* Eje Y - Líneas de referencia */}
              <div className="absolute inset-0 flex flex-col justify-between pr-8">
                {[...Array(6)].map((_, i) => {
                  const value = Math.round(maxDayViews * (5 - i) / 5);
                  return (
                    <div key={i} className="flex items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                        {value > 0 ? value : ''}
                      </span>
                      <div className="flex-1 ml-2 border-t border-gray-200 dark:border-gray-700 border-dashed" />
                    </div>
                  );
                })}
              </div>

              {/* Gráfico de barras */}
              <div className="absolute bottom-0 left-10 right-0 h-full pb-8 flex items-end justify-between gap-1">
                {viewsByDay.map(({ day, count }) => (
                  <div key={day} className="flex-1 flex flex-col items-center justify-end group min-w-0">
                    {/* Barra */}
                    <div className="relative w-full flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                        style={{ 
                          height: `${maxDayViews > 0 ? (count / maxDayViews) * 100 : 0}%`,
                          minHeight: count > 0 ? '4px' : '0px'
                        }}
                        title={`${formatDay(day)} - ${count} vista${count !== 1 ? 's' : ''}`}
                      />
                      {/* Tooltip al hover */}
                      {count > 0 && (
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10">
                          {count} vista{count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Eje X - Fechas (solo algunas para no saturar) */}
              <div className="absolute bottom-0 left-10 right-0 h-8 flex items-end justify-between">
                {viewsByDay.filter((_, i) => {
                  const step = Math.max(1, Math.floor(viewsByDay.length / 7));
                  return i % step === 0 || i === viewsByDay.length - 1;
                }).map(({ day }) => (
                  <span key={day} className="text-xs text-gray-600 dark:text-gray-400 rotate-0 text-center truncate max-w-[60px]">
                    {formatDay(day)}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Leyenda */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Evolución de visualizaciones en el período seleccionado
              </p>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              Fuentes de Tráfico
            </h3>
            <div className="space-y-3">
              {topReferrers.map(({ referrer, count }, idx) => {
                const totalViews = views.length;
                const percentage = ((count / totalViews) * 100).toFixed(1);
                const isTop = idx < 3;
                
                return (
                  <div key={referrer} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`text-lg ${
                          isTop ? 'opacity-100' : 'opacity-50'
                        }`}>
                          {referrer === 'Directo' || !referrer ? '🔗' : '🌐'}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate" title={referrer}>
                          {referrer === 'Directo' || !referrer ? 'Acceso Directo' : referrer}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {percentage}%
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold text-brand-700 bg-brand-100 dark:text-brand-300 dark:bg-brand-900/30 rounded">
                          {count}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Rutas Visitadas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              Rutas Más Visitadas
            </h3>
            <div className="space-y-2">
              {topPaths.map(({ path, count }, idx) => (
                <div key={path} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className={`flex items-center justify-center w-5 h-5 text-xs font-bold rounded ${
                    idx < 3 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-xs font-mono text-gray-700 dark:text-gray-300 truncate" title={path}>
                    {path}
                  </span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución Geográfica (Timezone) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              Distribución Geográfica (Zona Horaria)
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {timezoneStats.map(({ timezone, count }) => {
                const totalViews = views.length;
                const percentage = ((count / totalViews) * 100).toFixed(1);
                
                return (
                  <div
                    key={timezone}
                    className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={timezone}>
                        🌍 {timezone.replace('America/', '').replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {percentage}% del total
                      </p>
                    </div>
                    <span className="ml-3 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 rounded-full">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen general */}
          <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Visualizaciones
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {views.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Productos Únicos
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Promedio por Producto
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.length > 0 ? Math.round(views.length / stats.length) : 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
