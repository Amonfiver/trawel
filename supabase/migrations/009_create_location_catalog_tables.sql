/**
 * Migracion 009: Catalogo propio de localizaciones
 *
 * Proposito:
 * Crear un catalogo separado para formularios publicos y revision editorial:
 * - location_countries: paises seleccionables.
 * - location_cities: ciudades/zonas seleccionables por pais.
 *
 * Alcance:
 * - No sustituye ni contamina countries/cities actuales, que siguen alimentando
 *   paginas publicas de Trawel.
 * - No publica contenido automaticamente.
 * - Investighost/admin podra enriquecer este catalogo de forma progresiva.
 */

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS location_countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_es TEXT NOT NULL,
    name_en TEXT,
    slug TEXT NOT NULL UNIQUE,
    iso2 TEXT NOT NULL UNIQUE,
    iso3 TEXT,
    continent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    has_public_content BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT location_countries_slug_format_check
        CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT location_countries_iso2_format_check
        CHECK (iso2 ~ '^[A-Z]{2}$'),
    CONSTRAINT location_countries_iso3_format_check
        CHECK (iso3 IS NULL OR iso3 ~ '^[A-Z]{3}$'),
    CONSTRAINT location_countries_required_text_check
        CHECK (length(trim(name_es)) BETWEEN 1 AND 160)
);

CREATE TABLE IF NOT EXISTS location_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID REFERENCES location_countries(id) ON DELETE CASCADE,
    country_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    region TEXT,
    admin_area TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    population INTEGER,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT location_cities_country_slug_format_check
        CHECK (country_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT location_cities_slug_format_check
        CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT location_cities_status_check
        CHECK (status IN ('active', 'inactive', 'pending_review', 'archived')),
    CONSTRAINT location_cities_required_text_check
        CHECK (length(trim(name)) BETWEEN 1 AND 180),
    CONSTRAINT location_cities_population_check
        CHECK (population IS NULL OR population >= 0),
    CONSTRAINT location_cities_country_slug_slug_unique UNIQUE (country_slug, slug)
);

CREATE INDEX IF NOT EXISTS idx_location_countries_slug
ON location_countries(slug);

CREATE INDEX IF NOT EXISTS idx_location_countries_iso2
ON location_countries(iso2);

CREATE INDEX IF NOT EXISTS idx_location_countries_is_active
ON location_countries(is_active);

CREATE INDEX IF NOT EXISTS idx_location_cities_country_slug
ON location_cities(country_slug);

CREATE INDEX IF NOT EXISTS idx_location_cities_status
ON location_cities(status);

CREATE INDEX IF NOT EXISTS idx_location_cities_country_slug_slug
ON location_cities(country_slug, slug);

DROP TRIGGER IF EXISTS update_location_countries_updated_at ON location_countries;
CREATE TRIGGER update_location_countries_updated_at
BEFORE UPDATE ON location_countries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_location_cities_updated_at ON location_cities;
CREATE TRIGGER update_location_cities_updated_at
BEFORE UPDATE ON location_cities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE location_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_cities ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON location_countries TO anon, authenticated;
GRANT SELECT ON location_cities TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON location_countries FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON location_cities FROM anon, authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'location_countries'
          AND policyname = 'Allow public active location countries read'
    ) THEN
        CREATE POLICY "Allow public active location countries read"
        ON location_countries
        FOR SELECT
        TO anon, authenticated
        USING (is_active = TRUE);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'location_cities'
          AND policyname = 'Allow public active location cities read'
    ) THEN
        CREATE POLICY "Allow public active location cities read"
        ON location_cities
        FOR SELECT
        TO anon, authenticated
        USING (status = 'active');
    END IF;
END $$;

