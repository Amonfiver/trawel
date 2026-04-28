import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { ExperienceModeProvider, ExperienceModeSwitch, useExperienceMode } from './features/experienceMode';
import './styles/variables/colors.css';
import styles from './App.module.css';

/**
 * Componente interno que usa el contexto del modo de experiencia
 */
function AppContent() {
  const { mode, setMode } = useExperienceMode();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <a href="/" className={styles.logo}>
            🌍 Trawel
          </a>
          <ExperienceModeSwitch
            currentMode={mode}
            onModeChange={setMode}
            className={styles.modeSelector}
          />
        </div>
      </header>
      <main className={styles.main}>
        <RouterProvider router={router} />
      </main>
    </div>
  );
}

/**
 * App con Provider del modo de experiencia
 * 
 * El selector Aventura/Estudiante está visible en todo momento
 * y persiste el modo en localStorage.
 */
function App() {
  return (
    <ExperienceModeProvider>
      <AppContent />
    </ExperienceModeProvider>
  );
}

export default App;