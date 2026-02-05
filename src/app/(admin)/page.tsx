import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Dashboard GSG - Sistema de Gestión de Productos",
  description: "Dashboard principal del sistema de gestión GSG",
};


export default function Ecommerce() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Panel de Control - GSG
        </h1>
        <p className="text-muted-foreground text-gray-500 dark:text-gray-400">
          Bienvenido al sistema de administración. Selecciona una opción del menú para comenzar.
        </p>
      </div>
    </div>
  );
}