INSERT INTO location_countries (
    name_es,
    name_en,
    slug,
    iso2,
    iso3,
    continent,
    is_active,
    has_public_content
) VALUES
    ('Afganistan', 'Afghanistan', 'afganistan', 'AF', 'AFG', 'Asia', TRUE, FALSE),
    ('Albania', 'Albania', 'albania', 'AL', 'ALB', 'Europe', TRUE, FALSE),
    ('Alemania', 'Germany', 'alemania', 'DE', 'DEU', 'Europe', TRUE, FALSE),
    ('Andorra', 'Andorra', 'andorra', 'AD', 'AND', 'Europe', TRUE, FALSE),
    ('Angola', 'Angola', 'angola', 'AO', 'AGO', 'Africa', TRUE, FALSE),
    ('Antigua y Barbuda', 'Antigua and Barbuda', 'antigua-y-barbuda', 'AG', 'ATG', 'North America', TRUE, FALSE),
    ('Arabia Saudi', 'Saudi Arabia', 'arabia-saudi', 'SA', 'SAU', 'Asia', TRUE, FALSE),
    ('Argelia', 'Algeria', 'argelia', 'DZ', 'DZA', 'Africa', TRUE, FALSE),
    ('Argentina', 'Argentina', 'argentina', 'AR', 'ARG', 'South America', TRUE, FALSE),
    ('Armenia', 'Armenia', 'armenia', 'AM', 'ARM', 'Asia', TRUE, FALSE),
    ('Australia', 'Australia', 'australia', 'AU', 'AUS', 'Oceania', TRUE, FALSE),
    ('Austria', 'Austria', 'austria', 'AT', 'AUT', 'Europe', TRUE, FALSE),
    ('Azerbaiyan', 'Azerbaijan', 'azerbaiyan', 'AZ', 'AZE', 'Asia', TRUE, FALSE),
    ('Bahamas', 'Bahamas', 'bahamas', 'BS', 'BHS', 'North America', TRUE, FALSE),
    ('Banglades', 'Bangladesh', 'banglades', 'BD', 'BGD', 'Asia', TRUE, FALSE),
    ('Barbados', 'Barbados', 'barbados', 'BB', 'BRB', 'North America', TRUE, FALSE),
    ('Barein', 'Bahrain', 'barein', 'BH', 'BHR', 'Asia', TRUE, FALSE),
    ('Belgica', 'Belgium', 'belgica', 'BE', 'BEL', 'Europe', TRUE, FALSE),
    ('Belice', 'Belize', 'belice', 'BZ', 'BLZ', 'North America', TRUE, FALSE),
    ('Benin', 'Benin', 'benin', 'BJ', 'BEN', 'Africa', TRUE, FALSE),
    ('Bielorrusia', 'Belarus', 'bielorrusia', 'BY', 'BLR', 'Europe', TRUE, FALSE),
    ('Bolivia', 'Bolivia', 'bolivia', 'BO', 'BOL', 'South America', TRUE, FALSE),
    ('Bosnia y Herzegovina', 'Bosnia and Herzegovina', 'bosnia-y-herzegovina', 'BA', 'BIH', 'Europe', TRUE, FALSE),
    ('Botsuana', 'Botswana', 'botsuana', 'BW', 'BWA', 'Africa', TRUE, FALSE),
    ('Brasil', 'Brazil', 'brasil', 'BR', 'BRA', 'South America', TRUE, FALSE),
    ('Brunei', 'Brunei', 'brunei', 'BN', 'BRN', 'Asia', TRUE, FALSE),
    ('Bulgaria', 'Bulgaria', 'bulgaria', 'BG', 'BGR', 'Europe', TRUE, FALSE),
    ('Burkina Faso', 'Burkina Faso', 'burkina-faso', 'BF', 'BFA', 'Africa', TRUE, FALSE),
    ('Burundi', 'Burundi', 'burundi', 'BI', 'BDI', 'Africa', TRUE, FALSE),
    ('Butan', 'Bhutan', 'butan', 'BT', 'BTN', 'Asia', TRUE, FALSE),
    ('Cabo Verde', 'Cape Verde', 'cabo-verde', 'CV', 'CPV', 'Africa', TRUE, FALSE),
    ('Camboya', 'Cambodia', 'camboya', 'KH', 'KHM', 'Asia', TRUE, FALSE),
    ('Camerun', 'Cameroon', 'camerun', 'CM', 'CMR', 'Africa', TRUE, FALSE),
    ('Canada', 'Canada', 'canada', 'CA', 'CAN', 'North America', TRUE, FALSE),
    ('Catar', 'Qatar', 'catar', 'QA', 'QAT', 'Asia', TRUE, FALSE),
    ('Chad', 'Chad', 'chad', 'TD', 'TCD', 'Africa', TRUE, FALSE),
    ('Chile', 'Chile', 'chile', 'CL', 'CHL', 'South America', TRUE, FALSE),
    ('China', 'China', 'china', 'CN', 'CHN', 'Asia', TRUE, FALSE),
    ('Chipre', 'Cyprus', 'chipre', 'CY', 'CYP', 'Europe', TRUE, FALSE),
    ('Colombia', 'Colombia', 'colombia', 'CO', 'COL', 'South America', TRUE, FALSE),
    ('Comoras', 'Comoros', 'comoras', 'KM', 'COM', 'Africa', TRUE, FALSE),
    ('Congo', 'Congo', 'congo', 'CG', 'COG', 'Africa', TRUE, FALSE),
    ('Corea del Norte', 'North Korea', 'corea-del-norte', 'KP', 'PRK', 'Asia', TRUE, FALSE),
    ('Corea del Sur', 'South Korea', 'corea-del-sur', 'KR', 'KOR', 'Asia', TRUE, FALSE),
    ('Costa de Marfil', 'Ivory Coast', 'costa-de-marfil', 'CI', 'CIV', 'Africa', TRUE, FALSE),
    ('Costa Rica', 'Costa Rica', 'costa-rica', 'CR', 'CRI', 'North America', TRUE, FALSE),
    ('Croacia', 'Croatia', 'croacia', 'HR', 'HRV', 'Europe', TRUE, FALSE),
    ('Cuba', 'Cuba', 'cuba', 'CU', 'CUB', 'North America', TRUE, FALSE),
    ('Dinamarca', 'Denmark', 'dinamarca', 'DK', 'DNK', 'Europe', TRUE, FALSE),
    ('Dominica', 'Dominica', 'dominica', 'DM', 'DMA', 'North America', TRUE, FALSE),
    ('Ecuador', 'Ecuador', 'ecuador', 'EC', 'ECU', 'South America', TRUE, FALSE),
    ('Egipto', 'Egypt', 'egipto', 'EG', 'EGY', 'Africa', TRUE, FALSE),
    ('El Salvador', 'El Salvador', 'el-salvador', 'SV', 'SLV', 'North America', TRUE, FALSE),
    ('Emiratos Arabes Unidos', 'United Arab Emirates', 'emiratos-arabes-unidos', 'AE', 'ARE', 'Asia', TRUE, FALSE),
    ('Eritrea', 'Eritrea', 'eritrea', 'ER', 'ERI', 'Africa', TRUE, FALSE),
    ('Eslovaquia', 'Slovakia', 'eslovaquia', 'SK', 'SVK', 'Europe', TRUE, FALSE),
    ('Eslovenia', 'Slovenia', 'eslovenia', 'SI', 'SVN', 'Europe', TRUE, FALSE),
    ('Espana', 'Spain', 'espana', 'ES', 'ESP', 'Europe', TRUE, TRUE),
    ('Estados Unidos', 'United States', 'estados-unidos', 'US', 'USA', 'North America', TRUE, FALSE),
    ('Estonia', 'Estonia', 'estonia', 'EE', 'EST', 'Europe', TRUE, FALSE),
    ('Esuatini', 'Eswatini', 'esuatini', 'SZ', 'SWZ', 'Africa', TRUE, FALSE),
    ('Etiopia', 'Ethiopia', 'etiopia', 'ET', 'ETH', 'Africa', TRUE, FALSE),
    ('Filipinas', 'Philippines', 'filipinas', 'PH', 'PHL', 'Asia', TRUE, FALSE),
    ('Finlandia', 'Finland', 'finlandia', 'FI', 'FIN', 'Europe', TRUE, FALSE),
    ('Fiyi', 'Fiji', 'fiyi', 'FJ', 'FJI', 'Oceania', TRUE, FALSE),
    ('Francia', 'France', 'francia', 'FR', 'FRA', 'Europe', TRUE, FALSE),
    ('Gabon', 'Gabon', 'gabon', 'GA', 'GAB', 'Africa', TRUE, FALSE),
    ('Gambia', 'Gambia', 'gambia', 'GM', 'GMB', 'Africa', TRUE, FALSE),
    ('Georgia', 'Georgia', 'georgia', 'GE', 'GEO', 'Asia', TRUE, FALSE),
    ('Ghana', 'Ghana', 'ghana', 'GH', 'GHA', 'Africa', TRUE, FALSE),
    ('Granada', 'Grenada', 'granada', 'GD', 'GRD', 'North America', TRUE, FALSE),
    ('Grecia', 'Greece', 'grecia', 'GR', 'GRC', 'Europe', TRUE, FALSE),
    ('Guatemala', 'Guatemala', 'guatemala', 'GT', 'GTM', 'North America', TRUE, FALSE),
    ('Guinea', 'Guinea', 'guinea', 'GN', 'GIN', 'Africa', TRUE, FALSE),
    ('Guinea-Bisau', 'Guinea-Bissau', 'guinea-bisau', 'GW', 'GNB', 'Africa', TRUE, FALSE),
    ('Guinea Ecuatorial', 'Equatorial Guinea', 'guinea-ecuatorial', 'GQ', 'GNQ', 'Africa', TRUE, FALSE),
    ('Guyana', 'Guyana', 'guyana', 'GY', 'GUY', 'South America', TRUE, FALSE),
    ('Haiti', 'Haiti', 'haiti', 'HT', 'HTI', 'North America', TRUE, FALSE),
    ('Honduras', 'Honduras', 'honduras', 'HN', 'HND', 'North America', TRUE, FALSE),
    ('Hungria', 'Hungary', 'hungria', 'HU', 'HUN', 'Europe', TRUE, FALSE),
    ('India', 'India', 'india', 'IN', 'IND', 'Asia', TRUE, FALSE),
    ('Indonesia', 'Indonesia', 'indonesia', 'ID', 'IDN', 'Asia', TRUE, FALSE),
    ('Irak', 'Iraq', 'irak', 'IQ', 'IRQ', 'Asia', TRUE, FALSE),
    ('Iran', 'Iran', 'iran', 'IR', 'IRN', 'Asia', TRUE, FALSE),
    ('Irlanda', 'Ireland', 'irlanda', 'IE', 'IRL', 'Europe', TRUE, FALSE),
    ('Islandia', 'Iceland', 'islandia', 'IS', 'ISL', 'Europe', TRUE, FALSE),
    ('Islas Marshall', 'Marshall Islands', 'islas-marshall', 'MH', 'MHL', 'Oceania', TRUE, FALSE),
    ('Islas Salomon', 'Solomon Islands', 'islas-salomon', 'SB', 'SLB', 'Oceania', TRUE, FALSE),
    ('Israel', 'Israel', 'israel', 'IL', 'ISR', 'Asia', TRUE, FALSE),
    ('Italia', 'Italy', 'italia', 'IT', 'ITA', 'Europe', TRUE, FALSE),
    ('Jamaica', 'Jamaica', 'jamaica', 'JM', 'JAM', 'North America', TRUE, FALSE),
    ('Japon', 'Japan', 'japon', 'JP', 'JPN', 'Asia', TRUE, FALSE),
    ('Jordania', 'Jordan', 'jordania', 'JO', 'JOR', 'Asia', TRUE, FALSE),
    ('Kazajistan', 'Kazakhstan', 'kazajistan', 'KZ', 'KAZ', 'Asia', TRUE, FALSE),
    ('Kenia', 'Kenya', 'kenia', 'KE', 'KEN', 'Africa', TRUE, FALSE),
    ('Kirguistan', 'Kyrgyzstan', 'kirguistan', 'KG', 'KGZ', 'Asia', TRUE, FALSE),
    ('Kiribati', 'Kiribati', 'kiribati', 'KI', 'KIR', 'Oceania', TRUE, FALSE),
    ('Kosovo', 'Kosovo', 'kosovo', 'XK', 'XKX', 'Europe', TRUE, FALSE),
    ('Kuwait', 'Kuwait', 'kuwait', 'KW', 'KWT', 'Asia', TRUE, FALSE),
    ('Laos', 'Laos', 'laos', 'LA', 'LAO', 'Asia', TRUE, FALSE),
    ('Lesoto', 'Lesotho', 'lesoto', 'LS', 'LSO', 'Africa', TRUE, FALSE),
    ('Letonia', 'Latvia', 'letonia', 'LV', 'LVA', 'Europe', TRUE, FALSE),
    ('Libano', 'Lebanon', 'libano', 'LB', 'LBN', 'Asia', TRUE, FALSE),
    ('Liberia', 'Liberia', 'liberia', 'LR', 'LBR', 'Africa', TRUE, FALSE),
    ('Libia', 'Libya', 'libia', 'LY', 'LBY', 'Africa', TRUE, FALSE),
    ('Liechtenstein', 'Liechtenstein', 'liechtenstein', 'LI', 'LIE', 'Europe', TRUE, FALSE),
    ('Lituania', 'Lithuania', 'lituania', 'LT', 'LTU', 'Europe', TRUE, FALSE),
    ('Luxemburgo', 'Luxembourg', 'luxemburgo', 'LU', 'LUX', 'Europe', TRUE, FALSE),
    ('Macedonia del Norte', 'North Macedonia', 'macedonia-del-norte', 'MK', 'MKD', 'Europe', TRUE, FALSE),
    ('Madagascar', 'Madagascar', 'madagascar', 'MG', 'MDG', 'Africa', TRUE, FALSE),
    ('Malasia', 'Malaysia', 'malasia', 'MY', 'MYS', 'Asia', TRUE, FALSE),
    ('Malaui', 'Malawi', 'malaui', 'MW', 'MWI', 'Africa', TRUE, FALSE),
    ('Maldivas', 'Maldives', 'maldivas', 'MV', 'MDV', 'Asia', TRUE, FALSE),
    ('Mali', 'Mali', 'mali', 'ML', 'MLI', 'Africa', TRUE, FALSE),
    ('Malta', 'Malta', 'malta', 'MT', 'MLT', 'Europe', TRUE, FALSE),
    ('Marruecos', 'Morocco', 'marruecos', 'MA', 'MAR', 'Africa', TRUE, FALSE),
    ('Mauricio', 'Mauritius', 'mauricio', 'MU', 'MUS', 'Africa', TRUE, FALSE),
    ('Mauritania', 'Mauritania', 'mauritania', 'MR', 'MRT', 'Africa', TRUE, FALSE),
    ('Mexico', 'Mexico', 'mexico', 'MX', 'MEX', 'North America', TRUE, TRUE),
    ('Micronesia', 'Micronesia', 'micronesia', 'FM', 'FSM', 'Oceania', TRUE, FALSE),
    ('Moldavia', 'Moldova', 'moldavia', 'MD', 'MDA', 'Europe', TRUE, FALSE),
    ('Monaco', 'Monaco', 'monaco', 'MC', 'MCO', 'Europe', TRUE, FALSE),
    ('Mongolia', 'Mongolia', 'mongolia', 'MN', 'MNG', 'Asia', TRUE, FALSE),
    ('Montenegro', 'Montenegro', 'montenegro', 'ME', 'MNE', 'Europe', TRUE, FALSE),
    ('Mozambique', 'Mozambique', 'mozambique', 'MZ', 'MOZ', 'Africa', TRUE, FALSE),
    ('Myanmar', 'Myanmar', 'myanmar', 'MM', 'MMR', 'Asia', TRUE, FALSE),
    ('Namibia', 'Namibia', 'namibia', 'NA', 'NAM', 'Africa', TRUE, FALSE),
    ('Nauru', 'Nauru', 'nauru', 'NR', 'NRU', 'Oceania', TRUE, FALSE),
    ('Nepal', 'Nepal', 'nepal', 'NP', 'NPL', 'Asia', TRUE, FALSE),
    ('Nicaragua', 'Nicaragua', 'nicaragua', 'NI', 'NIC', 'North America', TRUE, FALSE),
    ('Niger', 'Niger', 'niger', 'NE', 'NER', 'Africa', TRUE, FALSE),
    ('Nigeria', 'Nigeria', 'nigeria', 'NG', 'NGA', 'Africa', TRUE, FALSE),
    ('Noruega', 'Norway', 'noruega', 'NO', 'NOR', 'Europe', TRUE, FALSE),
    ('Nueva Zelanda', 'New Zealand', 'nueva-zelanda', 'NZ', 'NZL', 'Oceania', TRUE, FALSE),
    ('Oman', 'Oman', 'oman', 'OM', 'OMN', 'Asia', TRUE, FALSE),
    ('Paises Bajos', 'Netherlands', 'paises-bajos', 'NL', 'NLD', 'Europe', TRUE, FALSE),
    ('Pakistan', 'Pakistan', 'pakistan', 'PK', 'PAK', 'Asia', TRUE, FALSE),
    ('Palaos', 'Palau', 'palaos', 'PW', 'PLW', 'Oceania', TRUE, FALSE),
    ('Palestina', 'Palestine', 'palestina', 'PS', 'PSE', 'Asia', TRUE, FALSE),
    ('Panama', 'Panama', 'panama', 'PA', 'PAN', 'North America', TRUE, FALSE),
    ('Papua Nueva Guinea', 'Papua New Guinea', 'papua-nueva-guinea', 'PG', 'PNG', 'Oceania', TRUE, FALSE),
    ('Paraguay', 'Paraguay', 'paraguay', 'PY', 'PRY', 'South America', TRUE, FALSE),
    ('Peru', 'Peru', 'peru', 'PE', 'PER', 'South America', TRUE, FALSE),
    ('Polonia', 'Poland', 'polonia', 'PL', 'POL', 'Europe', TRUE, FALSE),
    ('Portugal', 'Portugal', 'portugal', 'PT', 'PRT', 'Europe', TRUE, FALSE),
    ('Reino Unido', 'United Kingdom', 'reino-unido', 'GB', 'GBR', 'Europe', TRUE, FALSE),
    ('Republica Centroafricana', 'Central African Republic', 'republica-centroafricana', 'CF', 'CAF', 'Africa', TRUE, FALSE),
    ('Republica Checa', 'Czech Republic', 'republica-checa', 'CZ', 'CZE', 'Europe', TRUE, FALSE),
    ('Republica Democratica del Congo', 'Democratic Republic of the Congo', 'republica-democratica-del-congo', 'CD', 'COD', 'Africa', TRUE, FALSE),
    ('Republica Dominicana', 'Dominican Republic', 'republica-dominicana', 'DO', 'DOM', 'North America', TRUE, FALSE),
    ('Ruanda', 'Rwanda', 'ruanda', 'RW', 'RWA', 'Africa', TRUE, FALSE),
    ('Rumania', 'Romania', 'rumania', 'RO', 'ROU', 'Europe', TRUE, FALSE),
    ('Rusia', 'Russia', 'rusia', 'RU', 'RUS', 'Europe', TRUE, FALSE),
    ('Samoa', 'Samoa', 'samoa', 'WS', 'WSM', 'Oceania', TRUE, FALSE),
    ('San Cristobal y Nieves', 'Saint Kitts and Nevis', 'san-cristobal-y-nieves', 'KN', 'KNA', 'North America', TRUE, FALSE),
    ('San Marino', 'San Marino', 'san-marino', 'SM', 'SMR', 'Europe', TRUE, FALSE),
    ('San Vicente y las Granadinas', 'Saint Vincent and the Grenadines', 'san-vicente-y-las-granadinas', 'VC', 'VCT', 'North America', TRUE, FALSE),
    ('Santa Lucia', 'Saint Lucia', 'santa-lucia', 'LC', 'LCA', 'North America', TRUE, FALSE),
    ('Santo Tome y Principe', 'Sao Tome and Principe', 'santo-tome-y-principe', 'ST', 'STP', 'Africa', TRUE, FALSE),
    ('Senegal', 'Senegal', 'senegal', 'SN', 'SEN', 'Africa', TRUE, FALSE),
    ('Serbia', 'Serbia', 'serbia', 'RS', 'SRB', 'Europe', TRUE, FALSE),
    ('Seychelles', 'Seychelles', 'seychelles', 'SC', 'SYC', 'Africa', TRUE, FALSE),
    ('Sierra Leona', 'Sierra Leone', 'sierra-leona', 'SL', 'SLE', 'Africa', TRUE, FALSE),
    ('Singapur', 'Singapore', 'singapur', 'SG', 'SGP', 'Asia', TRUE, FALSE),
    ('Siria', 'Syria', 'siria', 'SY', 'SYR', 'Asia', TRUE, FALSE),
    ('Somalia', 'Somalia', 'somalia', 'SO', 'SOM', 'Africa', TRUE, FALSE),
    ('Sri Lanka', 'Sri Lanka', 'sri-lanka', 'LK', 'LKA', 'Asia', TRUE, FALSE),
    ('Sudafrica', 'South Africa', 'sudafrica', 'ZA', 'ZAF', 'Africa', TRUE, FALSE),
    ('Sudan', 'Sudan', 'sudan', 'SD', 'SDN', 'Africa', TRUE, FALSE),
    ('Sudan del Sur', 'South Sudan', 'sudan-del-sur', 'SS', 'SSD', 'Africa', TRUE, FALSE),
    ('Suecia', 'Sweden', 'suecia', 'SE', 'SWE', 'Europe', TRUE, FALSE),
    ('Suiza', 'Switzerland', 'suiza', 'CH', 'CHE', 'Europe', TRUE, FALSE),
    ('Surinam', 'Suriname', 'surinam', 'SR', 'SUR', 'South America', TRUE, FALSE),
    ('Tailandia', 'Thailand', 'tailandia', 'TH', 'THA', 'Asia', TRUE, FALSE),
    ('Taiwan', 'Taiwan', 'taiwan', 'TW', 'TWN', 'Asia', TRUE, FALSE),
    ('Tanzania', 'Tanzania', 'tanzania', 'TZ', 'TZA', 'Africa', TRUE, FALSE),
    ('Tayikistan', 'Tajikistan', 'tayikistan', 'TJ', 'TJK', 'Asia', TRUE, FALSE),
    ('Timor Oriental', 'Timor-Leste', 'timor-oriental', 'TL', 'TLS', 'Asia', TRUE, FALSE),
    ('Togo', 'Togo', 'togo', 'TG', 'TGO', 'Africa', TRUE, FALSE),
    ('Tonga', 'Tonga', 'tonga', 'TO', 'TON', 'Oceania', TRUE, FALSE),
    ('Trinidad y Tobago', 'Trinidad and Tobago', 'trinidad-y-tobago', 'TT', 'TTO', 'North America', TRUE, FALSE),
    ('Tunez', 'Tunisia', 'tunez', 'TN', 'TUN', 'Africa', TRUE, FALSE),
    ('Turkmenistan', 'Turkmenistan', 'turkmenistan', 'TM', 'TKM', 'Asia', TRUE, FALSE),
    ('Turquia', 'Turkey', 'turquia', 'TR', 'TUR', 'Asia', TRUE, FALSE),
    ('Tuvalu', 'Tuvalu', 'tuvalu', 'TV', 'TUV', 'Oceania', TRUE, FALSE),
    ('Ucrania', 'Ukraine', 'ucrania', 'UA', 'UKR', 'Europe', TRUE, FALSE),
    ('Uganda', 'Uganda', 'uganda', 'UG', 'UGA', 'Africa', TRUE, FALSE),
    ('Uruguay', 'Uruguay', 'uruguay', 'UY', 'URY', 'South America', TRUE, FALSE),
    ('Uzbekistan', 'Uzbekistan', 'uzbekistan', 'UZ', 'UZB', 'Asia', TRUE, FALSE),
    ('Vanuatu', 'Vanuatu', 'vanuatu', 'VU', 'VUT', 'Oceania', TRUE, FALSE),
    ('Vaticano', 'Vatican City', 'vaticano', 'VA', 'VAT', 'Europe', TRUE, FALSE),
    ('Venezuela', 'Venezuela', 'venezuela', 'VE', 'VEN', 'South America', TRUE, FALSE),
    ('Vietnam', 'Vietnam', 'vietnam', 'VN', 'VNM', 'Asia', TRUE, FALSE),
    ('Yemen', 'Yemen', 'yemen', 'YE', 'YEM', 'Asia', TRUE, FALSE),
    ('Yibuti', 'Djibouti', 'yibuti', 'DJ', 'DJI', 'Africa', TRUE, FALSE),
    ('Zambia', 'Zambia', 'zambia', 'ZM', 'ZMB', 'Africa', TRUE, FALSE),
    ('Zimbabue', 'Zimbabwe', 'zimbabue', 'ZW', 'ZWE', 'Africa', TRUE, FALSE)
