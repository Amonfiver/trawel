import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import './styles/variables/colors.css';

function App() {
  return <RouterProvider router={router} />;
}

export default App;