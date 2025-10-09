# 📋 Plan de Reorganización: Perfil y Configuración

## 🎯 Objetivo
Reorganizar la configuración del sistema para que sea más intuitiva, moviendo las opciones al dropdown del usuario en el AppBar.

---

## 🔄 Cambios Propuestos

### Antes (Actual)
```
Sidebar:
├── Dashboard
├── Inventario
├── Proveedores
├── Albaranes
├── Recetas
├── Escandallos
├── Mermas
└── ⚙️ Ajustes (página con 3 pestañas)
    ├── General
    ├── Personalización
    └── Sistema

AppBar Dropdown:
├── Mi Perfil (vacío)
├── Configuración (link a Ajustes)
└── Cerrar Sesión
```

### Después (Propuesto)
```
Sidebar:
├── Dashboard
├── Inventario
├── Proveedores
├── Albaranes
├── Recetas
├── Escandallos
└── Mermas
(Sin Ajustes)

AppBar Dropdown:
├── 👤 Mi Perfil (Información del restaurante)
├── 🎨 Personalización (Temas y colores)
├── ℹ️ Acerca del Sistema (Info de Rigel)
└── 🚪 Cerrar Sesión
```

---

## 📁 Estructura de Archivos Nueva

### 1. Componente: Profile (Mi Perfil)
```
src/app/features/private/pages/profile/
├── profile.page.ts
├── profile.page.html
└── profile.page.scss
```

**Contenido:**
- Información del restaurante (lo que está en "General")
- Nombre, razón social, CIF, teléfono, email
- Dirección completa
- Modo edición con botón "Editar"

---

### 2. Componente: Personalization (Personalización)
```
src/app/features/private/pages/personalization/
├── personalization.page.ts
├── personalization.page.html
└── personalization.page.scss
```

**Contenido:**
- Modo oscuro (toggle)
- Colores personalizados (5 colores)
- 18 temas predefinidos con gradientes
- Preview en tiempo real del sidebar
- Botón "Guardar Mi Personalización"

---

### 3. Componente: About System (Acerca del Sistema)
```
src/app/features/private/pages/about-system/
├── about-system.page.ts
├── about-system.page.html
└── about-system.page.scss
```

**Contenido:**
- Logo y nombre de Rigel
- Versión del sistema
- Fecha de lanzamiento
- Información del equipo (CEO, CTO, Designer)
- Características del sistema
- Información de Orion System
- Control ROOT (si aplica)

---

## 🔧 Modificaciones Necesarias

### 1. AppBar Component
**Archivo:** `src/app/features/private/components/appbar/appbar.component.html`

**Cambios:**
```html
<ul class="dropdown-menu dropdown-menu-end">
  <li class="dropdown-header">
    <div class="user-info-dropdown">
      <div class="fw-bold">{{ currentUser?.nombre }}</div>
      <div class="text-muted small">{{ currentUser?.email }}</div>
      <span class="badge bg-primary mt-1">{{ currentUser?.rol }}</span>
    </div>
  </li>
  <li><hr class="dropdown-divider"></li>

  <!-- NUEVO -->
  <li>
    <a class="dropdown-item" routerLink="/private/profile">
      <i class="bi bi-person me-2"></i>Mi Perfil
    </a>
  </li>

  <!-- NUEVO -->
  <li>
    <a class="dropdown-item" routerLink="/private/personalization">
      <i class="bi bi-palette me-2"></i>Personalización
    </a>
  </li>

  <!-- NUEVO -->
  <li>
    <a class="dropdown-item" routerLink="/private/about-system">
      <i class="bi bi-info-circle me-2"></i>Acerca del Sistema
    </a>
  </li>

  <li><hr class="dropdown-divider"></li>
  <li>
    <a class="dropdown-item text-danger" (click)="logout()" style="cursor: pointer;">
      <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
    </a>
  </li>
</ul>
```

---

### 2. Sidebar Component
**Archivo:** `src/app/features/private/components/sidebar/sidebar.component.ts`