ON CONFLICT (iso2) DO UPDATE SET
    name_es = EXCLUDED.name_es,
    name_en = EXCLUDED.name_en,
    slug = EXCLUDED.slug,
    iso3 = EXCLUDED.iso3,
    continent = EXCLUDED.continent,
    is_active = EXCLUDED.is_active,
    has_public_content = location_countries.has_public_content OR EXCLUDED.has_public_content,
    updated_at = NOW();

WITH city_seed(country_slug, name, slug, region) AS (
    VALUES
        ('espana', 'Madrid', 'madrid', 'Comunidad de Madrid'),
        ('espana', 'Barcelona', 'barcelona', 'Cataluna'),
        ('espana', 'Valencia', 'valencia', 'Comunidad Valenciana'),
        ('espana', 'Sevilla', 'sevilla', 'Andalucia'),
        ('espana', 'Zaragoza', 'zaragoza', 'Aragon'),
        ('espana', 'Malaga', 'malaga', 'Andalucia'),
        ('espana', 'Murcia', 'murcia', 'Region de Murcia'),
        ('espana', 'Palma', 'palma', 'Islas Baleares'),
        ('espana', 'Las Palmas de Gran Canaria', 'las-palmas-de-gran-canaria', 'Canarias'),
        ('espana', 'Bilbao', 'bilbao', 'Pais Vasco'),
        ('espana', 'Alicante', 'alicante', 'Comunidad Valenciana'),
        ('espana', 'Cordoba', 'cordoba', 'Andalucia'),
        ('espana', 'Valladolid', 'valladolid', 'Castilla y Leon'),
        ('espana', 'Vigo', 'vigo', 'Galicia'),
        ('espana', 'Gijon', 'gijon', 'Asturias'),
        ('espana', 'Castellon de la Plana', 'castellon-de-la-plana', 'Comunidad Valenciana'),
        ('espana', 'Granada', 'granada', 'Andalucia'),
        ('espana', 'A Coruna', 'a-coruna', 'Galicia'),
        ('espana', 'Santander', 'santander', 'Cantabria'),
        ('espana', 'Toledo', 'toledo', 'Castilla-La Mancha'),
        ('espana', 'Ronda', 'ronda', 'Andalucia'),
        ('espana', 'Albarracin', 'albarracin', 'Aragon'),
        ('mexico', 'Ciudad de Mexico', 'ciudad-de-mexico', 'Ciudad de Mexico'),
        ('mexico', 'Guadalajara', 'guadalajara', 'Jalisco'),
        ('mexico', 'Monterrey', 'monterrey', 'Nuevo Leon'),
        ('mexico', 'Puebla', 'puebla', 'Puebla'),
        ('mexico', 'Tijuana', 'tijuana', 'Baja California'),
        ('mexico', 'Leon', 'leon', 'Guanajuato'),
        ('mexico', 'Cancun', 'cancun', 'Quintana Roo'),
        ('mexico', 'Merida', 'merida', 'Yucatan'),
        ('mexico', 'Queretaro', 'queretaro', 'Queretaro'),
        ('mexico', 'Guanajuato', 'guanajuato', 'Guanajuato'),
        ('mexico', 'Oaxaca', 'oaxaca', 'Oaxaca'),
        ('mexico', 'San Miguel de Allende', 'san-miguel-de-allende', 'Guanajuato'),
        ('mexico', 'Playa del Carmen', 'playa-del-carmen', 'Quintana Roo'),
        ('mexico', 'Puerto Vallarta', 'puerto-vallarta', 'Jalisco'),
        ('italia', 'Roma', 'roma', 'Lazio'),
        ('italia', 'Milan', 'milan', 'Lombardia'),
        ('italia', 'Florencia', 'florencia', 'Toscana'),
        ('italia', 'Venecia', 'venecia', 'Veneto'),
        ('italia', 'Napoles', 'napoles', 'Campania'),
        ('italia', 'Turin', 'turin', 'Piamonte'),
        ('italia', 'Bolonia', 'bolonia', 'Emilia-Romana'),
        ('italia', 'Verona', 'verona', 'Veneto'),
        ('italia', 'Pisa', 'pisa', 'Toscana'),
        ('italia', 'Siena', 'siena', 'Toscana'),
        ('italia', 'Palermo', 'palermo', 'Sicilia'),
        ('india', 'Nueva Delhi', 'nueva-delhi', 'Delhi'),
        ('india', 'Mumbai', 'mumbai', 'Maharashtra'),
        ('india', 'Jaipur', 'jaipur', 'Rajastan'),
        ('india', 'Agra', 'agra', 'Uttar Pradesh'),
        ('india', 'Varanasi', 'varanasi', 'Uttar Pradesh'),
        ('india', 'Udaipur', 'udaipur', 'Rajastan'),
        ('india', 'Jodhpur', 'jodhpur', 'Rajastan'),
        ('india', 'Bangalore', 'bangalore', 'Karnataka'),
        ('india', 'Chennai', 'chennai', 'Tamil Nadu'),
        ('india', 'Kolkata', 'kolkata', 'Bengala Occidental')
)
INSERT INTO location_cities (
    country_id,
    country_slug,
    name,
    slug,
    region,
    source,
    status
)
SELECT
    location_countries.id,
    city_seed.country_slug,
    city_seed.name,
    city_seed.slug,
    city_seed.region,
    'initial_seed',
    'active'
FROM city_seed
JOIN location_countries ON location_countries.slug = city_seed.country_slug
ON CONFLICT (country_slug, slug) DO UPDATE SET
    country_id = EXCLUDED.country_id,
    name = EXCLUDED.name,
    region = EXCLUDED.region,
    source = EXCLUDED.source,
    status = EXCLUDED.status,
    updated_at = NOW();

COMMENT ON TABLE location_countries IS 'Catalogo publico-controlado de paises seleccionables para formularios y revision editorial; separado de countries de contenido publicado';
COMMENT ON TABLE location_cities IS 'Catalogo publico-controlado de ciudades o zonas seleccionables por pais para colaboraciones; separado de cities de contenido publicado';
COMMENT ON COLUMN location_countries.has_public_content IS 'Indica si el pais ya tiene contenido publico en Trawel; no controla por si solo la publicacion';
COMMENT ON COLUMN location_cities.source IS 'Origen de alta: initial_seed, investighost, import, manual_review u otro origen interno';
