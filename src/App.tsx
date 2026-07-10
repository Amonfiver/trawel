import { useEffect, useRef, useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        mobileMenuRef.current &&
        event.target instanceof Node &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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
          <a href="/comunidad" className={styles.navLink}>Comunidad</a>
          <a href="/contacto" className={styles.navLink}>Contacto</a>
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
        <div className={styles.mobileMenuWrap} ref={mobileMenuRef}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-label={isMobileMenuOpen ? 'Cerrar menu de navegacion' : 'Abrir menu de navegacion'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>

          {isMobileMenuOpen && (
            <nav
              id="mobile-navigation"
              className={styles.mobileNavPanel}
              aria-label="Navegacion movil"
            >
              <div className={styles.mobileNavHeader}>
                <span>Menu</span>
                <button
                  type="button"
                  className={styles.mobileNavClose}
                  aria-label="Cerrar menu"
                  onClick={closeMobileMenu}
                >
                  X
                </button>
              </div>
              <a href="/" className={styles.mobileNavLink} onClick={closeMobileMenu}>Inicio</a>
              <a href="/#atlas-mundial" className={styles.mobileNavLink} onClick={closeMobileMenu}>Atlas</a>
              <a href="/#destinos" className={styles.mobileNavLink} onClick={closeMobileMenu}>Destinos</a>
              <a href="/comunidad" className={styles.mobileNavLink} onClick={closeMobileMenu}>Comunidad</a>
              <a href="/compartir" className={styles.mobileNavLink} onClick={closeMobileMenu}>Compartir</a>
              <a href="/contacto" className={styles.mobileNavLink} onClick={closeMobileMenu}>Contacto</a>
            </nav>
          )}
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
