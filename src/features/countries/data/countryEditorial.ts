/**
 * Contenido editorial por país y modo de experiencia
 * 
 * Propósito: Proveer contenido enriquecido diferenciado por modo (aventura/estudiante)
 * para los países principales de Trawel.
 * 
 * Alcance: 
 * - Contenido editorial base para México, España, Italia y Rusia
 * - Dos versiones por país: adventure y student
 * - Estructura preparada para ser rellenada por Investighost en el futuro
 * 
 * Estructura del contenido:
 * - headline: frase principal evocadora
 * - intro: párrafo introductorio con alma
 * - whatMakesSpecial: "qué hace especial este país"
 * - explorationIdeas: 3-4 bullets/ideas de exploración
 * - suggestedRoute: ruta sugerida corta
 * - quickTip: consejo rápido final
 * 
 * NOTA: Este archivo NO contiene lógica de negocio, solo datos editoriales.
 * No toca mapas, D3, Supabase ni navegación.
 */

export type ExperienceMode = 'adventure' | 'student';

export interface CountryEditorialContent {
  /** Frase principal evocadora */
  headline: string;
  /** Párrafo introductorio con alma */
  intro: string;
  /** Qué hace especial este país */
  whatMakesSpecial: string;
  /** 3-4 ideas de exploración (bullets) */
  explorationIdeas: string[];
  /** Ruta sugerida corta */
  suggestedRoute: string;
  /** Consejo rápido final */
  quickTip: string;
}

export type CountryEditorialData = Record<ExperienceMode, CountryEditorialContent>;

/**
 * Contenido editorial por país
 * 
 * Slugs usados (deben coincidir con worldCountries.ts):
 * - mexico
 * - espana  
 * - italia
 * - rusia
 */
