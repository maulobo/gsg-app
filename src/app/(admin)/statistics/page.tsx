import type { Metadata } from "next";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ProductViewsDashboard from "@/components/analytics/ProductViewsDashboard";

export const metadata: Metadata = {
  title: "Estadísticas - GSG",
  description: "Estadísticas y métricas del sistema",
};

export default function StatisticsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Estadísticas y Analytics
        </h1>
        <p className="text-muted-foreground text-gray-500 dark:text-gray-400">
          Métricas y análisis de uso del sistema. Visualiza cómo los usuarios interactúan con tus productos.
        </p>
      </div>
      
      {/* Dashboard completo de visualizaciones */}
      <ProductViewsDashboard />

      {/* Resumen rápido - Top productos por período */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStats limit={10} daysBack={7} />
        <DashboardStats limit={10} daysBack={30} />
      </div>
    </div>
  );
}
