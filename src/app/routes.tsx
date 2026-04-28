import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { CountryPage } from '../pages/CountryPage';
import { CityPage } from '../pages/CityPage';
import { AdventurePage } from '../pages/AdventurePage';
import { ImportInvestighostPage } from '../pages/ImportInvestighostPage';

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
    path: '/pais/:countrySlug/:citySlug',
    element: <CityPage />,
  },
  {
    path: '/aventura/:adventureSlug',
    element: <AdventurePage />,
  },
  {
    path: '/dev/import-investighost',
    element: <ImportInvestighostPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);