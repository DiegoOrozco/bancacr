export interface Sorteo {
  id: string;
  nombre: string;
  horaCierre: string;
  multiplicador: number; // Por defecto 80x
  activo: boolean;
  numeroGanador?: string | null;
  cerrado: boolean;
  fecha: string;
}

export interface VentaItem {
  id: string;
  sorteoId: string;
  numero: string; // '00' a '99'
  monto: number;
  cliente: string;
  vendedor: string;
  vendedorId: string; // ID único del vendedor que emitió la venta
  timestamp: number;
  tiqueteCodigo: string;
}

export interface VendedorLocal {
  id: string;
  nombre: string;
  nombreLocal: string;
  telefono: string;
  logoEmoji: string; // Emoji representativo o iniciales
  logoUrl?: string; // URL de logo personalizado opcional
  pinAcceso: string; // PIN de 4 dígitos para iniciar sesión
  rol: 'admin' | 'vendedor'; // Administrador (ve todo) o Vendedor (solo ve sus ventas)
  activo: boolean;
}

export interface ConfiguracionBanca {
  moneda: string; // 'CRC' (₡) o 'USD' ($)
  pagoMultiplicador: number; // Ej: 80
  topeMaximoPorNumero: number; // Monto máximo total apostado por número (ej: ₡5,000)
  pagoMaximoTolerable: number; // Tope de premio por número (topeMaximo * multiplicador)
  nombreBanca: string;
  contactoWhatsApp: string;
  sinpeTelefono: string;
  sinpeNombreTitular: string;
  hotmartLink: string;
  vendedorActivoId: string;
  vendedores: VendedorLocal[];
  subscripcion: {
    plan: 'starter' | 'pro' | 'enterprise';
    activa: boolean;
    diasRestantesTrial: number;
    fechaVencimiento: string;
  };
}

export interface ResumenNumero {
  numero: string;
  totalApostado: number;
  cantidadJugadas: number;
  pagoPotencial: number;
  porcentajeTope: number; // 0 a 100%+
  estadoRiesgo: 'seguro' | 'alerta' | 'bloqueado';
}
