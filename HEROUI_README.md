# Hero UI Integration

Este proyecto utiliza [Hero UI](https://www.heroui.com/) - una librería moderna de componentes UI para React y Next.js.

## 🚀 Instalación

Ya está instalado en el proyecto:

```bash
pnpm add @heroui/react framer-motion
```

## ⚙️ Configuración

### 1. Provider Setup

El `HeroUIProvider` está configurado en `src/app/layout.tsx`:

```tsx
import { HeroUIProvider } from '@/context/HeroUIProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </body>
    </html>
  )
}
```

### 2. Tailwind CSS

Hero UI funciona perfectamente con Tailwind CSS v4 que ya está configurado en tu proyecto.

## 📚 Componentes Disponibles

Hero UI incluye más de 50 componentes listos para usar:

### Layout
- `Divider` - Líneas divisoras
- `Spacer` - Espaciador flexible

### Navigation
- `Navbar` - Barra de navegación
- `Tabs` - Pestañas
- `Breadcrumbs` - Migas de pan
- `Pagination` - Paginación
- `Link` - Enlaces

### Inputs
- `Button` - Botones con múltiples variantes
- `Input` - Campos de texto
- `Textarea` - Área de texto multilínea
- `Select` - Selector desplegable
- `Checkbox` - Casillas de verificación
- `Radio` - Botones de radio
- `Switch` - Interruptor
- `Slider` - Control deslizante
- `DatePicker` - Selector de fecha
- `TimeInput` - Entrada de tiempo

### Data Display
- `Table` - Tablas con ordenación y paginación
- `Card` - Tarjetas de contenido
- `Avatar` - Avatares de usuario
- `Chip` - Etiquetas/badges
- `Badge` - Insignias
- `Progress` - Barras de progreso
- `Spinner` - Indicadores de carga
- `Skeleton` - Placeholders de carga
- `Image` - Imágenes con lazy loading

### Overlay
- `Modal` - Ventanas modales
- `Popover` - Contenido flotante
- `Tooltip` - Información contextual
- `Dropdown` - Menús desplegables

### Feedback
- `Alert` - Mensajes de alerta

## 🎨 Uso Básico

### Button

```tsx
import { Button } from '@heroui/react'

<Button color="primary">Click me</Button>
<Button color="success" variant="flat">Success</Button>
<Button isLoading>Loading</Button>
```

### Card

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/react'

<Card>
  <CardHeader>
    <h4>Card Title</h4>
  </CardHeader>
  <CardBody>
    <p>Card content goes here</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input

```tsx
import { Input } from '@heroui/react'

<Input
  label="Email"
  placeholder="Enter your email"
  type="email"
  variant="bordered"
/>
```

### Modal

```tsx
'use client'

import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react'

export function MyComponent() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <>
      <Button onPress={onOpen}>Open Modal</Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Modal Title</ModalHeader>
              <ModalBody>
                <p>Modal content</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Action
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
```

### Table

```tsx
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react'

<Table aria-label="Example table">
  <TableHeader>
    <TableColumn>NAME</TableColumn>
    <TableColumn>ROLE</TableColumn>
    <TableColumn>STATUS</TableColumn>
  </TableHeader>
  <TableBody>
    <TableRow key="1">
      <TableCell>Tony Reichert</TableCell>
      <TableCell>CEO</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Select

```tsx
import { Select, SelectItem } from '@heroui/react'

<Select label="Favorite Animal" placeholder="Select an animal">
  <SelectItem key="cat">Cat</SelectItem>
  <SelectItem key="dog">Dog</SelectItem>
  <SelectItem key="elephant">Elephant</SelectItem>
</Select>
```

## 🎨 Colores y Variantes

Hero UI soporta múltiples colores:
- `default`
- `primary`
- `secondary`
- `success`
- `warning`
- `danger`

Y variantes:
- `solid` (por defecto)
- `bordered`
- `flat`
- `faded`
- `shadow`
- `ghost`
- `light`

Ejemplo:
```tsx
<Button color="primary" variant="flat">Flat Primary</Button>
<Button color="success" variant="bordered">Bordered Success</Button>
<Button color="danger" variant="shadow">Shadow Danger</Button>
```

## 📖 Ver Ejemplos

Visita `/heroui-examples` en tu aplicación para ver todos los componentes en acción.

## 📚 Documentación Oficial

- **Documentación**: https://www.heroui.com/docs/
- **Componentes**: https://www.heroui.com/docs/components
- **Temas**: https://www.heroui.com/docs/customization/theme
- **GitHub**: https://github.com/heroui-inc/heroui

## 💡 Tips

1. **Client Components**: La mayoría de los componentes interactivos (Modal, Dropdown, etc.) deben usarse en Client Components con `'use client'`

2. **Hooks**: Hero UI proporciona hooks útiles como:
   - `useDisclosure()` - Para modales y dropdowns
   - `usePagination()` - Para paginación
   - `useTable()` - Para tablas avanzadas

3. **TypeScript**: Hero UI tiene soporte completo de TypeScript

4. **Accesibilidad**: Todos los componentes siguen las mejores prácticas de accesibilidad (WAI-ARIA)

5. **Temas**: Puedes personalizar los colores globalmente en el HeroUIProvider

## 🎯 Próximos Pasos

1. Explora los ejemplos en `/heroui-examples`
2. Lee la documentación oficial
3. Comienza a reemplazar tus componentes existentes con Hero UI
4. Personaliza el tema según tu marca
