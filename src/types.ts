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
  timestamp: number;
  tiqueteCodigo: string;
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
