# TiemposCR PRO - Micro SaaS para Puestos de Tiempos Costa Rica

Micro aplicación orientada a la gestión operativa, control de riesgo y liquidación financiera en tiempo real para banqueros y vendedores de tiempos en Costa Rica.

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

## 📲 Métodos de Pago y Suscripción Integrados (Costa Rica)

- **SINPE Móvil Directo:** Módulo en Ajustes que muestra número de teléfono, titular y detalle para transferencia bancaria directa (0% comisiones). Incluye botón preconfigurado de WhatsApp para enviar el comprobante.
- **Enlace a Hotmart:** Para clientes que deseen pagar de forma recurrente con tarjeta de crédito/débito.
- **Activador de Licencia por Token / PIN:** Desbloqueo instantáneo de 30 días adicionales para el cliente.

---

## ☁️ Publicación en Vercel (Paso a Paso)

El proyecto ya cuenta con su archivo de configuración [`vercel.json`](file:///Users/diegorozco/Documents/MicroApps/banca-control/vercel.json) listo para producción.

### Opción A (La más rápida vía Terminal):
1. Abre tu terminal e ingresa a la carpeta:
   ```bash
   cd /Users/diegorozco/Documents/MicroApps/banca-control
   npx vercel
   ```
2. Te pedirá iniciar sesión con tu cuenta de GitHub, Google o Correo (solo la primera vez).
3. Presiona `Enter` a las opciones por defecto (`Y`).
4. ¡En 30 segundos te dará tu enlace en vivo `https://banca-control-xxx.vercel.app`!

### Opción B (Conectando a GitHub):
1. Sube este repositorio a tu cuenta de GitHub (`git remote add origin ...`).
2. Entra a [vercel.com](https://vercel.com) con tu cuenta.
3. Haz clic en **"Add New Project"**, selecciona el repositorio y presiona **"Deploy"**.

---

## 🛠️ Ejecución Local y en Red Wi-Fi Móvil

```bash
cd /Users/diegorozco/Documents/MicroApps/banca-control
npm run dev
```

- **En tu Mac:** `http://localhost:5173/`
- **En tu celular (mismo Wi-Fi):** `http://192.168.4.23:5173/`

