# Sistema de Mermas - Dos Tipos

## Cambios Implementados

### 1. Tipos de Mermas

#### 🔪 Merma de Cocina (Procesamiento)
- **Propósito**: Calcular pérdidas durante la preparación de alimentos
- **Ejemplos**:
  - Pelar papas (20% de pérdida)
  - Limpiar pollo (15% de pérdida)
  - Cortar pescado (25% de pérdida)
  - Pelar cebollas (10% de pérdida)
- **Características**:
  - Se define como **porcentaje** (%)
  - Se aplica en **escandallos** para cálculo de costos
  - Puede estar **activa/inactiva**
  - Es una configuración permanente

#### 📦 Merma de Producto (Operacional)
- **Propósito**: Registrar pérdidas reales de productos
- **Ejemplos**:
  - Refresco caído al suelo
  - Café cancelado por cliente
  - Plato devuelto
  - Producto vencido
  - Error en preparación
- **Características**:
  - Se registra **cantidad exacta** perdida
  - Se calcula el **costo de la pérdida**
  - Incluye **motivo** de la pérdida
  - Tiene **fecha de registro**
  - Es un registro histórico (no se usa en escandallos)

### 2. Interfaz de Usuario

#### Botón de Creación
- Dropdown con dos opciones:
  - **Merma de Cocina**: Icono tijeras 🔪 (amarillo)
  - **Merma de Producto**: Icono alerta 📦 (rojo)

#### Filtros
- Nuevo filtro por **tipo de merma**
- Filtros existentes: estado, producto, búsqueda

#### Cards de Mermas
- Badge de tipo con color distintivo:
  - Cocina: Amarillo con tijeras
  - Producto: Rojo con alerta
- Información específica según tipo

### 3. Formulario de Creación

#### Merma de Cocina
- Tipo (radio button)
- Producto
- Nombre
- Descripción
- **Porcentaje de merma** (0-100%)
- Ejemplo de cálculo dinámico
- Estado activo/inactivo

#### Merma de Producto
- Tipo (radio button)
- Producto
- Nombre
- Descripción
- **Cantidad perdida** (número + unidad)
- **Motivo** (dropdown):
  - Rotura/Caída
  - Cancelación de pedido
  - Vencimiento
  - Deterioro/Mal estado
  - Error de preparación
  - Otro
- Cálculo automático del costo de pérdida
- Fecha de registro automática

### 4. Modal de Detalle

#### Merma de Cocina
- Porcentaje de merma con barra de progreso
- Ejemplo de cálculo con producto
- Estado activo/inactivo

#### Merma de Producto
- Cantidad perdida
- Costo de la pérdida
- Motivo de la pérdida
- Fecha de registro

### 5. Integración con Escandallos

- Solo las **mermas de cocina** aparecen en el dropdown de escandallos
- Icono de tijeras para identificar mermas de cocina
- Texto aclaratorio: "Solo mermas de cocina"
- Las mermas de producto NO se usan en cálculos de escandallos

## Flujo de Uso

### Crear Merma de Cocina
1. Clic en "Nueva Merma" → "Merma de Cocina"
2. Seleccionar producto
3. Ingresar nombre y descripción
4. Definir porcentaje de merma
5. Ver ejemplo de cálculo
6. Marcar como activo
7. Guardar

### Crear Merma de Producto
1. Clic en "Nueva Merma" → "Merma de Producto"
2. Seleccionar producto
3. Ingresar nombre y descripción
4. Ingresar cantidad perdida
5. Seleccionar motivo
6. Ver costo calculado
7. Registrar

### Usar en Escandallo
1. Agregar ingrediente base
2. Seleccionar producto
3. Elegir merma de cocina del dropdown
4. El sistema aplica el porcentaje automáticamente
5. Se calcula costo con merma

## Beneficios

1. **Claridad**: Separación clara entre pérdidas de proceso y operacionales
2. **Precisión**: Cálculos exactos en escandallos
3. **Trazabilidad**: Registro histórico de pérdidas operacionales
4. **Análisis**: Reportes diferenciados por tipo de merma
5. **Control**: Mejor gestión de costos y desperdicios


## Estructura de Datos

### Merma de Cocina
```typescript
{
  id: string;
  tipo: 'cocina';
  productoId: string;
  productoNombre: string;
  nombre: string;
  descripcion?: string;
  porcentajeMerma: number; // 0-100
  activo: boolean;
  fechaCreacion: Date;
}
```

### Merma de Producto
```typescript
{
  id: string;
  tipo: 'producto';
  productoId: string;
  productoNombre: string;
  nombre: string;
  descripcion?: string;
  cantidadPerdida: number;
  unidadMedida: string;
  costoPerdida: number; // Calculado automáticamente
  motivo: 'rotura' | 'cancelacion' | 'vencimiento' | 'deterioro' | 'error' | 'otro';
  fechaRegistro: Date;
}
```

## Colores y Estilos

### Merma de Cocina
- Color principal: **Amarillo/Warning** (#ffc107)
- Icono: `bi-scissors` (tijeras)
- Badge: `bg-warning text-dark`

### Merma de Producto
- Color principal: **Rojo/Danger** (#dc3545)
- Icono: `bi-exclamation-triangle`
- Badge: `bg-danger`

## Validaciones

### Merma de Cocina
- Producto: Requerido
- Nombre: Requerido
- Porcentaje: Requerido, 0-100

### Merma de Producto
- Producto: Requerido
- Nombre: Requerido
- Cantidad perdida: Requerido, > 0
- Motivo: Requerido

## Reportes Sugeridos

### Por Tipo de Merma
- Total mermas de cocina vs producto
- Costo total por tipo
- Productos más afectados

### Mermas de Cocina
- Porcentajes promedio por producto
- Productos con mayor merma
- Impacto en costos de escandallos

### Mermas de Producto
- Pérdidas por motivo
- Costo total de pérdidas operacionales
- Tendencias por período
- Productos más desperdiciados
