import { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Flame, 
  Trophy, 
  History, 
  Settings, 
  Share2, 
  ShieldAlert, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Sorteo, VentaItem, ConfiguracionBanca, ResumenNumero, VendedorLocal } from './types';
import './App.css';

const DEFAULT_VENDEDORES: VendedorLocal[] = [
  {
    id: 'vend-1',
    nombre: 'Diego Orozco',
    nombreLocal: 'Puesto Central San José',
    telefono: '8761-1422',
    logoEmoji: '🎰',
    activo: true
  },
  {
    id: 'vend-2',
    nombre: 'Puesto La Fortuna',
    nombreLocal: 'Sucursal Alajuela',
    telefono: '8888-2233',
    logoEmoji: '🍀',
    activo: true
  }
];

const DEFAULT_CONFIG: ConfiguracionBanca = {
  moneda: '₡',
  pagoMultiplicador: 80,
  topeMaximoPorNumero: 5000, // Máximo ₡5,000 por número en ventas acumuladas
  pagoMaximoTolerable: 400000, // ₡5,000 * 80 = ₡400,000 premio
  nombreBanca: 'BancaControl Costa Rica',
  contactoWhatsApp: '+506 8761-1422',
  sinpeTelefono: '8761-1422',
  sinpeNombreTitular: 'Diego Orozco Fonseca',
  hotmartLink: 'https://pay.hotmart.com/ejemplo-bancacontrol',
  vendedorActivoId: 'vend-1',
  vendedores: DEFAULT_VENDEDORES,
  subscripcion: {
    plan: 'pro',
    activa: true,
    diasRestantesTrial: 7,
    fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
};

const DEFAULT_SORTEOS: Sorteo[] = [
  {
    id: 'sorteo-mediodia',
    nombre: 'Mediodía (12:55 PM)',
    horaCierre: '12:50',
    multiplicador: 80,
    activo: true,
    cerrado: false,
    fecha: new Date().toISOString().split('T')[0]
  },
  {
    id: 'sorteo-tarde',
    nombre: 'Tarde (4:30 PM)',
    horaCierre: '16:25',
    multiplicador: 80,
    activo: false,
    cerrado: false,
    fecha: new Date().toISOString().split('T')[0]
  },
  {
    id: 'sorteo-noche',
    nombre: 'Noche (7:30 PM)',
    horaCierre: '19:25',
    multiplicador: 80,
    activo: false,
    cerrado: false,
    fecha: new Date().toISOString().split('T')[0]
  }
];

export function App() {
  // Estado general
  const [tab, setTab] = useState<'pos' | 'riesgo' | 'escrutinio' | 'historial' | 'config'>('pos');
  const [config, setConfig] = useState<ConfiguracionBanca>(() => {
    const saved = localStorage.getItem('banca_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [sorteos, setSorteos] = useState<Sorteo[]>(() => {
    const saved = localStorage.getItem('banca_sorteos');
    return saved ? JSON.parse(saved) : DEFAULT_SORTEOS;
  });

  const [sorteoActivoId, setSorteoActivoId] = useState<string>(sorteos[0]?.id || '');
  const [ventas, setVentas] = useState<VentaItem[]>(() => {
    const saved = localStorage.getItem('banca_ventas');
    return saved ? JSON.parse(saved) : [];
  });

  // Inputs POS Rápido
  const [numeroInput, setNumeroInput] = useState<string>('');
  const [montoInput, setMontoInput] = useState<number>(1000);
  const [clienteInput, setClienteInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [ultimoTiquete, setUltimoTiquete] = useState<VentaItem | null>(null);

  // Input Escrutinio / Ganador
  const [ganadorInput, setGanadorInput] = useState<string>('');

  // Guardar en Storage
  useEffect(() => {
    localStorage.setItem('banca_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('banca_sorteos', JSON.stringify(sorteos));
  }, [sorteos]);

  useEffect(() => {
    localStorage.setItem('banca_ventas', JSON.stringify(ventas));
  }, [ventas]);

  const sorteoSeleccionado = useMemo(() => {
    return sorteos.find(s => s.id === sorteoActivoId) || sorteos[0];
  }, [sorteos, sorteoActivoId]);

  // Ventas del sorteo seleccionado
  const ventasSorteoActual = useMemo(() => {
    return ventas.filter(v => v.sorteoId === sorteoSeleccionado.id);
  }, [ventas, sorteoSeleccionado]);

  // Venta bruta acumulada
  const ventaBrutaTotal = useMemo(() => {
    return ventasSorteoActual.reduce((acc, curr) => acc + curr.monto, 0);
  }, [ventasSorteoActual]);

  // Matriz de acumulación 00-99
  const matrizRiesgo = useMemo<Record<string, ResumenNumero>>(() => {
    const map: Record<string, ResumenNumero> = {};
    for (let i = 0; i <= 99; i++) {
      const numStr = i.toString().padStart(2, '0');
      map[numStr] = {
        numero: numStr,
        totalApostado: 0,
        cantidadJugadas: 0,
        pagoPotencial: 0,
        porcentajeTope: 0,
        estadoRiesgo: 'seguro'
      };
    }

    ventasSorteoActual.forEach(v => {
      if (map[v.numero]) {
        map[v.numero].totalApostado += v.monto;
        map[v.numero].cantidadJugadas += 1;
        map[v.numero].pagoPotencial = map[v.numero].totalApostado * sorteoSeleccionado.multiplicador;
        const pct = (map[v.numero].totalApostado / config.topeMaximoPorNumero) * 100;
        map[v.numero].porcentajeTope = pct;

        if (pct >= 100) {
          map[v.numero].estadoRiesgo = 'bloqueado';
        } else if (pct >= 75) {
          map[v.numero].estadoRiesgo = 'alerta';
        } else {
          map[v.numero].estadoRiesgo = 'seguro';
        }
      }
    });

    return map;
  }, [ventasSorteoActual, config.topeMaximoPorNumero, sorteoSeleccionado]);

  // Top números más cargados
  const topNumerosCargados = useMemo(() => {
    return Object.values(matrizRiesgo)
      .filter(item => item.totalApostado > 0)
      .sort((a, b) => b.totalApostado - a.totalApostado)
      .slice(0, 5);
  }, [matrizRiesgo]);

  // Cálculo de Escrutinio / Ganadores
  const resultadoEscrutinio = useMemo(() => {
    if (!sorteoSeleccionado.cerrado || !sorteoSeleccionado.numeroGanador) {
      return null;
    }
    const numGanador = sorteoSeleccionado.numeroGanador;
    const tiquetesGanadores = ventasSorteoActual.filter(v => v.numero === numGanador);
    const montoApostadoGanador = tiquetesGanadores.reduce((acc, c) => acc + c.monto, 0);
    const totalPremiosPagar = montoApostadoGanador * sorteoSeleccionado.multiplicador;
    const utilidadNeta = ventaBrutaTotal - totalPremiosPagar;

    return {
      numeroGanador: numGanador,
      tiquetesGanadores,
      montoApostadoGanador,
      totalPremiosPagar,
      utilidadNeta,
      esGanancia: utilidadNeta >= 0
    };
  }, [sorteoSeleccionado, ventasSorteoActual, ventaBrutaTotal]);

  const vendedorActual = useMemo(() => {
    return config.vendedores.find(v => v.id === config.vendedorActivoId) || config.vendedores[0] || {
      id: 'vend-1',
      nombre: 'Diego Orozco',
      nombreLocal: 'Puesto Principal',
      telefono: config.sinpeTelefono,
      logoEmoji: '🎰',
      activo: true
    };
  }, [config.vendedores, config.vendedorActivoId, config.sinpeTelefono]);

  // Registro de Venta
  const handleRegistrarVenta = () => {
    setErrorMsg('');
    const numFormateado = numeroInput.trim().padStart(2, '0');

    if (numFormateado.length !== 2 || isNaN(Number(numFormateado)) || Number(numFormateado) < 0 || Number(numFormateado) > 99) {
      setErrorMsg('Ingresa un número válido del 00 al 99.');
      return;
    }

    if (montoInput <= 0) {
      setErrorMsg('El monto debe ser mayor a 0.');
      return;
    }

    if (sorteoSeleccionado.cerrado) {
      setErrorMsg('Este sorteo ya se encuentra cerrado.');
      return;
    }

    // Validación de Tope
    const actualApostado = matrizRiesgo[numFormateado]?.totalApostado || 0;
    const nuevoTotal = actualApostado + montoInput;

    if (nuevoTotal > config.topeMaximoPorNumero) {
      const espacioDisponible = Math.max(0, config.topeMaximoPorNumero - actualApostado);
      setErrorMsg(`¡TOPE ALCANZADO para el ${numFormateado}! Máximo permitido: ${config.moneda}${espacioDisponible.toLocaleString()}`);
      return;
    }

    const nuevaVenta: VentaItem = {
      id: `vt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sorteoId: sorteoSeleccionado.id,
      numero: numFormateado,
      monto: montoInput,
      cliente: clienteInput.trim() || 'Cliente Mostrador',
      vendedor: `${vendedorActual.logoEmoji} ${vendedorActual.nombreLocal}`,
      timestamp: Date.now(),
      tiqueteCodigo: `TK-${Math.floor(100000 + Math.random() * 900000)}`
    };

    setVentas(prev => [nuevaVenta, ...prev]);
    setUltimoTiquete(nuevaVenta);
    setNumeroInput('');
    setClienteInput('');
  };

  // Cierre de Sorteo
  const handleCerrarSorteo = () => {
    const numGanador = ganadorInput.trim().padStart(2, '0');
    if (numGanador.length !== 2 || isNaN(Number(numGanador))) {
      alert('Ingresa el número ganador de 2 dígitos (00-99)');
      return;
    }

    setSorteos(prev =>
      prev.map(s => {
        if (s.id === sorteoSeleccionado.id) {
          return {
            ...s,
            cerrado: true,
            numeroGanador: numGanador
          };
        }
        return s;
      })
    );

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleReabrirSorteo = () => {
    if (window.confirm('¿Deseas reabrir este sorteo para seguir ingresando ventas o corregir el resultado?')) {
      setSorteos(prev =>
        prev.map(s => {
          if (s.id === sorteoSeleccionado.id) {
            return {
              ...s,
              cerrado: false,
              numeroGanador: null
            };
          }
          return s;
        })
      );
    }
  };

  // Compartir Tiquete por WhatsApp
  const handleCompartirWhatsApp = (tiquete: VentaItem) => {
    const texto = `${vendedorActual.logoEmoji} *TIQUETE DE JUGADA - ${vendedorActual.nombreLocal.toUpperCase()}* ${vendedorActual.logoEmoji}%0A` +
      `🏢 *Banca:* ${config.nombreBanca}%0A` +
      `👤 *Vendedor:* ${vendedorActual.nombre} (Tel: ${vendedorActual.telefono})%0A` +
      `📅 *Sorteo:* ${sorteoSeleccionado.nombre}%0A` +
      `🆔 *Tiquete:* ${tiquete.tiqueteCodigo}%0A` +
      `🎟️ *Cliente:* ${tiquete.cliente}%0A` +
      `🔢 *Número:* [ *${tiquete.numero}* ]%0A` +
      `💰 *Monto Apostado:* ${config.moneda}${tiquete.monto.toLocaleString()}%0A` +
      `🏆 *Premio a Cobrar:* ${config.moneda}${(tiquete.monto * sorteoSeleccionado.multiplicador).toLocaleString()}%0A` +
      `⚡ *Hora:* ${new Date(tiquete.timestamp).toLocaleTimeString()}%0A` +
      `_¡Mucha suerte! Reclame su premio con este comprobante oficial._`;

    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

  return (
    <div className="app-container">
      {/* Top Banner de Suscripción Micro SaaS */}
      <header className="top-header">
        <div className="brand-badge">
          <div className="brand-logo-icon">
            <span style={{ fontSize: '1.2rem' }}>{vendedorActual.logoEmoji}</span>
          </div>
          <div>
            <h1 className="brand-title">{vendedorActual.nombreLocal} <span>PRO</span></h1>
            <p className="brand-subtitle">{config.nombreBanca} • Vendedor: {vendedorActual.nombre}</p>
          </div>
        </div>

        {/* Selector de Local / Vendedor Activo */}
        <div className="vendor-switcher">
          <select
            value={config.vendedorActivoId}
            onChange={e => setConfig(prev => ({ ...prev, vendedorActivoId: e.target.value }))}
            className="vendor-select-dropdown"
          >
            {config.vendedores.map(v => (
              <option key={v.id} value={v.id}>
                {v.logoEmoji} {v.nombreLocal} ({v.nombre})
              </option>
            ))}
          </select>
        </div>

        <div className="subscription-status">
          <span className="badge-trial">
            <Sparkles size={13} /> {config.subscripcion.diasRestantesTrial} días
          </span>
          <button className="btn-upgrade" onClick={() => setTab('config')}>
            Ajustes
          </button>
        </div>
      </header>

      {/* Selector de Sorteo Activo */}
      <div className="sorteo-strip">
        <span className="sorteo-label">Sorteo en curso:</span>
        <div className="sorteo-pills">
          {sorteos.map(s => (
            <button
              key={s.id}
              className={`sorteo-pill ${s.id === sorteoSeleccionado.id ? 'active' : ''} ${s.cerrado ? 'cerrado' : ''}`}
              onClick={() => setSorteoActivoId(s.id)}
            >
              {s.nombre}
              {s.cerrado && <span className="pill-status">✓ Ganador: {s.numeroGanador}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas en Vivo del Sorteo */}
      <section className="live-metrics-bar">
        <div className="metric-box">
          <span className="metric-title">Venta Bruta Total</span>
          <span className="metric-value">{config.moneda}{ventaBrutaTotal.toLocaleString()}</span>
        </div>
        <div className="metric-box">
          <span className="metric-title">Tiquetes Emitidos</span>
          <span className="metric-value">{ventasSorteoActual.length}</span>
        </div>
        <div className="metric-box">
          <span className="metric-title">Tope x Número</span>
          <span className="metric-value">{config.moneda}{config.topeMaximoPorNumero.toLocaleString()}</span>
        </div>
        <div className="metric-box highlight">
          <span className="metric-title">Núm. Más Cargado</span>
          <span className="metric-value">
            {topNumerosCargados[0] ? `#${topNumerosCargados[0].numero} (${config.moneda}${topNumerosCargados[0].totalApostado.toLocaleString()})` : '--'}
          </span>
        </div>
      </section>

      {/* Contenido Principal por Pestañas */}
      <main className="tab-viewport">
        {/* TAB 1: POS / PUNTO DE VENTA RÁPIDO */}
        {tab === 'pos' && (
          <div className="pos-layout">
            <div className="pos-card main-form">
              <div className="card-header">
                <h2><Zap size={20} className="icon-gold" /> Registro Rápido de Tiquete</h2>
                {sorteoSeleccionado.cerrado && (
                  <span className="badge-alerta-cerrado">Sorteo Cerrado</span>
                )}
              </div>

              {errorMsg && (
                <div className="error-banner">
                  <ShieldAlert size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pos-inputs-grid">
                <div className="input-group">
                  <label>Número (00 al 99)</label>
                  <input
                    type="number"
                    max={99}
                    min={0}
                    placeholder="Ej: 42"
                    value={numeroInput}
                    disabled={sorteoSeleccionado.cerrado}
                    onChange={e => setNumeroInput(e.target.value.slice(0, 2))}
                    className="big-num-input"
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label>Monto a Apostar ({config.moneda})</label>
                  <input
                    type="number"
                    value={montoInput || ''}
                    disabled={sorteoSeleccionado.cerrado}
                    onChange={e => setMontoInput(Number(e.target.value))}
                    className="big-amount-input"
                  />
                  <div className="quick-amount-buttons">
                    {[500, 1000, 2000, 5000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        className={`btn-amt-chip ${montoInput === amt ? 'active' : ''}`}
                        onClick={() => setMontoInput(amt)}
                      >
                        +{amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>Nombre del Cliente (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Murillo"
                    value={clienteInput}
                    disabled={sorteoSeleccionado.cerrado}
                    onChange={e => setClienteInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Teclado Táctil 0-9 para celulares */}
              <div className="numpad-container">
                <div className="numpad-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '00'].map(key => (
                    <button
                      key={key}
                      type="button"
                      disabled={sorteoSeleccionado.cerrado}
                      className="btn-num-key"
                      onClick={() => {
                        if (key === 'C') {
                          setNumeroInput('');
                        } else if (key === '00') {
                          setNumeroInput('00');
                        } else {
                          if (numeroInput.length < 2) {
                            setNumeroInput(prev => `${prev}${key}`);
                          }
                        }
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn-submit-ticket"
                onClick={handleRegistrarVenta}
                disabled={sorteoSeleccionado.cerrado}
              >
                <Plus size={20} /> Vender Tiquete #{numeroInput.padStart(2, '0') || '--'}
              </button>
            </div>

            {/* Sidebar del Último Tiquete */}
            <div className="pos-sidebar">
              <div className="ticket-preview-card">
                <h3>Comprobante Digital Reciente</h3>
                {ultimoTiquete ? (
                  <div className="ticket-body">
                    <div className="ticket-header">
                      <strong>{config.nombreBanca}</strong>
                      <span className="code">{ultimoTiquete.tiqueteCodigo}</span>
                    </div>
                    <div className="ticket-meta">
                      <p><span>Cliente:</span> <strong>{ultimoTiquete.cliente}</strong></p>
                      <p><span>Sorteo:</span> {sorteoSeleccionado.nombre}</p>
                      <p><span>Hora:</span> {new Date(ultimoTiquete.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="ticket-highlight">
                      <div className="th-item">
                        <span>Número</span>
                        <div className="th-number">{ultimoTiquete.numero}</div>
                      </div>
                      <div className="th-item">
                        <span>Apostado</span>
                        <div className="th-val">{config.moneda}{ultimoTiquete.monto.toLocaleString()}</div>
                      </div>
                      <div className="th-item">
                        <span>Paga</span>
                        <div className="th-val win">{config.moneda}{(ultimoTiquete.monto * sorteoSeleccionado.multiplicador).toLocaleString()}</div>
                      </div>
                    </div>
                    <button 
                      className="btn-whatsapp-share"
                      onClick={() => handleCompartirWhatsApp(ultimoTiquete)}
                    >
                      <Share2 size={16} /> Enviar por WhatsApp
                    </button>
                  </div>
                ) : (
                  <div className="empty-ticket-hint">
                    <p>No has registrado ventas en esta sesión aún.</p>
                  </div>
                )}
              </div>

              {/* Lista Rápida de Riesgo */}
              <div className="risk-quick-list">
                <h4><Flame size={16} className="icon-fire" /> Top 5 Números Expuestos</h4>
                {topNumerosCargados.length === 0 ? (
                  <p className="empty-txt">Sin números cargados aún.</p>
                ) : (
                  topNumerosCargados.map(item => (
                    <div key={item.numero} className="risk-row">
                      <div className="risk-num-badge">#{item.numero}</div>
                      <div className="risk-details">
                        <div className="rd-top">
                          <span>{config.moneda}{item.totalApostado.toLocaleString()}</span>
                          <span className={`risk-pct ${item.estadoRiesgo}`}>
                            {item.porcentajeTope.toFixed(0)}% del tope
                          </span>
                        </div>
                        <div className="progress-bar-bg">
                          <div 
                            className={`progress-bar-fill ${item.estadoRiesgo}`}
                            style={{ width: `${Math.min(100, item.porcentajeTope)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATRIZ DE RIESGO 00-99 (MAPA DE CALOR) */}
        {tab === 'riesgo' && (
          <div className="heat-map-layout">
            <div className="heat-map-header">
              <div>
                <h2><Flame size={22} className="icon-fire" /> Matriz de Riesgo en Vivo (00 al 99)</h2>
                <p>Monitorea la acumulación de dinero en cada número. Bloqueo preventivo al 100% del tope ({config.moneda}{config.topeMaximoPorNumero.toLocaleString()}).</p>
              </div>

              <div className="heat-map-legend">
                <span className="legend-item"><span className="dot safe" /> 0% - 74% Seguro</span>
                <span className="legend-item"><span className="dot warning" /> 75% - 99% Cuidado</span>
                <span className="legend-item"><span className="dot danger" /> 100%+ Límite Bloqueado</span>
              </div>
            </div>

            <div className="grid-heatmap-00-99">
              {Object.values(matrizRiesgo).map(item => (
                <div 
                  key={item.numero} 
                  className={`heat-cell ${item.estadoRiesgo} ${item.totalApostado > 0 ? 'has-bets' : ''}`}
                  onClick={() => {
                    setNumeroInput(item.numero);
                    setTab('pos');
                  }}
                  title={`Número: ${item.numero} | Total: ${config.moneda}${item.totalApostado} | Potencial: ${config.moneda}${item.pagoPotencial}`}
                >
                  <span className="cell-num">{item.numero}</span>
                  <span className="cell-amt">
                    {item.totalApostado > 0 ? `${(item.totalApostado / 1000).toFixed(item.totalApostado >= 1000 ? 1 : 0)}k` : '·'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ESCRUTINIO Y LIQUIDACIÓN */}
        {tab === 'escrutinio' && (
          <div className="settlement-layout">
            <div className="settlement-card">
              <h2><Trophy size={22} className="icon-gold" /> Cierre y Liquidación de Premios</h2>
              <p>Ingresa el número ganador oficial para calcular inmediatamente la lista de ganadores y el balance neto del sorteo.</p>

              {!sorteoSeleccionado.cerrado ? (
                <div className="winner-input-box">
                  <div className="wib-form">
                    <label>Ingresa el Número Ganador Oficial (00-99)</label>
                    <input
                      type="number"
                      placeholder="Ej: 42"
                      value={ganadorInput}
                      onChange={e => setGanadorInput(e.target.value.slice(0, 2))}
                      className="winner-input"
                    />
                    <button className="btn-settle" onClick={handleCerrarSorteo}>
                      Liquidar y Cerrar Sorteo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="settled-summary">
                  <div className="winner-announced">
                    <span className="tag">Número Ganador Oficial</span>
                    <div className="winning-ball">{sorteoSeleccionado.numeroGanador}</div>
                    <button className="btn-reopen" onClick={handleReabrirSorteo}>
                      <RotateCcw size={15} /> Reabrir o Modificar
                    </button>
                  </div>

                  {resultadoEscrutinio && (
                    <div className="financial-balance-grid">
                      <div className="fin-card">
                        <span className="label">Ventas Brutas Acumuladas</span>
                        <span className="val">{config.moneda}{ventaBrutaTotal.toLocaleString()}</span>
                      </div>
                      <div className="fin-card">
                        <span className="label">Total de Premios a Pagar</span>
                        <span className="val danger">-{config.moneda}{resultadoEscrutinio.totalPremiosPagar.toLocaleString()}</span>
                      </div>
                      <div className={`fin-card total ${resultadoEscrutinio.esGanancia ? 'profit' : 'loss'}`}>
                        <span className="label">Utilidad Neta Real</span>
                        <span className="val">
                          {resultadoEscrutinio.esGanancia ? '+' : ''}{config.moneda}{resultadoEscrutinio.utilidadNeta.toLocaleString()}
                        </span>
                        <span className="sub-status">
                          {resultadoEscrutinio.esGanancia ? '🎉 Ganancia para la banca' : '⚠️ Pérdida cubierta con reserva'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lista de Ganadores */}
                  <div className="winners-list-container">
                    <h3>Ganadores Identificados ({resultadoEscrutinio?.tiquetesGanadores.length || 0})</h3>
                    {resultadoEscrutinio?.tiquetesGanadores.length === 0 ? (
                      <div className="no-winners-alert">
                        <CheckCircle2 size={24} className="icon-success" />
                        <div>
                          <strong>¡La banca retiene el 100% de la venta!</strong>
                          <p>Nadie apostó al número {resultadoEscrutinio.numeroGanador}. Utilidad bruta total: {config.moneda}{ventaBrutaTotal.toLocaleString()}.</p>
                        </div>
                      </div>
                    ) : (
                      <table className="winners-table">
                        <thead>
                          <tr>
                            <th>Tiquete</th>
                            <th>Cliente</th>
                            <th>Apostó</th>
                            <th>Premio a Entregar ({sorteoSeleccionado.multiplicador}x)</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultadoEscrutinio?.tiquetesGanadores.map(tk => (
                            <tr key={tk.id}>
                              <td><code>{tk.tiqueteCodigo}</code></td>
                              <td>{tk.cliente}</td>
                              <td>{config.moneda}{tk.monto.toLocaleString()}</td>
                              <td className="highlight-win">{config.moneda}{(tk.monto * sorteoSeleccionado.multiplicador).toLocaleString()}</td>
                              <td>
                                <button className="btn-action-small" onClick={() => handleCompartirWhatsApp(tk)}>
                                  Notificar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: HISTORIAL DE VENTAS */}
        {tab === 'historial' && (
          <div className="history-layout">
            <div className="history-header">
              <h2><History size={22} /> Auditoría y Registro de Tiquetes</h2>
              <span className="count-badge">{ventasSorteoActual.length} tiquetes registrados</span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Número</th>
                    <th>Monto</th>
                    <th>Premio Potencial</th>
                    <th>Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasSorteoActual.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-table-row">No hay tiquetes registrados en este sorteo.</td>
                    </tr>
                  ) : (
                    ventasSorteoActual.map(v => (
                      <tr key={v.id}>
                        <td><code>{v.tiqueteCodigo}</code></td>
                        <td>{new Date(v.timestamp).toLocaleTimeString()}</td>
                        <td>{v.cliente}</td>
                        <td><span className="num-pill">{v.numero}</span></td>
                        <td>{config.moneda}{v.monto.toLocaleString()}</td>
                        <td className="premio-val">{config.moneda}{(v.monto * sorteoSeleccionado.multiplicador).toLocaleString()}</td>
                        <td>
                          <button className="btn-icon" onClick={() => handleCompartirWhatsApp(v)} title="Compartir WhatsApp">
                            <Share2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CONFIGURACIÓN & SUSCRIPCIÓN SAAS */}
        {tab === 'config' && (
          <div className="config-layout">
            <div className="config-card">
              <h2><Settings size={22} /> Configuración de la Banca & Topes de Riesgo</h2>
              
              <div className="config-form-grid">
                <div className="input-group">
                  <label>Nombre de la Banca o Puesto</label>
                  <input
                    type="text"
                    value={config.nombreBanca}
                    onChange={e => setConfig(prev => ({ ...prev, nombreBanca: e.target.value }))}
                  />
                </div>

                <div className="input-group">
                  <label>Símbolo de Moneda</label>
                  <input
                    type="text"
                    value={config.moneda}
                    onChange={e => setConfig(prev => ({ ...prev, moneda: e.target.value }))}
                  />
                </div>

                <div className="input-group">
                  <label>Tope Máximo de Venta por Número ({config.moneda})</label>
                  <input
                    type="number"
                    value={config.topeMaximoPorNumero}
                    onChange={e => setConfig(prev => ({ ...prev, topeMaximoPorNumero: Number(e.target.value) }))}
                  />
                  <small className="helper">Al alcanzar este monto en un número, la app bloqueará automáticamente más apuestas para evitar quiebras.</small>
                </div>

                <div className="input-group">
                  <label>Tasa de Pago (Multiplicador de Premio)</label>
                  <input
                    type="number"
                    value={config.pagoMultiplicador}
                    onChange={e => setConfig(prev => ({ ...prev, pagoMultiplicador: Number(e.target.value) }))}
                  />
                  <small className="helper">Usualmente 80 a 1 o 70 a 1 según la banca.</small>
                </div>
              </div>

              {/* Gestión de Locales y Vendedores */}
              <div className="vendors-management-section">
                <div className="vms-header">
                  <h3>🏪 Locales y Vendedores Registrados</h3>
                  <button
                    className="btn-add-vendor"
                    onClick={() => {
                      const nuevoId = `vend-${Date.now()}`;
                      const nuevo: VendedorLocal = {
                        id: nuevoId,
                        nombre: `Vendedor ${config.vendedores.length + 1}`,
                        nombreLocal: `Puesto #${config.vendedores.length + 1}`,
                        telefono: config.sinpeTelefono,
                        logoEmoji: '📍',
                        activo: true
                      };
                      setConfig(prev => ({
                        ...prev,
                        vendedores: [...prev.vendedores, nuevo],
                        vendedorActivoId: nuevoId
                      }));
                    }}
                  >
                    <Plus size={16} /> Agregar Local / Vendedor
                  </button>
                </div>

                <div className="vendors-list-cards">
                  {config.vendedores.map((v, idx) => (
                    <div key={v.id} className={`vendor-card-item ${v.id === config.vendedorActivoId ? 'active-vendor' : ''}`}>
                      <div className="vci-top">
                        <div className="vci-badge">
                          <input
                            type="text"
                            value={v.logoEmoji}
                            title="Haz clic para cambiar el emoji/logo del local"
                            onChange={e => {
                              const val = e.target.value;
                              setConfig(prev => ({
                                ...prev,
                                vendedores: prev.vendedores.map(item => item.id === v.id ? { ...item, logoEmoji: val } : item)
                              }));
                            }}
                            className="vci-emoji-input"
                          />
                        </div>
                        <div className="vci-title-group">
                          <input
                            type="text"
                            value={v.nombreLocal}
                            placeholder="Nombre del Local / Puesto"
                            onChange={e => {
                              const val = e.target.value;
                              setConfig(prev => ({
                                ...prev,
                                vendedores: prev.vendedores.map(item => item.id === v.id ? { ...item, nombreLocal: val } : item)
                              }));
                            }}
                            className="vci-input-name"
                          />
                          <span className="vci-sub">Puesto #{idx + 1}</span>
                        </div>
                      </div>

                      <div className="vci-fields">
                        <div className="vci-field">
                          <label>Nombre del Vendedor</label>
                          <input
                            type="text"
                            value={v.nombre}
                            placeholder="Ej: Carlos M."
                            onChange={e => {
                              const val = e.target.value;
                              setConfig(prev => ({
                                ...prev,
                                vendedores: prev.vendedores.map(item => item.id === v.id ? { ...item, nombre: val } : item)
                              }));
                            }}
                          />
                        </div>

                        <div className="vci-field">
                          <label>Teléfono WhatsApp del Local</label>
                          <input
                            type="text"
                            value={v.telefono}
                            placeholder="8761-1422"
                            onChange={e => {
                              const val = e.target.value;
                              setConfig(prev => ({
                                ...prev,
                                vendedores: prev.vendedores.map(item => item.id === v.id ? { ...item, telefono: val } : item)
                              }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="vci-bottom-actions">
                        <button
                          className={`btn-select-as-active ${v.id === config.vendedorActivoId ? 'current' : ''}`}
                          onClick={() => setConfig(prev => ({ ...prev, vendedorActivoId: v.id }))}
                        >
                          {v.id === config.vendedorActivoId ? '✓ Local Seleccionado' : 'Seleccionar como Activo'}
                        </button>
                        {config.vendedores.length > 1 && (
                          <button
                            className="btn-del-vendor"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar ${v.nombreLocal}?`)) {
                                setConfig(prev => {
                                  const filtered = prev.vendedores.filter(item => item.id !== v.id);
                                  return {
                                    ...prev,
                                    vendedores: filtered,
                                    vendedorActivoId: prev.vendedorActivoId === v.id ? filtered[0]?.id || '' : prev.vendedorActivoId
                                  };
                                });
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Módulo de Suscripción Micro SaaS y Métodos de Cobro Costa Rica */}
            <div className="subscription-pricing-card">
              <div className="spc-badge">
                <DollarSign size={20} /> Métodos de Pago y Suscripción (Costa Rica)
              </div>
              <h3>Planes y Activación de Licencia BancaControl</h3>
              <p>Tu software operativo siempre respaldado, con topes automáticos en tiempo real y soporte continuo.</p>

              <div className="pricing-grid">
                <div className={`price-tier ${config.subscripcion.plan === 'starter' ? 'current' : ''}`}>
                  <div className="tier-head">
                    <h4>Puesto Individual</h4>
                    <span className="price">₡10,000 <span>/ mes</span></span>
                  </div>
                  <ul className="tier-features">
                    <li>✓ 1 Punto de Venta</li>
                    <li>✓ Matriz de riesgo 00-99 en vivo</li>
                    <li>✓ Topes de seguridad anti-quiebra</li>
                    <li>✓ Tiquetes WhatsApp ilimitados</li>
                  </ul>
                  <button className="btn-tier" onClick={() => setConfig(prev => ({ ...prev, subscripcion: { ...prev.subscripcion, plan: 'starter' } }))}>
                    {config.subscripcion.plan === 'starter' ? 'Plan Seleccionado' : 'Elegir Starter (₡10,000)'}
                  </button>
                </div>

                <div className={`price-tier recommended ${config.subscripcion.plan === 'pro' ? 'current' : ''}`}>
                  <div className="pop-badge">Más Popular</div>
                  <div className="tier-head">
                    <h4>Banquero PRO</h4>
                    <span className="price">₡25,000 <span>/ mes</span></span>
                  </div>
                  <ul className="tier-features">
                    <li>✓ Hasta 5 vendedores / mesas</li>
                    <li>✓ Consolidación de números en vivo</li>
                    <li>✓ Auditoría anti-fraude de tiquetes</li>
                    <li>✓ Respaldo de base de datos automático</li>
                    <li>✓ Soporte VIP 24/7 vía WhatsApp</li>
                  </ul>
                  <button className="btn-tier primary" onClick={() => setConfig(prev => ({ ...prev, subscripcion: { ...prev.subscripcion, plan: 'pro' } }))}>
                    {config.subscripcion.plan === 'pro' ? 'Plan Seleccionado' : 'Elegir PRO (₡25,000)'}
                  </button>
                </div>
              </div>

              {/* Caja de Pago Directo por Sinpe Móvil */}
              <div className="sinpe-payment-box">
                <div className="sinpe-header">
                  <div className="sinpe-badge">🇨🇷 Método Preferido en Costa Rica</div>
                  <h4>Pago Directo por SINPE Móvil (Sin intermediarios)</h4>
                </div>

                <div className="sinpe-instructions">
                  <div className="sinpe-data-pill">
                    <span>Número SINPE Móvil:</span>
                    <strong>{config.sinpeTelefono}</strong>
                  </div>
                  <div className="sinpe-data-pill">
                    <span>A nombre de:</span>
                    <strong>{config.sinpeNombreTitular}</strong>
                  </div>
                  <div className="sinpe-data-pill">
                    <span>Monto a transferir:</span>
                    <strong>{config.subscripcion.plan === 'starter' ? '₡10,000' : '₡25,000'}</strong>
                  </div>
                  <div className="sinpe-data-pill">
                    <span>Detalle del Sinpe:</span>
                    <strong>BancaControl - {config.nombreBanca}</strong>
                  </div>
                </div>

                <div className="sinpe-actions">
                  <button
                    className="btn-sinpe-whatsapp"
                    onClick={() => {
                      const monto = config.subscripcion.plan === 'starter' ? '₡10,000' : '₡25,000';
                      const msg = `👋 Hola, acabo de realizar la transferencia por Sinpe Móvil para la suscripción de *BancaControl PRO*.%0A` +
                        `🏢 *Banca:* ${config.nombreBanca}%0A` +
                        `📦 *Plan:* ${config.subscripcion.plan.toUpperCase()} (${monto}/mes)%0A` +
                        `Adjunto el comprobante del banco para la activación.`;
                      window.open(`https://wa.me/${config.sinpeTelefono.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
                    }}
                  >
                    <Share2 size={16} /> Notificar Pago por WhatsApp
                  </button>

                  <a
                    href={config.hotmartLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-card-hotmart"
                  >
                    ¿Prefieres pagar con Tarjeta? Pagar en Hotmart
                  </a>
                </div>
              </div>

              {/* Desbloqueo mediante Token o PIN */}
              <div className="token-activation-box">
                <h4>🔑 Activar Código de Suscripción / PIN de 30 días</h4>
                <div className="tab-input-row">
                  <input
                    type="text"
                    id="tokenInput"
                    placeholder="Ingresa tu código PIN (Ej: PRO-2026-CR)"
                  />
                  <button
                    className="btn-activate-pin"
                    onClick={() => {
                      const input = document.getElementById('tokenInput') as HTMLInputElement;
                      if (input && input.value.trim().length >= 4) {
                        setConfig(prev => ({
                          ...prev,
                          subscripcion: {
                            ...prev.subscripcion,
                            activa: true,
                            diasRestantesTrial: 30,
                            fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                          }
                        }));
                        confetti({ particleCount: 70, spread: 60 });
                        alert('¡Suscripción activada con éxito por 30 días adicionales!');
                        input.value = '';
                      } else {
                        alert('Ingresa un PIN o código de activación válido.');
                      }
                    }}
                  >
                    Activar 30 Días
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Barra de Navegación Inferior (Estilo Mobile App) */}
      <nav className="bottom-nav">
        <button
          className={`nav-btn ${tab === 'pos' ? 'active' : ''}`}
          onClick={() => setTab('pos')}
        >
          <Zap size={20} />
          <span>Vender</span>
        </button>

        <button
          className={`nav-btn ${tab === 'riesgo' ? 'active' : ''}`}
          onClick={() => setTab('riesgo')}
        >
          <Flame size={20} />
          <span>Matriz 00-99</span>
        </button>

        <button
          className={`nav-btn ${tab === 'escrutinio' ? 'active' : ''}`}
          onClick={() => setTab('escrutinio')}
        >
          <Trophy size={20} />
          <span>Cierre</span>
        </button>

        <button
          className={`nav-btn ${tab === 'historial' ? 'active' : ''}`}
          onClick={() => setTab('historial')}
        >
          <History size={20} />
          <span>Tiquetes</span>
        </button>

        <button
          className={`nav-btn ${tab === 'config' ? 'active' : ''}`}
          onClick={() => setTab('config')}
        >
          <Settings size={20} />
          <span>Ajustes</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
