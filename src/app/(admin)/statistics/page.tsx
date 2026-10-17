import type { Metadata } from "next";

import StatsDashboard from "@/components/analytics/site-stats/StatsDashboard";

export const metadata: Metadata = {
  title: "Estadísticas - GSG",
  description: "Uso del catálogo y acciones de contacto en la web",
};

export default function StatisticsPage() {
  return <StatsDashboard />;
}
