# 🧮 Módulo de Escandallos - Sistema Rigel

## ✅ Implementación Completa

### 🎯 Características Principales

#### 1. **Gestión Completa de Escandallos**

- CRUD completo (Crear, Leer, Actualizar, Eliminar)
- Integración con Productos, Recetas y Mermas
- Cálculos automáticos de costos y márgenes
- Vista detallada con desglose completo

#### 2. **Dos Tipos de Ingredientes**

**Ingredientes Base:**

- Productos directos del inventario
- Aplicación automática de mermas configuradas
- Cálculo de costo sin merma y con merma
- Ejemplo: Ron Añejo (200g con 15% de merma)

**Recetas Pre-elaboradas:**

- Recetas ya creadas en el módulo de recetas
- Costos pre-calculados incluidos
- Ejemplo: Puré de Papa (150g)

#### 3. **Cálculos Automáticos**

```typescript
// Ingrediente Base con Merma
Producto: Ron Añejo
Precio: $55,000 por 200g
Cantidad usada: 200g
Merma: 15%

Costo sin merma: $55,000
Cantidad real necesaria: 200g / (1 - 0.15) = 235.29g
Costo con merma: $55,000 × (235.29 / 200) = $64,705.88

// Receta Pre-elaborada
Receta: Puré de Papa
Costo por gramo: $0.006
Cantidad usada: 150g
Costo: $0.006 × 150 = $0.90

// Totales
Costo Total: $64,705.88 + $0.90 = $64,706.78
Precio Venta: $25,000
Ganancia: $25,000 - $64,706.78 = -$39,706.78
Margen: -158.8% (pérdida)
```

#### 4. **Estadísticas en Tiempo Real**

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total: 1    │ Activos: 1  │ Margen: -99%│ Porciones: 1│
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### 5. **Preview de Costos**

Muestra en tiempo real mientras editas:

- Costo Total (con mermas aplicadas)
- Precio de Venta
- Ganancia (puede ser negativa)
- Margen Porcentual

#### 6. **Modal de Vista Detallada**

Información completa del escandallo:

- Resumen de costos (4 tarjetas)
- Tabla de ingredientes base con mermas
- Tabla de recetas pre-elaboradas
- Información de porciones
- Costo por porción

### 📊 Estructura de Datos

```typescript
interface Escandallo {
  id?: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  precioVenta: number;
  porciones: number;

  ingredientesBase: [
    {
      productoId: string;
      cantidad: number;
      costoSinMerma: number;
      porcentajeMerma: number;
      costoConMerma: number;
    }
  ];

  recetas: [
    {
      recetaId: string;
      cantidad: number;
      costo: number;
    }
  ];

  costoTotal: number;
  costoTotalConMermas: number;
  costoPorPorcion: number;
  margen: number;
  margenPorcentaje: number;
  activo: boolean;
}
```

### 🗄️ Estructura en Firebase

```json
{
  "escandallos": {
    "{escandalloId}": {
      "nombre": "Pescado Frito con Puré de Papa",
      "descripcion": "Plato completo con pescado frito y acompañamiento",
      "categoriaId": "platos",
      "precioVenta": 25000,
      "porciones": 1,
      "ingredientesBase": [
        {
          "productoId": "ron-001",
          "cantidad": 200
        }
      ],
      "recetas": [
        {
          "recetaId": "pure-papa-001",
          "cantidad": 150
        }
      ],
      "activo": true,
      "fechaCreacion": "2025-10-04T...",
      "fechaActualizacion": "2025-10-04T..."
    }
  }
}
```

### 🎨 Categorías de Escandallos

- 🍽️ **Platos** (azul)
- 🥤 **Bebidas** (cyan)
- 🍰 **Postres** (amarillo)
- 🥗 **Entradas** (verde)
- 📋 **Menú** (rojo)

### 🔄 Flujo de Uso

