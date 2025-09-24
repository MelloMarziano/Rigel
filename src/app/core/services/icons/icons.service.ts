import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IconService {
  private icons: { [key: string]: string } = {
    dashboard: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="10" height="10" rx="2" fill="url(#dashboard-gradient-1)" />
    <rect y="14" width="10" height="10" rx="2" fill="url(#dashboard-gradient-2)" />
    <rect x="14" width="10" height="10" rx="2" fill="url(#dashboard-gradient-3)" />
    <rect x="14" y="14" width="10" height="10" rx="2" fill="url(#dashboard-gradient-4)" />
    <defs>
      <linearGradient id="dashboard-gradient-1" x1="0" y1="0" x2="10" y2="10" gradientUnits="userSpaceOnUse">
        <stop stop-color="#4F46E5" />
        <stop offset="1" stop-color="#7C3AED" />
      </linearGradient>
      <linearGradient id="dashboard-gradient-2" x1="0" y1="14" x2="10" y2="24" gradientUnits="userSpaceOnUse">
        <stop stop-color="#10B981" />
        <stop offset="1" stop-color="#3B82F6" />
      </linearGradient>
      <linearGradient id="dashboard-gradient-3" x1="14" y1="0" x2="24" y2="10" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F59E0B" />
        <stop offset="1" stop-color="#EF4444" />
      </linearGradient>
      <linearGradient id="dashboard-gradient-4" x1="14" y1="14" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stop-color="#EC4899" />
        <stop offset="1" stop-color="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>`,

    washing: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="url(#washing-gradient)" />
  <path d="M12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12"
    stroke="white" strokeWidth="2" strokeLinecap="round"/>
  <defs>
    <linearGradient id="washing-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3B82F6"/>
      <stop offset="1" stop-color="#2DD4BF"/>
    </linearGradient>
  </defs>
</svg>`,

    orders: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="url(#orders-gradient)"/>
      <path d="M7 8H17M7 12H17M7 16H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="orders-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F59E0B"/>
          <stop offset="1" stop-color="#EF4444"/>
        </linearGradient>
      </defs>
    </svg>`,

    receipts: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V20.1716C20 21.7025 18.1046 22.4476 17.0796 21.4226L12 16.3431L6.92038 21.4226C5.89543 22.4476 4 21.7025 4 20.1716V4Z"
        fill="url(#receipts-gradient)"/>
      <path d="M8 7H16M8 11H16M8 15H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="receipts-gradient" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stop-color="#10B981"/>
          <stop offset="1" stop-color="#3B82F6"/>
        </linearGradient>
      </defs>
    </svg>`,

    deliveries: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5C3 3.89543 3.89543 3 5 3H14C15.1046 3 16 3.89543 16 5V17C16 18.1046 15.1046 19 14 19H5C3.89543 19 3 18.1046 3 17V5Z"
        fill="url(#deliveries-gradient)"/>
      <circle cx="7" cy="20" r="2" stroke="white" strokeWidth="2"/>
      <circle cx="20" cy="20" r="2" stroke="white" strokeWidth="2"/>
      <defs>
        <linearGradient id="deliveries-gradient" x1="3" y1="3" x2="16" y2="19" gradientUnits="userSpaceOnUse">
          <stop stop-color="#8B5CF6"/>
          <stop offset="1" stop-color="#EC4899"/>
        </linearGradient>
      </defs>
    </svg>`,

    cashier: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="url(#cashier-gradient)" />
    <path d="M6 8H18M6 12H18M6 16H14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="cashier-gradient" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
        <stop stop-color="#4F46E5" />
        <stop offset="1" stop-color="#7C3AED" />
      </linearGradient>
    </defs>
  </svg>`,

    customers: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="5" fill="url(#customers-gradient)" />
    <path
      d="M3 21C3 17.134 7.02944 14 12 14C16.9706 14 21 17.134 21 21"
      stroke="url(#customers-gradient)"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="customers-gradient" x1="3" y1="8" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F59E0B" />
        <stop offset="1" stop-color="#EF4444" />
      </linearGradient>
    </defs>
  </svg>`,

    services: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L14.6603 7.38197L20.7764 8.23607L16.3882 12.618L17.3205 18.7638L12 15.8197L6.67949 18.7638L7.61184 12.618L3.22361 8.23607L9.33975 7.38197L12 2Z"
      fill="url(#services-gradient)"
    />
    <defs>
      <linearGradient id="services-gradient" x1="3" y1="2" x2="21" y2="19" gradientUnits="userSpaceOnUse">
        <stop stop-color="#10B981" />
        <stop offset="1" stop-color="#3B82F6" />
      </linearGradient>
    </defs>
  </svg>`,

    billing: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#billing-gradient)" />
    <path d="M8 13L10.5 15.5L16 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="billing-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stop-color="#8B5CF6" />
        <stop offset="1" stop-color="#EC4899" />
      </linearGradient>
    </defs>
  </svg>`,

    reports: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="url(#reports-gradient)" />
    <path d="M8 10V16M12 7V16M16 13V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="reports-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop stop-color="#4F46E5" />
        <stop offset="1" stop-color="#7C3AED" />
      </linearGradient>
    </defs>
  </svg>`,

    settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.2929 2.29289C11.6834 1.90237 12.3166 1.90237 12.7071 2.29289L14.7071 4.29289C15.0976 4.68342 15.0976 5.31658 14.7071 5.70711L12.7071 7.70711C12.3166 8.09763 11.6834 8.09763 11.2929 7.70711L9.29289 5.70711C8.90237 5.31658 8.90237 4.68342 9.29289 4.29289L11.2929 2.29289ZM2.29289 11.2929C1.90237 11.6834 1.90237 12.3166 2.29289 12.7071L4.29289 14.7071C4.68342 15.0976 5.31658 15.0976 5.70711 14.7071L7.70711 12.7071C8.09763 12.3166 8.09763 11.6834 7.70711 11.2929L5.70711 9.29289C5.31658 8.90237 4.68342 8.90237 4.29289 9.29289L2.29289 11.2929ZM16.2929 11.2929C15.9024 11.6834 15.9024 12.3166 16.2929 12.7071L18.2929 14.7071C18.6834 15.0976 19.3166 15.0976 19.7071 14.7071L21.7071 12.7071C22.0976 12.3166 22.0976 11.6834 21.7071 11.2929L19.7071 9.29289C19.3166 8.90237 18.6834 8.90237 18.2929 9.29289L16.2929 11.2929Z"
      fill="white"
    />
  </svg>`,

    userShield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="18" height="18" rx="2" fill="url(#userShield-gradient)" />
  <path
    d="M12 7C13.6569 7 15 8.34315 15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7ZM12 14C9.79086 14 8 15.7909 8 18H16C16 15.7909 14.2091 14 12 14Z"
    fill="white"
  />
  <path
    d="M18 11L19 11.5L20 11L20 13C20 15 18.5 16.5 17 17C15.5 16.5 14 15 14 13V11L15 11.5L16 11L17 11.5L18 11Z"
    fill="white"
  />
  <defs>
    <linearGradient id="userShield-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4F46E5" />
      <stop offset="1" stop-color="#7C3AED" />
    </linearGradient>
  </defs>
</svg>`,
  };

  getIcon(name: string): string {
    const icon = this.icons[name];
    if (!icon) return '';

    // Generar un identificador único para el gradiente
    const uniqueId = `grad-${Math.random().toString(36).substr(2, 9)}`;

    // Reemplazar los ID de los linearGradient en el SVG para evitar conflictos
    return icon
      .replace(/id="(.*?)"/g, `id="${uniqueId}-$1"`)
      .replace(/url\(#(.*?)\)/g, `url(#${uniqueId}-$1)`);
  }
}
