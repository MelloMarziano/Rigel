# 📊 Módulo de Mermas - Sistema Rigel

## ✅ Implementación Completa

### 🎯 Características Principales

#### 1. Gestión de Mermas
- **CRUD Completo**: Crear, leer, actualizar y eliminar mermas
- **Asociación con Productos**: Cada merma está vinculada a un producto específico
- **Porcentaje Configurable**: Define el % de pérdida esperado (0-100%)
- **Estado Activo/Inactivo**: Control de mermas activas
- **Validaciones**: Formularios con validación en tiempo real

#### 2. Sistema de Filtros Avanzado
```typescript
// Filtros disponibles:
- Búsqueda por texto (nombre, descripción, producto)
- Filtro por estado (todos, activo, inactivo)
- Filtro por producto específico
- Contador de resultados
- Botón limpiar filtros
```

#### 3. Ordenamiento Inteligente
- **Por Nombre**: Alfabético A-Z / Z-A
- **Por Porcentaje**: Menor a mayor / Mayor a menor
- **Por Fecha**: Más antiguo / Más reciente
- Indicadores visuales del orden activo

#### 4. Estadísticas en Tiempo Real
```
┌─────────────────┬─────────────────┬─────────────────┐
│  Total Mermas   │  Mermas Activas │ Promedio Merma  │
│       12        │        8        │     15.5%       │
└─────────────────┴─────────────────┴─────────────────┘
```

#### 5. Cálculos Automáticos
```typescript
// Ejemplo: Papa con 20% de merma
Cantidad comprada: 100 kg
Pérdida: 20 kg (20%)
Cantidad útil: 80 kg
```

### 🔧 Servicios Implementados

#### MermasService (`src/app/core/services/mermas.service.ts`)

```typescript
// Métodos principales:
getMermas(): Observable<Merma[]>
getMermasActivas(): Observable<Merma[]>
getMermaPorProducto(productoId: string): Observable<Merma | undefined>
crearMerma(merma: Omit<Merma, 'id'>): Promise<void>
actualizarMerma(id: string, merma: Partial<Merma>): Promise<void>
eliminarMerma(id: string): Promise<void>

// Funciones de cálculo:
calcularCantidadUtil(cantidad, porcentaje): number
calcularPerdida(cantidad, porcentaje): number
calcularCantidadNecesaria(cantidadUtil, porcentaje): number
```

### 📊 Reportes de Mermas

#### Página de Reportes (`/private/mermas/reportes`)

**Resumen General:**
- Total de productos con merma
- Total de unidades perdidas
- Costo total de pérdidas

**Producto Destacado:**
- Muestra el producto con mayor pérdida
- Información visual con métricas clave

**Tabla Detallada:**
```
┌──────────────┬────────┬────────┬──────────┬─────────┬──────────┬──────────┐
│   Producto   │ Merma  │ % Merma│ Comprada │ Pérdida │   Útil   │  Costo   │
├──────────────┼────────┼────────┼──────────┼─────────┼──────────┼──────────┤
│ Papa         │ Pelado │  20%   │  100 kg  │  20 kg  │  80 kg   │ $50.00   │
│ Tomate       │ Limpia │  15%   │   50 kg  │  7.5 kg │ 42.5 kg  │ $22.50   │
└──────────────┴────────┴────────┴──────────┴─────────┴──────────┴──────────┘
```

### 🧩 Componente Reutilizable

#### MermaInfoComponent

```html
<!-- Uso en otros módulos -->
<app-merma-info
  [productoId]="producto.id"
  [cantidad]="100"
  [unidadMedida]="'kg'"
  [mostrarDetalle]="true">
</app-merma-info>
```

**Características:**
- Muestra alerta visual cuando hay merma
- Calcula automáticamente pérdida y cantidad útil
- Modo compacto y detallado
- Actualización reactiva

### 📁 Estructura de Archivos

