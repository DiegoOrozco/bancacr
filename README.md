# BancaControl PRO - Micro SaaS para Puestos de Tiempos

Micro aplicación orientada a la gestión operativa, control de riesgo y liquidación financiera en tiempo real para banqueros y vendedores de tiempos.

## 🚀 Características Principales

1. **Punto de Venta Rápido (POS Táctil):**
   - Teclado numérico táctil optimizado para celulares.
   - Selección ágil de números (00-99) y botones rápidos de monto (+500, +1k, +2k, +5k).
   - Generación de comprobante digital y botón instantáneo para **compartir tiquete formateado por WhatsApp**.

2. **Matriz de Riesgo en Vivo (Mapa de Calor 00-99):**
   - Semáforo visual en tiempo real (Verde: seguro, Amarillo: advertencia al 75%, Rojo: tope alcanzado).
   - Top 5 de números más cargados con barra de exposición porcentual.
   - **Bloqueo preventivo de ventas automático** para evitar que la banca asuma riesgo de quiebra.

3. **Escrutinio y Cierre de Sorteo:**
   - Múltiples sorteos por día (Mediodía, Tarde, Noche).
   - Ingreso del número ganador oficial con efecto confetti y cálculo instantáneo.
   - Desglose financiero neto: `Venta Bruta Acumulada - Total de Premios a Pagar = Ganancia / Pérdida Neta`.
   - Listado de tiquetes premiados con botón de notificación directa.

4. **Auditoría e Historial de Jugadas:**
   - Registro de tiquetes con código único, cliente, hora y monto.

5. **Modelo Micro SaaS por Suscripción:**
   - Banner de prueba gratuita (Trial de 7 días).
   - Planes Starter (Puesto Único: ₡10,000/mes) y Banquero PRO (Multi-mesa: ₡25,000/mes).

## 🛠️ Ejecución Local

```bash
cd /Users/diegorozco/Documents/MicroApps/banca-control
npm install
npm run dev
```

Disponible localmente en: `http://127.0.0.1:5173/`