```
1. Usuario crea nuevo escandallo
   ↓
2. Ingresa nombre, categoría, precio y porciones
   ↓
3. Agrega ingredientes base:
   - Busca producto con datalist
   - Ingresa cantidad
   - Sistema busca merma automáticamente
   - Calcula costo con merma
   ↓
4. Agrega recetas pre-elaboradas:
   - Busca receta con datalist
   - Ingresa cantidad
   - Sistema usa costo pre-calculado
   ↓
5. Preview muestra:
   - Costo total con mermas
   - Precio de venta
   - Ganancia/Pérdida
   - Margen porcentual
   ↓
6. Guarda en Firebase
   ↓
7. Lista se actualiza automáticamente
```

### 💡 Casos de Uso

#### Caso 1: Plato Simple

```
Escandallo: Ensalada César
- Lechuga: 200g (sin merma)
- Pollo: 150g (5% merma)
- Aderezo César: 50ml (sin merma)
Precio Venta: €12.00
Resultado: Margen positivo
```

#### Caso 2: Plato Complejo

```
Escandallo: Menú del Día
- Ingredientes Base:
  - Pescado: 200g (10% merma)
  - Aceite: 50ml (sin merma)
- Recetas:
  - Puré de Papa: 150g
  - Ensalada: 100g
Precio Venta: €15.00
Resultado: Cálculo automático con todas las mermas
```

#### Caso 3: Bebida Especial

```
Escandallo: Mojito Premium
- Ingredientes Base:
  - Ron: 50ml (15% merma por evaporación)
  - Hierbabuena: 10g (20% merma)
  - Limón: 30g (25% merma por cáscara)
- Recetas:
  - Jarabe Simple: 20ml
Precio Venta: €8.00
Resultado: Mermas múltiples aplicadas correctamente
```

### ✨ Ventajas del Sistema

1. **Precisión Total**: Calcula costos exactos incluyendo todas las mermas
2. **Integración Completa**: Usa datos de productos, recetas y mermas
3. **Tiempo Real**: Preview instantáneo de costos y márgenes
4. **Flexible**: Combina ingredientes directos y recetas
5. **Visual**: Información clara con colores semánticos
6. **Profesional**: Ideal para gestión de costos de restaurantes
7. **Escalable**: Soporta platos simples y complejos

### 🎯 Indicadores Visuales

**Margen Positivo (Verde):**

- Precio > Costo
- Negocio rentable
- Ejemplo: 30% margen

**Margen Negativo (Rojo):**

- Precio < Costo
- Pérdida en el plato
- Ejemplo: -99.8% margen
- Alerta visual para ajustar precios

### 📈 Análisis de Rentabilidad

El sistema permite identificar:

- ✅ Platos más rentables
- ❌ Platos con pérdidas
- 📊 Margen promedio del menú
- 💰 Costo real por porción
- 🎯 Precio sugerido para margen deseado

### 🔧 Mejoras Futuras Sugeridas

1. **Calculadora de Precio Sugerido**

   - Ingresa margen deseado (ej: 30%)
   - Sistema calcula precio de venta óptimo

2. **Análisis de Sensibilidad**

   - Simula cambios en precios de ingredientes
   - Impacto en margen final

3. **Comparación de Escandallos**

   - Compara rentabilidad entre platos
   - Identifica mejores opciones

4. **Exportación de Costos**

   - PDF con desglose completo
   - Excel para análisis externo

5. **Alertas Inteligentes**

   - Notifica cuando margen es negativo
   - Sugiere ajustes de precio

6. **Historial de Precios**
   - Registra cambios en costos
   - Análisis de tendencias

### 🎓 Conceptos Clave

**Escandallo:**
Documento que detalla todos los ingredientes, cantidades y costos necesarios para elaborar un plato, permitiendo calcular el costo real y establecer precios de venta rentables.

**Merma:**
Pérdida de producto durante su manipulación, limpieza o cocción. Se expresa en porcentaje y aumenta el costo real del ingrediente.

**Margen:**
Diferencia entre el precio de venta y el costo. Puede ser positivo (ganancia) o negativo (pérdida).

**Costo por Porción:**
Costo total del plato dividido entre el número de porciones que produce.

---

**Sistema Rigel** 🌟
_Gestión profesional de costos de restaurantes_
