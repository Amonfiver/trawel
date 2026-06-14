/**
 * Configuración de rutas de Trawel
 * 
 * Propósito: Definir todas las rutas públicas de la aplicación
 * Alcance: Rutas públicas de lectura y retirada de aventuras pendientes
 * 
 * Decisiones técnicas:
 * - React Router con createBrowserRouter
 * - Rutas en español para SEO local
 * - No hay rutas de administración (Trawel es solo plataforma pública)
 * 
 * Limitaciones actuales:
 * - Sin lazy loading (puede agregarse en el futuro)
 * - Sin protección de rutas (no hay autenticación)
 * 
 * Cambios recientes (2026-05-02):
 * - Añadida ruta /retirar-aventura para retirar envíos pending con token privado
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { CountryPage } from '../pages/CountryPage';
import { CountryZonePage } from '../pages/CountryZonePage';
import { WithdrawAdventurePage } from '../pages/WithdrawAdventurePage';
import { CityPage } from '../pages/CityPage';
import { AdventurePage } from '../pages/AdventurePage';
import { TrustPage } from '../pages/TrustPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/pais/:countrySlug',
    element: <CountryPage />,
  },
  {
    path: '/pais/:countrySlug/zona/:zoneSlug',
    element: <CountryZonePage />,
  },
  {
    path: '/retirar-aventura',
    element: <WithdrawAdventurePage />,
  },
  {
    path: '/sobre-trawel',
    element: <TrustPage page="sobre-trawel" />,
  },
  {
    path: '/contacto',
    element: <TrustPage page="contacto" />,
  },
  {
    path: '/privacidad',
    element: <TrustPage page="privacidad" />,
  },
  {
    path: '/cookies',
    element: <TrustPage page="cookies" />,
  },
  {
    path: '/terminos',
    element: <TrustPage page="terminos" />,
  },
  {
    path: '/creditos-imagenes',
    element: <TrustPage page="creditos-imagenes" />,
  },
  {
    path: '/compartir',
    element: <TrustPage page="compartir" />,
  },
  {
    path: '/pais/:countrySlug/:citySlug',
    element: <CityPage />,
  },
  {
    path: '/aventura/:adventureSlug',
    element: <AdventurePage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
