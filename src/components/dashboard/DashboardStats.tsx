"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ProductStat {
  name: string;
  count: number;
  lastViewed?: string;
}

interface DashboardStatsProps {
  limit?: number;
  daysBack?: number;
}

export default function DashboardStats({ limit = 10, daysBack = 7 }: DashboardStatsProps = {}) {
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Calcular fecha límite
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - daysBack);

        // Esta consulta busca todos los eventos 'view_product'
        // NOTA: Si la tabla crece mucho, es recomendable crear una "View" o usar .rpc() 
        // en Supabase para hacer la agregación en el servidor.
        let query = supabase
          .from('analytics_events')
          .select('product_name, product_code, created_at, metadata')
          .eq('event_type', 'view_product')
          .order('created_at', { ascending: false });

        // Filtrar por fecha si no es "todo"
        if (daysBack > 0) {
          query = query.gte('created_at', dateLimit.toISOString());
        }

        const { data, error } = await query;
          
        if (error) {
          console.error('Error fetching stats:', error);
          setLoading(false);
          return;
        }

        if (!data) {
          setLoading(false);
          return;
        }

        setTotalViews(data.length);

        // Procesar datos para contar
        const productMap = new Map<string, ProductStat>();
        
        data.forEach((item: any) => {
          const key = item.product_name || 'Desconocido';
          const viewedAt = item.metadata?.viewedAt || item.created_at;
          
          if (productMap.has(key)) {
            const existing = productMap.get(key)!;
            existing.count++;
            // Actualizar última vista si es más reciente
            if (!existing.lastViewed || new Date(viewedAt) > new Date(existing.lastViewed)) {
              existing.lastViewed = viewedAt;
            }
          } else {
            productMap.set(key, {
              name: key,
              count: 1,
              lastViewed: viewedAt
            });
          }
        });

        const sorted = Array.from(productMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);

        setTopProducts(sorted);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [limit, daysBack]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Productos más vistos
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {daysBack > 0 ? `Últimos ${daysBack} días` : 'Todo el tiempo'}
        </span>
      </div>
      
      {loading ? (
        <div className="py-4 text-center text-gray-500 animate-pulse">Cargando estadísticas...</div>
      ) : topProducts.length === 0 ? (
        <div className="py-4 text-center text-gray-500">No hay datos de visitas recientes</div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total de visualizaciones: <span className="font-bold text-gray-900 dark:text-white">{totalViews}</span>
            </p>
          </div>
          
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {topProducts.map((p, i) => (
              <li key={i} className="py-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1 min-w-0">
                    <span className={`flex items-center justify-center w-6 h-6 mt-0.5 mr-3 text-xs font-bold rounded-full flex-shrink-0 ${
                      i < 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 dark:text-gray-300 font-medium text-sm truncate" title={p.name}>
                        {p.name}
                      </p>
                      {p.lastViewed && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Última vista: {formatDate(p.lastViewed)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm ml-2 flex-shrink-0">
                    {p.count} vistas
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
