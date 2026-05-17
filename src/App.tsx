import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { ExperienceModeProvider } from './features/experienceMode';
import './styles/variables/colors.css';
import styles from './App.module.css';

/**
 * App con Provider del modo de experiencia
 * 
 * El header ahora está integrado en HomePage para una experiencia
 * de hero premium más inmersiva.
 */
function App() {
  return (
    <ExperienceModeProvider>
      <div className={styles.app}>
        <main className={styles.main}>
          <RouterProvider router={router} />
        </main>
      </div>
    </ExperienceModeProvider>
  );
}

export default App;
