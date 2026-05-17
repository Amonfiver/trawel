import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { ExperienceModeProvider, useExperienceMode } from './features/experienceMode';
import trawelLogo from './assets/brand/trawelogo-transparent.png';
import './styles/variables/colors.css';
import styles from './App.module.css';

/**
 * Header fijo premium con selector de modo
 */
function GlobalHeader() {
  const { mode: experienceMode, setMode } = useExperienceMode();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <a href="/" className={styles.logo}>
          <img 
            src={trawelLogo} 
            alt="Trawel Atlas" 
            className={styles.logoImage}
          />
        </a>
        <nav className={styles.nav}>
          <a href="/" className={styles.navLink}>Inicio</a>
          <a href="/#atlas-mundial" className={styles.navLink}>Atlas</a>
          <a href="/#destinos" className={styles.navLink}>Destinos</a>
        </nav>
        <div className={styles.modeSelector}>
          <button
            className={`${styles.modeButton} ${experienceMode === 'adventure' ? styles.modeButtonActive : ''}`}
            onClick={() => setMode('adventure')}
            aria-pressed={experienceMode === 'adventure'}
            title="Modo Aventura"
          >
            🎒 <span className={styles.modeLabel}>Aventura</span>
          </button>
          <button
            className={`${styles.modeButton} ${experienceMode === 'student' ? styles.modeButtonActive : ''}`}
            onClick={() => setMode('student')}
            aria-pressed={experienceMode === 'student'}
            title="Modo Estudiante"
          >
            🎓 <span className={styles.modeLabel}>Estudiante</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * App con Provider del modo de experiencia y header fijo
 */
function App() {
  return (
    <ExperienceModeProvider>
      <div className={styles.app}>
        <GlobalHeader />
        <main className={styles.main}>
          <RouterProvider router={router} />
        </main>
      </div>
    </ExperienceModeProvider>
  );
}

export default App;