**Cambios:**
- Eliminar el item "Ajustes" del array de navegación

**Antes:**
```typescript
{
  label: 'Ajustes',
  icon: 'bi-gear',
  route: '/private/settings',
  badge: null
}
```

**Después:**
```typescript
// Eliminar completamente este objeto
```

---

### 3. Routing Module
**Archivo:** `src/app/features/private/private-routing.module.ts`

**Cambios:**
```typescript
const routes: Routes = [
  {
    path: '',
    component: PrivateLayoutComponent,
    children: [
      // ... rutas existentes ...

      // NUEVO
      {
        path: 'profile',
        loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfileModule)
      },

      // NUEVO
      {
        path: 'personalization',
        loadChildren: () => import('./pages/personalization/personalization.module').then(m => m.PersonalizationModule)
      },

      // NUEVO
      {
        path: 'about-system',
        loadChildren: () => import('./pages/about-system/about-system.module').then(m => m.AboutSystemModule)
      },

      // MANTENER (por si hay links directos)
      {
        path: 'settings',
        redirectTo: 'profile',
        pathMatch: 'full'
      }
    ]
  }
];
```

---

## 🎨 Ventajas de esta Reorganización

### 1. **Más Intuitivo**
- Los usuarios esperan encontrar su perfil en el dropdown del usuario
- Separación clara de funcionalidades

### 2. **Mejor UX**
- Menos clics para acceder a configuración personal
- Sidebar más limpio y enfocado en funcionalidades principales

### 3. **Organización Lógica**
```
Sidebar = Funcionalidades del negocio
Dropdown Usuario = Configuración personal y del sistema
```

### 4. **Escalabilidad**
- Fácil agregar más opciones al dropdown
- Componentes independientes y reutilizables

---

## 📝 Checklist de Implementación

### Fase 1: Crear Componentes
- [x] Crear carpetas para los 3 nuevos componentes
- [ ] Crear Profile component (TypeScript, HTML, SCSS)
- [ ] Crear Personalization component (TypeScript, HTML, SCSS)
- [ ] Crear About System component (TypeScript, HTML, SCSS)
- [ ] Crear módulos para cada componente

### Fase 2: Modificar Routing
- [ ] Agregar rutas para los 3 nuevos componentes
- [ ] Agregar redirect de /settings a /profile
- [ ] Probar navegación

### Fase 3: Modificar AppBar
- [ ] Actualizar dropdown con nuevas opciones
- [ ] Agregar iconos apropiados
- [ ] Probar links

### Fase 4: Modificar Sidebar
- [ ] Eliminar item "Ajustes"
- [ ] Verificar que no haya referencias rotas
- [ ] Probar navegación

### Fase 5: Testing
- [ ] Probar cada componente individualmente
- [ ] Verificar persistencia de datos
- [ ] Probar en modo oscuro
- [ ] Verificar responsive design
- [ ] Probar con diferentes roles de usuario

### Fase 6: Limpieza
- [ ] Eliminar o deprecar settings.page (opcional)
- [ ] Actualizar documentación
- [ ] Verificar que no haya imports rotos

---

## 🚀 Próximos Pasos

1. ✅ Crear estructura de carpetas
2. ⏳ Crear componente Profile
3. ⏳ Crear componente Personalization
4. ⏳ Crear componente About System
5. ⏳ Actualizar routing
6. ⏳ Actualizar AppBar
7. ⏳ Actualizar Sidebar
8. ⏳ Testing completo

---

## 💡 Notas Adicionales

### Compatibilidad
- Mantener `/settings` como redirect para no romper links existentes
- Los datos en Firebase no cambian, solo la UI

### Permisos
- Profile: Todos los usuarios
- Personalización: Todos los usuarios
- About System: Todos los usuarios (control ROOT solo visible para ROOT)

### Responsive
- Todos los componentes deben ser 100% responsive
- Probar en mobile, tablet y desktop

---

**Estado:** 🟡 En Progreso
**Prioridad:** 🔴 Alta
**Estimación:** 2-3 horas
