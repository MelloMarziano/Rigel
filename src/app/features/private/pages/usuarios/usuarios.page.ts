import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Subscription, combineLatest } from 'rxjs';
import { startWith, debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';

declare var bootstrap: any;

interface Usuario {
  id?: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: string;
  permisos: string[];
  ultimoAcceso?: any;
  activo: boolean;
  fechaCreacion?: any;
  password?: string;
}

@Component({
  selector: 'app-usuarios-page',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
})
export class UsuariosPage implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  filteredUsers: Usuario[] = [];

  // Estadísticas
  totalUsuarios = 0;
  usuariosActivos = 0;
  administradores = 0;
  activosHoy = 0;

  // Formularios y filtros
  usuarioForm: FormGroup;
  userSearch = new FormControl('');
  roleFilter = new FormControl('all');

  // Permisos disponibles - Corresponden a las secciones del sidebar
  permisosDisponibles = [
    'dashboard',
    'productos',
    'categorias',
    'recetas',
    'ventas',
    'reportes',
    'proveedores',
    'albaranes',
    'usuarios',
    'inventario',
    'ajustes',
  ];

  showPassword = false;
  private subscriptions = new Subscription();
  modal: any;

  constructor(private firestore: Firestore, private fb: FormBuilder) {
    this.usuarioForm = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      rol: ['', Validators.required],
      permisos: [[]],
      password: [''],
      confirmPassword: [''],
      activo: [true],
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.initModal();
    this.setupFilters();
    this.setupRoleListener();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initModal(): void {
    const modalEl = document.getElementById('userModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }
  }

  private setupFilters(): void {
    this.subscriptions.add(
      combineLatest([
        this.userSearch.valueChanges.pipe(startWith('')),
        this.roleFilter.valueChanges.pipe(startWith('all')),
      ])
        .pipe(debounceTime(300))
        .subscribe(([searchTerm, role]) => {
          this.filterUsers(searchTerm || '', role || 'all');
        })
    );
  }

  private cargarUsuarios(): void {
    const usuariosRef = collection(this.firestore, 'usuarios');
    this.subscriptions.add(
      collectionData(usuariosRef, { idField: 'id' }).subscribe((data: any) => {
        this.usuarios = data;
        this.filteredUsers = data;
        this.calcularEstadisticas();
      })
    );
  }

  private calcularEstadisticas(): void {
    this.totalUsuarios = this.usuarios.length;
    this.usuariosActivos = this.usuarios.filter((u) => u.activo).length;
    this.administradores = this.usuarios.filter(
      (u) => u.rol === 'Administrador'
    ).length;

    // Simular activos hoy (en una implementación real, compararías con la fecha actual)
    const hoy = new Date();
    this.activosHoy = this.usuarios.filter((u) => {
      if (!u.ultimoAcceso) return false;
      const ultimoAcceso = u.ultimoAcceso.toDate
        ? u.ultimoAcceso.toDate()
        : new Date(u.ultimoAcceso);
      return ultimoAcceso.toDateString() === hoy.toDateString();
    }).length;
  }

  private filterUsers(searchTerm: string, role: string): void {
    let filtered = [...this.usuarios];

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (role && role !== 'all') {
      filtered = filtered.filter((u) => u.rol === role);
    }

    this.filteredUsers = filtered;
  }

  getRoleBadgeClass(rol: string): string {
    switch (rol) {
      case 'Administrador':
        return 'bg-danger';
      case 'Gerente':
        return 'bg-info';
      case 'Empleado':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'Nunca';

    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onPermisoChange(event: any, permiso: string): void {
    const permisos = this.usuarioForm.get('permisos')?.value || [];
    if (event.target.checked) {
      if (!permisos.includes(permiso)) {
        permisos.push(permiso);
      }
    } else {
      const index = permisos.indexOf(permiso);
      if (index > -1) {
        permisos.splice(index, 1);
      }
    }
    this.usuarioForm.get('permisos')?.setValue(permisos);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  abrirModalNuevo(): void {
    this.resetForm();
    this.usuarioForm
      .get('password')
      ?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm
      .get('confirmPassword')
      ?.setValidators([Validators.required]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.usuarioForm.get('confirmPassword')?.updateValueAndValidity();
    this.modal.show();
  }

  editarUsuario(usuario: Usuario): void {
    this.usuarioForm.patchValue(usuario);
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('confirmPassword')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.usuarioForm.get('confirmPassword')?.updateValueAndValidity();
    this.modal.show();
  }

  async guardarUsuario(): Promise<void> {
    if (this.usuarioForm.invalid) {
      Swal.fire(
        'Error',
        'Por favor, complete todos los campos requeridos.',
        'error'
      );
      return;
    }

    const formValue = this.usuarioForm.getRawValue();

    // Validar contraseñas coincidan para nuevos usuarios
    if (!formValue.id && formValue.password !== formValue.confirmPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
      return;
    }

    Swal.showLoading();

    try {
      if (formValue.id) {
        // Actualizar usuario existente
        const { id, password, confirmPassword, ...updateData } = formValue;
        const usuarioRef = doc(this.firestore, 'usuarios', id);
        await updateDoc(usuarioRef, updateData);
        Swal.fire(
          '¡Actualizado!',
          'El usuario ha sido actualizado.',
          'success'
        );
      } else {
        // Crear nuevo usuario
        const { id, confirmPassword, ...newUserData } = formValue;
        newUserData.fechaCreacion = serverTimestamp();
        newUserData.ultimoAcceso = serverTimestamp();
        await addDoc(collection(this.firestore, 'usuarios'), newUserData);
        Swal.fire('¡Creado!', 'El nuevo usuario ha sido creado.', 'success');
      }

      this.modal.hide();
      this.resetForm();
    } catch (error) {
      console.error('Error al guardar el usuario:', error);
      Swal.fire('Error', 'Hubo un problema al guardar el usuario.', 'error');
    }
  }

  async eliminarUsuario(usuarioId: string): Promise<void> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(this.firestore, 'usuarios', usuarioId));
        Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
      } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
      }
    }
  }

  private setupRoleListener(): void {
    this.subscriptions.add(
      this.usuarioForm.get('rol')?.valueChanges.subscribe((rol) => {
        if (rol) {
          this.setPermisosSegunRol(rol);
        }
      })
    );
  }

  private setPermisosSegunRol(rol: string): void {
    let permisosDefecto: string[] = [];

    switch (rol) {
      case 'Administrador':
        // Administrador tiene todos los permisos
        permisosDefecto = [...this.permisosDisponibles];
        break;

      case 'Gerente':
        // Gerente tiene acceso a gestión pero no a usuarios ni ajustes
        permisosDefecto = [
          'dashboard',
          'productos',
          'categorias',
          'recetas',
          'ventas',
          'reportes',
          'proveedores',
          'albaranes',
          'inventario',
        ];
        break;

      case 'Empleado':
        // Empleado solo tiene acceso básico
        permisosDefecto = ['dashboard', 'productos', 'ventas'];
        break;

      case 'Visualizador':
        // Visualizador solo puede ver reportes y dashboard
        permisosDefecto = ['dashboard', 'reportes'];
        break;

      default:
        permisosDefecto = [];
    }

    this.usuarioForm.get('permisos')?.setValue(permisosDefecto);
  }

  private resetForm(): void {
    this.usuarioForm.reset({
      nombre: '',
      email: '',
      telefono: '',
      rol: '',
      permisos: [],
      password: '',
      confirmPassword: '',
      activo: true,
    });
    this.showPassword = false;
  }
}
