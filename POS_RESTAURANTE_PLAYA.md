# POS - Restaurante de Playa

## Cambios Implementados

### 1. Información del Cliente
- **Input de texto** para escribir el nombre del cliente
- Reemplaza el selector dropdown anterior
- Permite personalizar cada pedido con el nombre del cliente

### 2. Selección de Mesa
- **Selector con dos zonas:**
  - 🏠 **Interior**: Mesas I1 a I6
  - 🏖️ **Exterior (Playa)**: Mesas E1 a E8 con sombrilla

### 3. Servicio de Sombrilla
- **Botón automático** que aparece al seleccionar mesa exterior
- Agrega el servicio de sombrilla (5€) al carrito con un clic
- Icono de sombrilla 🏖️ para fácil identificación

### 4. Tipo de Servicio
- **Local**: Servicio en mesa
- **Para llevar**: Pedido para recoger
- **Delivery**: Entrega a domicilio

### 5. Nuevas Categorías
- Ensaladas 🥗 (3 opciones)
- Servicios 🏖️ (Sombrilla y Hamaca)

### 6. Número de Pedido
- Generación automática de número de pedido
- Formato: DDMM + 3 dígitos aleatorios
- Ejemplo: #61001

### 7. Productos de Servicio
- **Servicio Sombrilla**: 5.00€
- **Hamaca**: 3.00€

## Adaptación al Sistema de Temas
- Usa variables CSS del sistema personalizado
- Compatible con modo claro y oscuro
- Colores principales: `var(--color-principal)`
- Backgrounds: `var(--bg-card)`, `var(--bg-surface)`
- Textos: `var(--text-primary)`, `var(--text-secondary)`


## Flujo de Uso

1. **Iniciar Pedido**: El sistema genera automáticamente un número de pedido
2. **Ingresar Cliente**: Escribir el nombre del cliente en el input
3. **Seleccionar Mesa**: Elegir entre mesas interiores o exteriores
4. **Agregar Sombrilla** (opcional): Si es mesa exterior, clic en botón de sombrilla
5. **Tipo de Servicio**: Seleccionar Local, Para llevar o Delivery
6. **Agregar Productos**: Clic en productos del grid para agregar al carrito
7. **Ajustar Cantidades**: Usar botones +/- en cada item
8. **Finalizar**: Guardar, Pagar o dejar para Más tarde

## Características Técnicas

### TypeScript
- `nombreCliente`: string - Nombre del cliente
- `mesaSeleccionada`: string - ID de la mesa (I1-I6, E1-E8)
- `tipoServicio`: 'local' | 'llevar' | 'delivery'
- `numeroPedido`: string - Número único del pedido
- `tieneSombrilla`: boolean - Verifica si ya tiene servicio de sombrilla
- `agregarServicioSombrilla()`: Método para agregar sombrilla automáticamente

### Estilos SCSS
- `.customer-section`: Sección de información del cliente
- `.table-section`: Sección de selección de mesa
- `.btn-add-umbrella`: Botón para agregar sombrilla
- `.service-type-tabs`: Tabs para tipo de servicio
- Transiciones suaves en todos los elementos
- Responsive design para móviles y tablets

## Mejoras Futuras Sugeridas
- Integración con Firebase para guardar pedidos
- Estado de mesas (ocupada/libre)
- Historial de pedidos por mesa
- Impresión de tickets
- División de cuenta
- Propinas
