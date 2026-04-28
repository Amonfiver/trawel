import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeTravelDataSource } from './features/travelData'

/**
 * Punto de entrada de Trawel con inicialización controlada de datos
 * 
 * Flujo:
 * 1. Inicializar fuente de datos (mock o Supabase según VITE_TRAVEL_DATA_SOURCE)
 * 2. Renderizar App cuando los datos estén listos
 * 3. Mostrar pantalla de error si falla la inicialización
 */

const rootElement = document.getElementById('root')!

// Estado de inicialización
let initializationAttempted = false

/**
 * Renderiza la aplicación React
 */
function renderApp() {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

/**
 * Renderiza pantalla de carga mínima
 */
function renderLoading() {
  rootElement.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      color: #374151;
    ">
      <div style="
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      "></div>
      <p style="margin: 0; font-size: 16px;">Cargando Trawel...</p>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </div>
  `
}

/**
 * Renderiza pantalla de error
 */
function renderError(message: string) {
  rootElement.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      color: #374151;
      padding: 24px;
      text-align: center;
    ">
      <div style="
        width: 64px;
        height: 64px;
        background: #fee2e2;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        font-size: 32px;
      ">⚠️</div>
      <h1 style="margin: 0 0 8px 0; font-size: 20px; color: #dc2626;">
        No se pudieron cargar los datos de Trawel
      </h1>
      <p style="margin: 0 0 24px 0; color: #6b7280; max-width: 400px;">
        ${message}
      </p>
      <button onclick="window.location.reload()" style="
        padding: 12px 24px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
      ">
        Reintentar
      </button>
    </div>
  `
}

/**
 * Inicializa y arranca la aplicación
 */
async function bootstrap() {
  if (initializationAttempted) {
    return
  }
  initializationAttempted = true

  const dataSource = import.meta.env.VITE_TRAVEL_DATA_SOURCE || 'mock'
  
  // Solo mostrar loading si usamos Supabase (mock es instantáneo)
  if (dataSource === 'supabase') {
    renderLoading()
  }

  try {
    await initializeTravelDataSource()
    renderApp()
  } catch (error) {
    const message = error instanceof Error 
      ? error.message 
      : 'Error desconocido al inicializar la aplicación'
    
    console.error('[Trawel] Error de inicialización:', error)
    renderError(message)
  }
}

// Arrancar aplicación
bootstrap()