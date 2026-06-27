import heroImage from '../../../assets/home/heroimagen.png';
import heroLogo from '../../../assets/brand/trawelogo-transparent.png';
import spainImage from '../../../assets/home/destinations/spain.png';
import mexicoImage from '../../../assets/home/destinations/mexico.png';
import italyImage from '../../../assets/home/destinations/italy.png';
import indiaImage from '../../../assets/home/destinations/india.png';
import albarracinImage from '../../../assets/home/plans/albarracin.png';
import amalfitanaImage from '../../../assets/home/plans/amalfitana.png';
import rajasthanImage from '../../../assets/home/plans/rajasthan.png';
import type { ScreenExperienceMode } from './screenData.types';

export type HomeImageKind = 'pais' | 'ciudad' | 'paisaje' | 'monumento' | 'aventura' | 'ruta';

export interface HomeScreenImage {
  url?: string;
  alt: string;
  kind: HomeImageKind;
}

export interface HomeScreenHeroData {
  wallpaperImageUrl: string;
  logoImageUrl: string;
  logoAlt: string;
  titleLines: {
    first: string;
    second: string;
    accent: string;
  };
  subtitle: string;
  primaryCta: {
    href: string;
    label: string;
    icon: string;
  };
  secondaryCta: {
    href: string;
    label: string;
  };
}

export interface HomeFeaturedDestination {
  slug: string;
  name: string;
  flagCode: string;
  description: string;
  image: HomeScreenImage;
}

export interface HomeFeaturedAdventure {
  id: string;
  title: string;
  location: string;
  type: string;
  description: string;
  comingSoon: boolean;
  image: HomeScreenImage;
}

export interface HomeCommunityCtaData {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  label: string;
}

export interface ResolvedHomeScreenData {
  hero: HomeScreenHeroData;
  featuredDestinations: HomeFeaturedDestination[];
  featuredAdventures: HomeFeaturedAdventure[];
  communityCta: HomeCommunityCtaData;
  metadata: {
    source: 'localFallback';
    hasRemoteData: false;
  };
}

const featuredDestinations: HomeFeaturedDestination[] = [
  {
    slug: 'espana',
    name: 'España',
    flagCode: 'ES',
    description: 'Desde pueblos medievales hasta costas atlánticas. Historia, gastronomía y rutas para todos los gustos.',
    image: {
      url: spainImage,
      alt: 'Ronda, Andalucía',
      kind: 'pais',
    },
  },
  {
    slug: 'mexico',
    name: 'México',
    flagCode: 'MX',
    description: 'Cultura milenaria, pueblos mágicos y una gastronomía reconocida en todo el mundo.',
    image: {
      url: mexicoImage,
      alt: 'Guanajuato',
      kind: 'pais',
    },
  },
  {
    slug: 'italia',
    name: 'Italia',
    flagCode: 'IT',
    description: 'Arte, historia y paisajes que han inspirado a viajeros durante siglos.',
    image: {
      url: italyImage,
      alt: "Val d'Orcia, Toscana",
      kind: 'pais',
    },
  },
  {
    slug: 'india',
    name: 'India',
    flagCode: 'IN',
    description: 'Un continente de contrastes donde cada región ofrece una experiencia única.',
    image: {
      url: indiaImage,
      alt: 'Taj Mahal, Agra',
      kind: 'monumento',
    },
  },
];

const featuredAdventures: HomeFeaturedAdventure[] = [
  {
    id: '1',
    title: 'Ruta por el encanto medieval de Albarracín',
    location: 'Albarracín, Teruel, España',
    type: 'Cultura y naturaleza',
    description: 'Camina entre murallas rojizas, callejuelas empedradas y miradores que convierten este rincón de Teruel en una escapada inolvidable.',
    comingSoon: false,
    image: {
      url: albarracinImage,
      alt: 'Albarracín, Teruel, España',
      kind: 'ciudad',
    },
  },
  {
    id: '2',
    title: 'Escapada por la Costa Amalfitana',
    location: 'Costa Amalfitana, Italia',
    type: 'Aventura costera',
    description: 'Pueblos suspendidos sobre el Mediterráneo, carreteras panorámicas, limoneros y atardeceres que hacen que cada parada parezca una postal.',
    comingSoon: true,
    image: {
      url: amalfitanaImage,
      alt: 'Costa Amalfitana, Italia',
      kind: 'paisaje',
    },
  },
  {
    id: '3',
    title: 'Palacios, templos y bazares de Rajasthan',
    location: 'Rajasthan, India',
    type: 'Viaje cultural',
    description: 'Una ruta llena de color entre fortalezas, mercados vibrantes, arquitectura majestuosa y tradiciones que muestran la India más fascinante.',
    comingSoon: true,
    image: {
      url: rajasthanImage,
      alt: 'Rajasthan, India',
      kind: 'monumento',
    },
  },
];

export function getResolvedHomeScreenData(mode: ScreenExperienceMode): ResolvedHomeScreenData {
  return {
    hero: {
      wallpaperImageUrl: heroImage,
      logoImageUrl: heroLogo,
      logoAlt: 'Trawel',
      titleLines: {
        first: 'El mundo no empieza',
        second: 'en una lista.',
        accent: 'Empieza en un mapa.',
      },
      subtitle:
        mode === 'student'
          ? 'Descubre el mundo a través de su historia, cultura y contexto. Una forma diferente de viajar antes de emprender el camino.'
          : 'Explora países, descubre rutas y transforma cada destino en una aventura real. Historias vividas, planes detallados.',
      primaryCta: {
        href: '#atlas-mundial',
        label: 'Abrir el atlas',
        icon: '🗺️',
      },
      secondaryCta: {
        href: '#destinos',
        label: 'Explorar destinos',
      },
    },
    featuredDestinations,
    featuredAdventures,
    communityCta: {
      eyebrow: 'Comunidad',
      title: '¿Tienes una experiencia que contar?',
      description:
        'Comparte tu aventura con la comunidad Trawel. Todas las historias se revisan antes de publicarse.',
      href: '/compartir',
      label: 'Compartir mi aventura',
    },
    metadata: {
      source: 'localFallback',
      hasRemoteData: false,
    },
  };
}