export const countryEditorial: Record<string, CountryEditorialData> = {
  // ============================================================================
  // MÉXICO
  // ============================================================================
  mexico: {
    // Modo Aventura
    adventure: {
      headline: 'México no se recorre de una sola vez: se descubre región a región.',
      intro: 'México es un país vivo, lleno de contrastes que se revelan poco a poco. Pirámides que emergen de la selva, mercados donde los colores y los olores crean un mapa sensorial, pueblos que parecen detenidos en el tiempo, y costas que cambian de personalidad cada pocos kilómetros.',
      whatMakesSpecial: 'Lo que hace único a México es la superposición de capas: ruinas prehispánicas bajo ciudades coloniales, tradiciones indígenas que resisten en pleno siglo XXI, y una gastronomía tan diversa que cambia radicalmente de un estado a otro. No es un destino para "ver" cosas: es para dejarse llevar por la corriente de sus regiones.',
      explorationIdeas: [
        'Recorrer las pirámides de Teotihuacán al amanecer, cuando la luz dorada transforma la Ciudad de los Dioses',
        'Perderse en los mercados de Oaxaca probando mole en sus siete variedades tradicionales',
        'Descubrir pueblos mágicos donde el tiempo parece haberse detenido en sus plazas porticadas',
        'Navegar entre las costas del Pacífico y el Caribe, cada una con su propia identidad'
      ],
      suggestedRoute: 'Ciudad de México → Teotihuacán → Puebla/Oaxaca → Jalisco o Yucatán según lo que busques: arquitectura colonial, gastronomía ancestral o playas vírgenes.',
      quickTip: 'No intentes abarcarlo todo. México se disfruta eligiendo una región y dejándote sorprender por lo que encuentres entre destino y destino.'
    },
    // Modo Estudiante
    student: {
      headline: 'México es un cruce de civilizaciones que puedes leer en su paisaje.',
      intro: 'Entender México requiere mirar sus capas históricas. Es uno de los pocos lugares del mundo donde conviven con tanta intensidad vestigios de grandes civilizaciones prehispánicas, ciudades coloniales que fueron metrópolis del Imperio español, y una sociedad contemporánea en constante diálogo con su pasado.',
      whatMakesSpecial: 'México ofrece un laboratorio vivo para estudiar la transculturación: cómo el encuentro entre mundos generó algo nuevo. Su geografía —montañas, valles, costas, desiertos— ha moldeado regiones culturalmente distintas dentro de un mismo país.',
      explorationIdeas: [
        'Observar la superposición arquitectónica: templos mayas o aztecas, iglesias coloniales, y arquitectura moderna en la misma ciudad',
        'Comparar cómo la misma lengua española adquiere matices distintos en cada región, reflejando historias diferentes',
        'Estudiar el sistema de milpas y chinampas como ingeniería agrícola prehispánica aún vigente',
        'Analizar el papel de México como puente cultural entre Norteamérica y Latinoamérica'
      ],
      suggestedRoute: 'Comienza en la Ciudad de México (Museo de Antropología, Templo Mayor) para entender las raíces. Luego elige una región para profundizar: Oaxaca (diversidad indígena), Puebla (barroco novohispano), o Yucatán (civilización maya).',
      quickTip: 'Lleva un cuaderno de campo. Los contrastes que verás —temporales, culturales, sociales— merecen ser anotados y reflexionados sobre la marcha.'
    }
  },

  // ============================================================================
  // ESPAÑA
  // ============================================================================
  espana: {
    // Modo Aventura
    adventure: {
      headline: 'España cambia de voz en cada región.',
      intro: 'España no se agota en sus ciudades más famosas. Es un territorio de pueblos medievales sobre colinas, costas que van del Mediterráneo al Atlántico, montañas que guardan valles secretos, y plazas donde la vida sigue un ritmo que no tiene prisa.',
      whatMakesSpecial: 'Lo que distingue a España es su pluralidad. Cada región tiene su propia personalidad, su gastronomía, sus tradiciones. Un viaje por España es una sucesión de pequeñas revelaciones: un pueblo que nadie menciona, una playa escondida, una tapa inesperada.',
      explorationIdeas: [
        'Recorrer los pueblos medievales de Castilla y Aragón, donde el tiempo parece haberse detenido en sus murallas',
        'Descubrir la costa mediterránea y la atlántica, dos formas distintas de entender el mar',
        'Caminar por montañas verdes del norte y paisajes áridos del sur en la misma semana',
        'Sumergirse en las fiestas locales, donde cada pueblo celebra algo que solo tiene sentido ahí'
      ],
      suggestedRoute: 'Madrid → Castilla/Aragón (pueblos históricos) → Mediterráneo (costa y ciudades antiguas) → Andalucía o norte verde según prefieras calor o montaña.',
      quickTip: 'Sal de las ciudades grandes. Los mejores momentos de España suelen estar en pueblos de menos de 10.000 habitantes.'
    },
    // Modo Estudiante
    student: {
      headline: 'España es un mosaico donde cada pieza tiene su propia historia.',
      intro: 'Comprender España requiere entender su diversidad territorial. Es uno de los pocos países europeos donde conviven varias lenguas cooficiales, donde el legado romano se mezcla con el islámico y el medieval cristiano, y donde cada región ha desarrollado identidades culturales distintas dentro de un marco compartido.',
      whatMakesSpecial: 'España ofrece un caso de estudio único sobre la construcción de identidades regionales y nacionales. Su geografía fragmentada —montañas que aíslan valles, costas que comunican— ha generado una pluralidad cultural que desafía cualquier definición monolítica.',
      explorationIdeas: [
        'Comparar el legado romano, islámico y cristiano-medieval en ciudades como Toledo, Córdoba o Santiago',
        'Observar cómo la misma lengua evolucionó de formas distintas en regiones aisladas geográficamente',
        'Estudiar el sistema de comarcas y provincias como organización territorial histórica',
        'Analizar la arquitectura popular versus la monumental en diferentes regiones'
      ],
      suggestedRoute: 'Madrid (museos y contexto nacional) → Toledo (tres culturas) → una región periférica para entender la pluralidad: Galicia, Cataluña, País Vasco o Andalucía.',
      quickTip: 'Presta atención a los topónimos. Los nombres de pueblos y calles son un registro histórico escrito en el paisaje.'
    }
  },

  // ============================================================================
  // ITALIA
  // ============================================================================
  italia: {
    // Modo Aventura
    adventure: {
      headline: 'Italia se disfruta mejor cuando bajas el ritmo.',
      intro: 'Italia es un viaje que exige tiempo. No se trata de acumular monumentos, sino de dejarse seducir por la luz de la Toscana al atardecer, por el murmullo de una plaza cualquiera, por la piedra antigua que parece respirar historia en cada rincón.',
      whatMakesSpecial: 'Lo que hace especial a Italia es la densidad de capas históricas conviviendo con la vida cotidiana. Una misma plaza puede tener ruinas romanas, una iglesia renacentista, y una cafetería donde la gente del barrio toma su espresso. Es un país donde el arte no está en museos: está en la calle.',
      explorationIdeas: [
        'Perderse en las ciudades de arte sin ruta fija, dejando que la arquitectura guíe el camino',
        'Recorrer la Toscana despacio, entre viñedos y pueblos de piedra dorada',
        'Descubrir la costa, ya sea los acantilados de Cinque Terre o los pueblos colgados de la Amalfitana',
        'Seguir el ritmo local: largas comidas, paseos al atardecer, conversaciones sin prisa'
      ],
      suggestedRoute: 'Roma (para entender las raíces) → Florencia/Toscana (paisaje y Renacimiento) → Cinque Terre o Costa Amalfitana (mar y pueblos) → Venecia o Milán según interés.',
      quickTip: 'Reserva tiempo para "no hacer nada". Las mejores experiencias de Italia suelen surgir sentado en una plaza viendo pasar la vida.'
    },
    // Modo Estudiante
    student: {
      headline: 'Italia es un laboratorio de historia europea escrito en piedra.',
      intro: 'Ningún otro país concentra tantas capas de la historia occidental en tan poco espacio. Desde la Roma republicana hasta el Renacimiento, pasando por las ciudades-estado medievales, Italia permite estudiar procesos históricos concretos mientras se camina entre sus vestigios.',
      whatMakesSpecial: 'Italia ofrece la posibilidad de observar la evolución del arte, la arquitectura y el urbanismo a lo largo de dos milenios en un territorio relativamente compacto. Las mismas ciudades han sido escenario de transformaciones sucesivas que se pueden leer en sus edificios y trazados urbanos.',
      explorationIdeas: [
        'Comparar la Roma republicana, imperial y cristiana en el mismo recorrido urbano',
        'Estudiar el Renacimiento como movimiento cultural que transformó ciudades enteras',
        'Analizar el sistema de ciudades-estado medievales y su legado en el urbanismo actual',
        'Observar la relación entre paisaje natural y paisaje cultural: desde la Toscana agrícola hasta los jardines formales'
      ],
      suggestedRoute: 'Roma (raíces clásicas) → Florencia (cuna del Renacimiento) → una ciudad de las "tres Venecias" (la original, Verona, o Padua) para entender la Italia medieval y comercial.',
      quickTip: 'Lleva un mapa histórico de cada ciudad superpuesto al actual. Verás cómo los trazados romanos o medievales determinan el urbanismo contemporáneo.'
    }
  },

  // ============================================================================
  // RUSIA
  // ============================================================================
  rusia: {
    // Modo Aventura
    adventure: {
      headline: 'Rusia es un mapa enorme donde la distancia también forma parte del viaje.',
      intro: 'Rusia desafía la escala. Es un territorio tan vasto que el viaje se convierte en parte de la experiencia: noches enteras en trenes que atraviesan bosques infinitos, ciudades donde la arquitectura parece competir por el cielo, y la sensación de estar en un lugar donde la geografía impone sus propias reglas.',
      whatMakesSpecial: 'Lo que hace único a Rusia es su inmensidad y su complejidad cultural. Es el espacio donde la literatura del siglo XIX cobra vida en sus ciudades, donde la historia de los imperios se lee en sus palacios y catedrales, y donde la naturaleza —bosques, ríos, la tundra— sigue siendo protagonista.',
      explorationIdeas: [
        'Recorrer Moscú y San Petersburgo, dos capitales que representan visiones distintas de Rusia',
        'Experimentar un viaje largo en tren, donde el tiempo y el espacio se redefinen',
        'Descubrir la arquitectura: desde el Kremlin hasta las iglesias de cebolla, pasando por el art nouveau',
        'Sentir la dimensión del invierno ruso, cuando la nieve transforma el paisaje y la luz'
      ],
      suggestedRoute: 'Moscú → San Petersburgo → ruta ferroviaria hacia el este (hasta donde el tiempo permita) o exploración de la Óblast de Leningrado. Cada kilómetro cuenta una historia distinta.',
      quickTip: 'Acepta la escala. Rusia no se "ve" en un viaje corto: elige profundizar en un par de lugares en lugar de intentar abarcar lo imposible.'
    },
    // Modo Estudiante
    student: {
      headline: 'Rusia es un territorio donde la geografía ha modelado la historia.',
      intro: 'Entender Rusia requiere entender su dimensión. Es el país más grande del mundo, una realidad que ha determinado su historia, su literatura, su política y su identidad. Desde las estepas que permitieron las invasiones mongolas hasta los bosques que protegieron ciudades, la geografía es clave.',
      whatMakesSpecial: 'Rusia ofrece un caso de estudio único sobre la relación entre espacio e identidad nacional. Su literatura del siglo XIX, su arte, su arquitectura, todo está marcado por la conciencia de vivir en un imperio vasto y diverso, en constante tensión entre Europa y Asia, entre el centro y la periferia.',
      explorationIdeas: [
        'Estudiar la arquitectura como expresión de poder: desde las catedrales ortodoxas hasta el urbanismo soviético',
        'Analizar la función de San Petersburgo como "ventana a Europa" y su contraste con Moscú',
        'Observar la geografía rusa: ríos como vías de comunicación, bosques como fronteras naturales, el papel del invierno en la historia militar',
        'Reflexionar sobre la literatura rusa como respuesta a la inmensidad del territorio y las cuestiones existenciales que genera'
      ],
      suggestedRoute: 'Moscú (Kremlin, museos) → San Petersburgo (Hermitage, centro histórico) → una excursión a las ciudades históricas cercanas para ver la Rusia previa a las capitales imperiales.',
      quickTip: 'Lee algo de literatura rusa antes o durante el viaje. Tolstói, Dostoievski o Chéjov cobran dimensiones nuevas cuando estás en el territorio que describieron.'
    }
  }
};

/**
 * Obtiene el contenido editorial para un país y modo específicos
 * 
 * @param slug - Slug del país (ej: 'mexico', 'espana')
 * @param mode - Modo de experiencia: 'adventure' | 'student'
 * @returns CountryEditorialContent | undefined
 */
export function getCountryEditorial(
  slug: string,
  mode: ExperienceMode
): CountryEditorialContent | undefined {
  const normalizedSlug = slug.toLowerCase();
  const countryData = countryEditorial[normalizedSlug];
  
  if (!countryData) {
    return undefined;
  }
  
  return countryData[mode];
}

/**
 * Verifica si un país tiene contenido editorial disponible
 * 
 * @param slug - Slug del país
 * @returns boolean
 */
export function hasCountryEditorial(slug: string): boolean {
  return slug.toLowerCase() in countryEditorial;
}

/**
 * Lista todos los países con contenido editorial disponible
 * 
 * @returns string[] - Array de slugs
 */
export function getCountriesWithEditorial(): string[] {
  return Object.keys(countryEditorial);
}