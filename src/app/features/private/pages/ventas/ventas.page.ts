import { Component, OnInit } from '@angular/core';

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  emoji: string;
  stock: number;
}

interface ItemCarrito {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  tamano?: string;
}

@Component({
  selector: 'app-ventas-page',
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
})
export class VentasPage implements OnInit {
  searchTerm = '';
  categoriaSeleccionada = 'todos';
  carrito: ItemCarrito[] = [];
  horaActual = '';
  nombreCliente = '';
  mesaSeleccionada = '';
  tipoServicio: 'local' | 'llevar' | 'delivery' = 'local';
  numeroPedido = this.generarNumeroPedido();

  productos: Producto[] = [
    {
      id: '1',
      nombre: 'Chicken Deluxe',
      precio: 3.2,
      categoria: 'burger',
      emoji: '🍔',
      stock: 25,
    },
    {
      id: '2',
      nombre: 'Egg Burger',
      precio: 4.0,
      categoria: 'burger',
      emoji: '🍔',
      stock: 15,
    },
    {
      id: '3',
      nombre: 'Fiery Chicken',
      precio: 4.1,
      categoria: 'burger',
      emoji: '🍔',
      stock: 8,
    },
    {
      id: '4',
      nombre: 'Mexican Burger',
      precio: 3.0,
      categoria: 'burger',
      emoji: '🍔',
      stock: 20,
    },
    {
      id: '5',
      nombre: 'Mozzarella Stuffed',
      precio: 4.0,
      categoria: 'burger',
      emoji: '🍔',
      stock: 12,
    },
    {
      id: '6',
      nombre: 'Falafel Burger',
      precio: 3.2,
      categoria: 'burger',
      emoji: '🍔',
      stock: 18,
    },
    {
      id: '7',
      nombre: 'Hawaiian Burger',
      precio: 4.0,
      categoria: 'burger',
      emoji: '🍔',
      stock: 10,
    },
    {
      id: '8',
      nombre: 'Chicken Pop',
      precio: 3.5,
      categoria: 'burger',
      emoji: '🍔',
      stock: 22,
    },
    {
      id: '9',
      nombre: 'Margherita',
      precio: 8.5,
      categoria: 'pizza',
      emoji: '🍕',
      stock: 15,
    },
    {
      id: '10',
      nombre: 'Pepperoni',
      precio: 9.5,
      categoria: 'pizza',
      emoji: '🍕',
      stock: 12,
    },
    {
      id: '11',
      nombre: 'Carbonara',
      precio: 7.5,
      categoria: 'pasta',
      emoji: '🍝',
      stock: 20,
    },
    {
      id: '12',
      nombre: 'Bolognese',
      precio: 7.0,
      categoria: 'pasta',
      emoji: '🍝',
      stock: 18,
    },
    {
      id: '13',
      nombre: 'Coca Cola',
      precio: 2.5,
      categoria: 'bebidas',
      emoji: '🥤',
      stock: 50,
    },
    {
      id: '14',
      nombre: 'Agua',
      precio: 1.5,
      categoria: 'bebidas',
      emoji: '💧',
      stock: 60,
    },
    {
      id: '15',
      nombre: 'Tiramisu',
      precio: 5.0,
      categoria: 'postres',
      emoji: '🍰',
      stock: 10,
    },
    {
      id: '16',
      nombre: 'Brownie',
      precio: 4.5,
      categoria: 'postres',
      emoji: '🍫',
      stock: 15,
    },
    {
      id: '17',
      nombre: 'Ensalada César',
      precio: 6.5,
      categoria: 'ensaladas',
      emoji: '🥗',
      stock: 20,
    },
    {
      id: '18',
      nombre: 'Ensalada Griega',
      precio: 6.0,
      categoria: 'ensaladas',
      emoji: '🥗',
      stock: 18,
    },
    {
      id: '19',
      nombre: 'Ensalada Tropical',
      precio: 7.0,
      categoria: 'ensaladas',
      emoji: '🥗',
      stock: 15,
    },
    {
      id: '20',
      nombre: 'Servicio Sombrilla',
      precio: 5.0,
      categoria: 'servicios',
      emoji: '🏖️',
      stock: 999,
    },
    {
      id: '21',
      nombre: 'Hamaca',
      precio: 3.0,
      categoria: 'servicios',
      emoji: '🏖️',
      stock: 999,
    },
  ];

  constructor() {}

  ngOnInit(): void {
    this.actualizarHora();
    setInterval(() => this.actualizarHora(), 1000);
  }

  actualizarHora(): void {
    const now = new Date();
    this.horaActual = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  get productosFiltrados(): Producto[] {
    let productos = this.productos;

    // Filtrar por categoría
    if (this.categoriaSeleccionada !== 'todos') {
      productos = productos.filter(
        (p) => p.categoria === this.categoriaSeleccionada
      );
    }

    // Filtrar por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      productos = productos.filter((p) =>
        p.nombre.toLowerCase().includes(term)
      );
    }

    return productos;
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada = categoria;
  }

  agregarAlCarrito(producto: Producto): void {
    const itemExistente = this.carrito.find((item) => item.id === producto.id);

    if (itemExistente) {
      itemExistente.cantidad++;
    } else {
      this.carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        tamano: 'M',
      });
    }
  }

  aumentarCantidad(index: number): void {
    this.carrito[index].cantidad++;
  }

  disminuirCantidad(index: number): void {
    if (this.carrito[index].cantidad > 1) {
      this.carrito[index].cantidad--;
    } else {
      this.eliminarDelCarrito(index);
    }
  }

  eliminarDelCarrito(index: number): void {
    this.carrito.splice(index, 1);
  }

  get subtotal(): number {
    return this.carrito.reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0
    );
  }

  get descuento(): number {
    // Ejemplo: 10% de descuento si el subtotal es mayor a 20€
    return this.subtotal > 20 ? this.subtotal * 0.1 : 0;
  }

  get total(): number {
    return this.subtotal - this.descuento;
  }

  get tieneSombrilla(): boolean {
    return this.carrito.some((item) => item.id === '20');
  }

  agregarServicioSombrilla(): void {
    const servicioSombrilla = this.productos.find((p) => p.id === '20');
    if (servicioSombrilla && !this.tieneSombrilla) {
      this.agregarAlCarrito(servicioSombrilla);
    }
  }

  generarNumeroPedido(): string {
    const fecha = new Date();
    const numero = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${fecha.getDate()}${fecha.getMonth() + 1}${numero}`;
  }
}
