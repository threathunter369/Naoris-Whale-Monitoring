/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Wallets from './pages/Wallets';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Tokenomics from './pages/Tokenomics';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'wallets', element: <Wallets /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'alerts', element: <Alerts /> },
      { path: 'tokenomics', element: <Tokenomics /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