```
src/app/
├── core/
│   └── services/
│       └── mermas.service.ts          ✨ Nuevo
├── shared/
│   ├── shared.module.ts               ✨ Nuevo
│   └── components/
│       └── merma-info/                ✨ Nuevo
│           ├── merma-info.component.ts
│           ├── merma-info.component.html
│           └── merma-info.component.scss
└── features/
    └── private/
        └── pages/
            └── mermas/
                ├── mermas.page.ts              ✅ Mejorado
                ├── mermas.page.html            ✅ Mejorado
                ├── mermas.page.scss            ✅ Mejorado
                ├── mermas.module.ts            ✅ Mejorado
                ├── mermas.page-routing.module.ts ✅ Mejorado
                └── reportes-mermas/            ✨ Nuevo
                    ├── reportes-mermas.component.ts
                    ├── reportes-mermas.component.html
                    └── reportes-mermas.component.scss
```

### 🎨 Diseño Visual

**Colores:**
- Primario: Rojo (#dc3545) - Representa pérdidas/mermas
- Advertencia: Amarillo (#ffc107) - Alertas y ejemplos
- Éxito: Verde (#28a745) - Cantidad útil

**Componentes:**
- Tarjetas clickeables con hover effects
- Barras de progreso visuales
- Badges de estado
- Iconos descriptivos (Bootstrap Icons)
- Animaciones suaves
- Diseño responsivo

### 🔗 Integración con Firebase

```typescript
// Colección: 'mermas'
interface Merma {
  id?: string;
  productoId: string;
  nombre: string;
  descripcion: string;
  porcentajeMerma: number;
  activo: boolean;
  fechaCreacion?: Timestamp;
  fechaActualizacion?: Date;
}
```

### 🚀 Próximos Pasos Sugeridos

1. **Integración con Inventario**
   ```typescript
   // En inventario.page.ts
   <app-merma-info
     [productoId]="producto.id"
     [cantidad]="producto.cantidad"
     [unidadMedida]="producto.unidadMedida">
   </app-merma-info>
   ```

2. **Integración con Recetas**
   - Considerar mermas al calcular ingredientes necesarios
   - Ajustar cantidades automáticamente

3. **Exportación de Reportes**
   ```typescript
   exportarReporte() {
     // Implementar exportación a:
     // - CSV
     // - Excel
     // - PDF
   }
   ```

4. **Gráficos y Visualizaciones**
   - Gráfico de barras: Mermas por producto
   - Gráfico circular: Distribución de pérdidas
   - Línea de tiempo: Evolución de mermas

5. **Historial de Cambios**
   - Registrar modificaciones de mermas
   - Auditoría de cambios
   - Comparación histórica

6. **Alertas Inteligentes**
   - Notificar cuando merma supera umbral
   - Sugerencias de optimización
   - Alertas de productos críticos

### 📝 Ejemplos de Uso

#### Crear una Merma
```typescript
const merma = {
  productoId: 'papa-001',
  nombre: 'Merma de Pelado',
  descripcion: 'Pérdida durante pelado y limpieza',
  porcentajeMerma: 20,
  activo: true
};

await mermasService.crearMerma(merma);
```

#### Calcular Cantidad Útil
```typescript
const cantidadComprada = 100; // kg
const porcentajeMerma = 20; // %

const cantidadUtil = mermasService.calcularCantidadUtil(
  cantidadComprada,
  porcentajeMerma
);
// Resultado: 80 kg
```

#### Calcular Cantidad a Comprar
```typescript
const cantidadNecesaria = 80; // kg útiles necesarios
const porcentajeMerma = 20; // %

const cantidadComprar = mermasService.calcularCantidadNecesaria(
  cantidadNecesaria,
  porcentajeMerma
);
// Resultado: 100 kg (para obtener 80 kg útiles)
```

### ✨ Características Destacadas

- ✅ **Tiempo Real**: Sincronización automática con Firebase
- ✅ **Reactivo**: Actualización instantánea de cálculos
- ✅ **Reutilizable**: Componentes y servicios modulares
- ✅ **Validado**: Formularios con validación completa
- ✅ **Responsive**: Diseño adaptable a todos los dispositivos
- ✅ **Intuitivo**: UI/UX moderna y fácil de usar
- ✅ **Escalable**: Arquitectura preparada para crecer

---

**Desarrollado para Sistema Rigel** 🚀
*Gestión inteligente de mermas y desperdicios*
