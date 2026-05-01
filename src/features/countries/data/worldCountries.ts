/**
 * Diccionario completo de países del mundo
 * 
 * Propósito: Proveer datos mínimos de identificación para TODOS los países,
 * no solo los que tienen contenido editorial en Trawel.
 * 
 * Datos incluidos:
 * - unM49: Código numérico de la ONU (usado por world-atlas)
 * - isoAlpha2: Código ISO 3166-1 alpha-2 (para banderas)
 * - isoAlpha3: Código ISO 3166-1 alpha-3
 * - slug: Identificador URL-friendly
 * - displayName: Nombre para mostrar en español
 * 
 * NOTA: Este diccionario NO indica disponibilidad de contenido editorial.
 * Solo proporciona identificación. La disponibilidad de contenido se
 * consulta separadamente via travelData.service.
 */

export interface WorldCountry {
  unM49: string;
  isoAlpha2: string;
  isoAlpha3: string;
  slug: string;
  displayName: string;
}

export const worldCountries: Record<string, WorldCountry> = {
  // A
  '004': { unM49: '004', isoAlpha2: 'AF', isoAlpha3: 'AFG', slug: 'afganistan', displayName: 'Afganistán' },
  '008': { unM49: '008', isoAlpha2: 'AL', isoAlpha3: 'ALB', slug: 'albania', displayName: 'Albania' },
  '012': { unM49: '012', isoAlpha2: 'DZ', isoAlpha3: 'DZA', slug: 'argelia', displayName: 'Argelia' },
  '016': { unM49: '016', isoAlpha2: 'AS', isoAlpha3: 'ASM', slug: 'samoa-americana', displayName: 'Samoa Americana' },
  '020': { unM49: '020', isoAlpha2: 'AD', isoAlpha3: 'AND', slug: 'andorra', displayName: 'Andorra' },
  '024': { unM49: '024', isoAlpha2: 'AO', isoAlpha3: 'AGO', slug: 'angola', displayName: 'Angola' },
  '028': { unM49: '028', isoAlpha2: 'AG', isoAlpha3: 'ATG', slug: 'antigua-y-barbuda', displayName: 'Antigua y Barbuda' },
  '031': { unM49: '031', isoAlpha2: 'AZ', isoAlpha3: 'AZE', slug: 'azerbaiyan', displayName: 'Azerbaiyán' },
  '032': { unM49: '032', isoAlpha2: 'AR', isoAlpha3: 'ARG', slug: 'argentina', displayName: 'Argentina' },
  '036': { unM49: '036', isoAlpha2: 'AU', isoAlpha3: 'AUS', slug: 'australia', displayName: 'Australia' },
  '040': { unM49: '040', isoAlpha2: 'AT', isoAlpha3: 'AUT', slug: 'austria', displayName: 'Austria' },
  
  // B
  '044': { unM49: '044', isoAlpha2: 'BS', isoAlpha3: 'BHS', slug: 'bahamas', displayName: 'Bahamas' },
  '048': { unM49: '048', isoAlpha2: 'BH', isoAlpha3: 'BHR', slug: 'barein', displayName: 'Baréin' },
  '050': { unM49: '050', isoAlpha2: 'BD', isoAlpha3: 'BGD', slug: 'bangladesh', displayName: 'Bangladesh' },
  '051': { unM49: '051', isoAlpha2: 'AM', isoAlpha3: 'ARM', slug: 'armenia', displayName: 'Armenia' },
  '052': { unM49: '052', isoAlpha2: 'BB', isoAlpha3: 'BRB', slug: 'barbados', displayName: 'Barbados' },
  '056': { unM49: '056', isoAlpha2: 'BE', isoAlpha3: 'BEL', slug: 'belgica', displayName: 'Bélgica' },
  '060': { unM49: '060', isoAlpha2: 'BM', isoAlpha3: 'BMU', slug: 'bermudas', displayName: 'Bermudas' },
  '064': { unM49: '064', isoAlpha2: 'BT', isoAlpha3: 'BTN', slug: 'butan', displayName: 'Bután' },
  '068': { unM49: '068', isoAlpha2: 'BO', isoAlpha3: 'BOL', slug: 'bolivia', displayName: 'Bolivia' },
  '070': { unM49: '070', isoAlpha2: 'BA', isoAlpha3: 'BIH', slug: 'bosnia-y-herzegovina', displayName: 'Bosnia y Herzegovina' },
  '072': { unM49: '072', isoAlpha2: 'BW', isoAlpha3: 'BWA', slug: 'botsuana', displayName: 'Botsuana' },
  '074': { unM49: '074', isoAlpha2: 'BV', isoAlpha3: 'BVT', slug: 'isla-bouvet', displayName: 'Isla Bouvet' },
  '076': { unM49: '076', isoAlpha2: 'BR', isoAlpha3: 'BRA', slug: 'brasil', displayName: 'Brasil' },
  '084': { unM49: '084', isoAlpha2: 'BZ', isoAlpha3: 'BLZ', slug: 'belice', displayName: 'Belice' },
  '086': { unM49: '086', isoAlpha2: 'IO', isoAlpha3: 'IOT', slug: 'territorio-britanico-del-oceano-indico', displayName: 'Territorio Británico del Océano Índico' },
  '090': { unM49: '090', isoAlpha2: 'SB', isoAlpha3: 'SLB', slug: 'islas-salomon', displayName: 'Islas Salomón' },
  '092': { unM49: '092', isoAlpha2: 'VG', isoAlpha3: 'VGB', slug: 'islas-virgenes-britanicas', displayName: 'Islas Vírgenes Británicas' },
  '096': { unM49: '096', isoAlpha2: 'BN', isoAlpha3: 'BRN', slug: 'brunei', displayName: 'Brunéi' },
  '100': { unM49: '100', isoAlpha2: 'BG', isoAlpha3: 'BGR', slug: 'bulgaria', displayName: 'Bulgaria' },
  '104': { unM49: '104', isoAlpha2: 'MM', isoAlpha3: 'MMR', slug: 'birmania', displayName: 'Birmania' },
  '108': { unM49: '108', isoAlpha2: 'BI', isoAlpha3: 'BDI', slug: 'burundi', displayName: 'Burundi' },
  '112': { unM49: '112', isoAlpha2: 'BY', isoAlpha3: 'BLR', slug: 'bielorrusia', displayName: 'Bielorrusia' },
  '116': { unM49: '116', isoAlpha2: 'KH', isoAlpha3: 'KHM', slug: 'camboya', displayName: 'Camboya' },
  '120': { unM49: '120', isoAlpha2: 'CM', isoAlpha3: 'CMR', slug: 'camerun', displayName: 'Camerún' },
  '124': { unM49: '124', isoAlpha2: 'CA', isoAlpha3: 'CAN', slug: 'canada', displayName: 'Canadá' },
  '132': { unM49: '132', isoAlpha2: 'CV', isoAlpha3: 'CPV', slug: 'cabo-verde', displayName: 'Cabo Verde' },
  '136': { unM49: '136', isoAlpha2: 'KY', isoAlpha3: 'CYM', slug: 'islas-caiman', displayName: 'Islas Caimán' },
  '140': { unM49: '140', isoAlpha2: 'CF', isoAlpha3: 'CAF', slug: 'republica-centroafricana', displayName: 'República Centroafricana' },
  '144': { unM49: '144', isoAlpha2: 'LK', isoAlpha3: 'LKA', slug: 'sri-lanka', displayName: 'Sri Lanka' },
  '148': { unM49: '148', isoAlpha2: 'TD', isoAlpha3: 'TCD', slug: 'chad', displayName: 'Chad' },
  '152': { unM49: '152', isoAlpha2: 'CL', isoAlpha3: 'CHL', slug: 'chile', displayName: 'Chile' },
  '156': { unM49: '156', isoAlpha2: 'CN', isoAlpha3: 'CHN', slug: 'china', displayName: 'China' },
  '158': { unM49: '158', isoAlpha2: 'TW', isoAlpha3: 'TWN', slug: 'taiwan', displayName: 'Taiwán' },
  '162': { unM49: '162', isoAlpha2: 'CX', isoAlpha3: 'CXR', slug: 'isla-de-navidad', displayName: 'Isla de Navidad' },
  '166': { unM49: '166', isoAlpha2: 'CC', isoAlpha3: 'CCK', slug: 'islas-cocos', displayName: 'Islas Cocos' },
  '170': { unM49: '170', isoAlpha2: 'CO', isoAlpha3: 'COL', slug: 'colombia', displayName: 'Colombia' },
  '174': { unM49: '174', isoAlpha2: 'KM', isoAlpha3: 'COM', slug: 'comoras', displayName: 'Comoras' },
  '175': { unM49: '175', isoAlpha2: 'YT', isoAlpha3: 'MYT', slug: 'mayotte', displayName: 'Mayotte' },
  '178': { unM49: '178', isoAlpha2: 'CG', isoAlpha3: 'COG', slug: 'republica-del-congo', displayName: 'República del Congo' },
  '180': { unM49: '180', isoAlpha2: 'CD', isoAlpha3: 'COD', slug: 'republica-democratica-del-congo', displayName: 'República Democrática del Congo' },
  '184': { unM49: '184', isoAlpha2: 'CK', isoAlpha3: 'COK', slug: 'islas-cook', displayName: 'Islas Cook' },
  '188': { unM49: '188', isoAlpha2: 'CR', isoAlpha3: 'CRI', slug: 'costa-rica', displayName: 'Costa Rica' },
  '191': { unM49: '191', isoAlpha2: 'HR', isoAlpha3: 'HRV', slug: 'croacia', displayName: 'Croacia' },
  '192': { unM49: '192', isoAlpha2: 'CU', isoAlpha3: 'CUB', slug: 'cuba', displayName: 'Cuba' },
  '196': { unM49: '196', isoAlpha2: 'CY', isoAlpha3: 'CYP', slug: 'chipre', displayName: 'Chipre' },
  '203': { unM49: '203', isoAlpha2: 'CZ', isoAlpha3: 'CZE', slug: 'chequia', displayName: 'Chequia' },
  
  // D
  '204': { unM49: '204', isoAlpha2: 'BJ', isoAlpha3: 'BEN', slug: 'benin', displayName: 'Benín' },
  '208': { unM49: '208', isoAlpha2: 'DK', isoAlpha3: 'DNK', slug: 'dinamarca', displayName: 'Dinamarca' },
  '212': { unM49: '212', isoAlpha2: 'DM', isoAlpha3: 'DMA', slug: 'dominica', displayName: 'Dominica' },
  '214': { unM49: '214', isoAlpha2: 'DO', isoAlpha3: 'DOM', slug: 'republica-dominicana', displayName: 'República Dominicana' },
  '218': { unM49: '218', isoAlpha2: 'EC', isoAlpha3: 'ECU', slug: 'ecuador', displayName: 'Ecuador' },
  '222': { unM49: '222', isoAlpha2: 'SV', isoAlpha3: 'SLV', slug: 'el-salvador', displayName: 'El Salvador' },
  '226': { unM49: '226', isoAlpha2: 'GQ', isoAlpha3: 'GNQ', slug: 'guinea-ecuatorial', displayName: 'Guinea Ecuatorial' },
  '231': { unM49: '231', isoAlpha2: 'ET', isoAlpha3: 'ETH', slug: 'etiopia', displayName: 'Etiopía' },
  '232': { unM49: '232', isoAlpha2: 'ER', isoAlpha3: 'ERI', slug: 'eritrea', displayName: 'Eritrea' },
  '233': { unM49: '233', isoAlpha2: 'EE', isoAlpha3: 'EST', slug: 'estonia', displayName: 'Estonia' },
  
  // E
  '234': { unM49: '234', isoAlpha2: 'FO', isoAlpha3: 'FRO', slug: 'islas-feroe', displayName: 'Islas Feroe' },
  '238': { unM49: '238', isoAlpha2: 'FK', isoAlpha3: 'FLK', slug: 'islas-malvinas', displayName: 'Islas Malvinas' },
  '239': { unM49: '239', isoAlpha2: 'GS', isoAlpha3: 'SGS', slug: 'islas-georgias-del-sur-y-sandwich-del-sur', displayName: 'Islas Georgias del Sur y Sandwich del Sur' },
  '242': { unM49: '242', isoAlpha2: 'FJ', isoAlpha3: 'FJI', slug: 'fiyi', displayName: 'Fiyi' },
  '246': { unM49: '246', isoAlpha2: 'FI', isoAlpha3: 'FIN', slug: 'finlandia', displayName: 'Finlandia' },
  '248': { unM49: '248', isoAlpha2: 'AX', isoAlpha3: 'ALA', slug: 'islas-aland', displayName: 'Islas Åland' },
  '250': { unM49: '250', isoAlpha2: 'FR', isoAlpha3: 'FRA', slug: 'francia', displayName: 'Francia' },
  '254': { unM49: '254', isoAlpha2: 'GF', isoAlpha3: 'GUF', slug: 'guayana-francesa', displayName: 'Guayana Francesa' },
  '258': { unM49: '258', isoAlpha2: 'PF', isoAlpha3: 'PYF', slug: 'polinesia-francesa', displayName: 'Polinesia Francesa' },
  '260': { unM49: '260', isoAlpha2: 'TF', isoAlpha3: 'ATF', slug: 'tierras-australes-y-antarticas-francesas', displayName: 'Tierras Australes y Antárticas Francesas' },
  '262': { unM49: '262', isoAlpha2: 'DJ', isoAlpha3: 'DJI', slug: 'yibuti', displayName: 'Yibuti' },
  '266': { unM49: '266', isoAlpha2: 'GA', isoAlpha3: 'GAB', slug: 'gabon', displayName: 'Gabón' },
  '268': { unM49: '268', isoAlpha2: 'GE', isoAlpha3: 'GEO', slug: 'georgia', displayName: 'Georgia' },
  '270': { unM49: '270', isoAlpha2: 'GM', isoAlpha3: 'GMB', slug: 'gambia', displayName: 'Gambia' },
  '275': { unM49: '275', isoAlpha2: 'PS', isoAlpha3: 'PSE', slug: 'estado-de-palestina', displayName: 'Estado de Palestina' },
  '276': { unM49: '276', isoAlpha2: 'DE', isoAlpha3: 'DEU', slug: 'alemania', displayName: 'Alemania' },
  '288': { unM49: '288', isoAlpha2: 'GH', isoAlpha3: 'GHA', slug: 'ghana', displayName: 'Ghana' },
  '292': { unM49: '292', isoAlpha2: 'GI', isoAlpha3: 'GIB', slug: 'gibraltar', displayName: 'Gibraltar' },
  '296': { unM49: '296', isoAlpha2: 'KI', isoAlpha3: 'KIR', slug: 'kiribati', displayName: 'Kiribati' },
  '300': { unM49: '300', isoAlpha2: 'GR', isoAlpha3: 'GRC', slug: 'grecia', displayName: 'Grecia' },
  '304': { unM49: '304', isoAlpha2: 'GL', isoAlpha3: 'GRL', slug: 'groenlandia', displayName: 'Groenlandia' },
  '308': { unM49: '308', isoAlpha2: 'GD', isoAlpha3: 'GRD', slug: 'granada', displayName: 'Granada' },
  '312': { unM49: '312', isoAlpha2: 'GP', isoAlpha3: 'GLP', slug: 'guadalupe', displayName: 'Guadalupe' },
  '316': { unM49: '316', isoAlpha2: 'GU', isoAlpha3: 'GUM', slug: 'guam', displayName: 'Guam' },
  '320': { unM49: '320', isoAlpha2: 'GT', isoAlpha3: 'GTM', slug: 'guatemala', displayName: 'Guatemala' },
  '324': { unM49: '324', isoAlpha2: 'GN', isoAlpha3: 'GIN', slug: 'guinea', displayName: 'Guinea' },
  '328': { unM49: '328', isoAlpha2: 'GY', isoAlpha3: 'GUY', slug: 'guyana', displayName: 'Guyana' },
  
  // H
  '332': { unM49: '332', isoAlpha2: 'HT', isoAlpha3: 'HTI', slug: 'haiti', displayName: 'Haití' },
  '334': { unM49: '334', isoAlpha2: 'HM', isoAlpha3: 'HMD', slug: 'islas-heard-y-mcdonald', displayName: 'Islas Heard y McDonald' },
  '336': { unM49: '336', isoAlpha2: 'VA', isoAlpha3: 'VAT', slug: 'vaticano', displayName: 'Vaticano' },
  '340': { unM49: '340', isoAlpha2: 'HN', isoAlpha3: 'HND', slug: 'honduras', displayName: 'Honduras' },
  '344': { unM49: '344', isoAlpha2: 'HK', isoAlpha3: 'HKG', slug: 'hong-kong', displayName: 'Hong Kong' },
  '348': { unM49: '348', isoAlpha2: 'HU', isoAlpha3: 'HUN', slug: 'hungria', displayName: 'Hungría' },
  
  // I
  '352': { unM49: '352', isoAlpha2: 'IS', isoAlpha3: 'ISL', slug: 'islandia', displayName: 'Islandia' },
  '356': { unM49: '356', isoAlpha2: 'IN', isoAlpha3: 'IND', slug: 'india', displayName: 'India' },
  '360': { unM49: '360', isoAlpha2: 'ID', isoAlpha3: 'IDN', slug: 'indonesia', displayName: 'Indonesia' },
  '364': { unM49: '364', isoAlpha2: 'IR', isoAlpha3: 'IRN', slug: 'iran', displayName: 'Irán' },
  '368': { unM49: '368', isoAlpha2: 'IQ', isoAlpha3: 'IRQ', slug: 'irak', displayName: 'Irak' },
  '372': { unM49: '372', isoAlpha2: 'IE', isoAlpha3: 'IRL', slug: 'irlanda', displayName: 'Irlanda' },
  '376': { unM49: '376', isoAlpha2: 'IL', isoAlpha3: 'ISR', slug: 'israel', displayName: 'Israel' },
  '380': { unM49: '380', isoAlpha2: 'IT', isoAlpha3: 'ITA', slug: 'italia', displayName: 'Italia' },
  '384': { unM49: '384', isoAlpha2: 'CI', isoAlpha3: 'CIV', slug: 'costa-de-marfil', displayName: 'Costa de Marfil' },
  
  // J
  '388': { unM49: '388', isoAlpha2: 'JM', isoAlpha3: 'JAM', slug: 'jamaica', displayName: 'Jamaica' },
  '392': { unM49: '392', isoAlpha2: 'JP', isoAlpha3: 'JPN', slug: 'japon', displayName: 'Japón' },
  
  // K
  '398': { unM49: '398', isoAlpha2: 'KZ', isoAlpha3: 'KAZ', slug: 'kazajistan', displayName: 'Kazajistán' },
  '400': { unM49: '400', isoAlpha2: 'JO', isoAlpha3: 'JOR', slug: 'jordania', displayName: 'Jordania' },
  '404': { unM49: '404', isoAlpha2: 'KE', isoAlpha3: 'KEN', slug: 'kenia', displayName: 'Kenia' },
  '408': { unM49: '408', isoAlpha2: 'KP', isoAlpha3: 'PRK', slug: 'corea-del-norte', displayName: 'Corea del Norte' },
  '410': { unM49: '410', isoAlpha2: 'KR', isoAlpha3: 'KOR', slug: 'corea-del-sur', displayName: 'Corea del Sur' },
  '414': { unM49: '414', isoAlpha2: 'KW', isoAlpha3: 'KWT', slug: 'kuwait', displayName: 'Kuwait' },
  '417': { unM49: '417', isoAlpha2: 'KG', isoAlpha3: 'KGZ', slug: 'kirguistan', displayName: 'Kirguistán' },
  
  // L
  '418': { unM49: '418', isoAlpha2: 'LA', isoAlpha3: 'LAO', slug: 'laos', displayName: 'Laos' },
  '422': { unM49: '422', isoAlpha2: 'LB', isoAlpha3: 'LBN', slug: 'libano', displayName: 'Líbano' },
  '426': { unM49: '426', isoAlpha2: 'LS', isoAlpha3: 'LSO', slug: 'lesoto', displayName: 'Lesoto' },
  '428': { unM49: '428', isoAlpha2: 'LV', isoAlpha3: 'LVA', slug: 'letonia', displayName: 'Letonia' },
  '430': { unM49: '430', isoAlpha2: 'LR', isoAlpha3: 'LBR', slug: 'liberia', displayName: 'Liberia' },
  '434': { unM49: '434', isoAlpha2: 'LY', isoAlpha3: 'LBY', slug: 'libia', displayName: 'Libia' },
  '438': { unM49: '438', isoAlpha2: 'LI', isoAlpha3: 'LIE', slug: 'liechtenstein', displayName: 'Liechtenstein' },
  '440': { unM49: '440', isoAlpha2: 'LT', isoAlpha3: 'LTU', slug: 'lituania', displayName: 'Lituania' },
  '442': { unM49: '442', isoAlpha2: 'LU', isoAlpha3: 'LUX', slug: 'luxemburgo', displayName: 'Luxemburgo' },
  
  // M
  '446': { unM49: '446', isoAlpha2: 'MO', isoAlpha3: 'MAC', slug: 'macao', displayName: 'Macao' },
  '450': { unM49: '450', isoAlpha2: 'MG', isoAlpha3: 'MDG', slug: 'madagascar', displayName: 'Madagascar' },
  '454': { unM49: '454', isoAlpha2: 'MW', isoAlpha3: 'MWI', slug: 'malaui', displayName: 'Malaui' },
  '458': { unM49: '458', isoAlpha2: 'MY', isoAlpha3: 'MYS', slug: 'malasia', displayName: 'Malasia' },
  '462': { unM49: '462', isoAlpha2: 'MV', isoAlpha3: 'MDV', slug: 'maldivas', displayName: 'Maldivas' },
  '466': { unM49: '466', isoAlpha2: 'ML', isoAlpha3: 'MLI', slug: 'mali', displayName: 'Malí' },
  '470': { unM49: '470', isoAlpha2: 'MT', isoAlpha3: 'MLT', slug: 'malta', displayName: 'Malta' },
  '474': { unM49: '474', isoAlpha2: 'MQ', isoAlpha3: 'MTQ', slug: 'martinica', displayName: 'Martinica' },
  '478': { unM49: '478', isoAlpha2: 'MR', isoAlpha3: 'MRT', slug: 'mauritania', displayName: 'Mauritania' },
  '480': { unM49: '480', isoAlpha2: 'MU', isoAlpha3: 'MUS', slug: 'mauricio', displayName: 'Mauricio' },
  '484': { unM49: '484', isoAlpha2: 'MX', isoAlpha3: 'MEX', slug: 'mexico', displayName: 'México' },
  '492': { unM49: '492', isoAlpha2: 'MC', isoAlpha3: 'MCO', slug: 'monaco', displayName: 'Mónaco' },
  '496': { unM49: '496', isoAlpha2: 'MN', isoAlpha3: 'MNG', slug: 'mongolia', displayName: 'Mongolia' },
  '498': { unM49: '498', isoAlpha2: 'MD', isoAlpha3: 'MDA', slug: 'moldavia', displayName: 'Moldavia' },
  '499': { unM49: '499', isoAlpha2: 'ME', isoAlpha3: 'MNE', slug: 'montenegro', displayName: 'Montenegro' },
  '500': { unM49: '500', isoAlpha2: 'MS', isoAlpha3: 'MSR', slug: 'montserrat', displayName: 'Montserrat' },
  '504': { unM49: '504', isoAlpha2: 'MA', isoAlpha3: 'MAR', slug: 'marruecos', displayName: 'Marruecos' },
  '508': { unM49: '508', isoAlpha2: 'MZ', isoAlpha3: 'MOZ', slug: 'mozambique', displayName: 'Mozambique' },
  '512': { unM49: '512', isoAlpha2: 'OM', isoAlpha3: 'OMN', slug: 'oman', displayName: 'Omán' },
  
  // N
  '516': { unM49: '516', isoAlpha2: 'NA', isoAlpha3: 'NAM', slug: 'namibia', displayName: 'Namibia' },
  '520': { unM49: '520', isoAlpha2: 'NR', isoAlpha3: 'NRU', slug: 'nauru', displayName: 'Nauru' },
  '524': { unM49: '524', isoAlpha2: 'NP', isoAlpha3: 'NPL', slug: 'nepal', displayName: 'Nepal' },
  '528': { unM49: '528', isoAlpha2: 'NL', isoAlpha3: 'NLD', slug: 'paises-bajos', displayName: 'Países Bajos' },
  '530': { unM49: '530', isoAlpha2: 'CW', isoAlpha3: 'CUW', slug: 'curazao', displayName: 'Curazao' },
  '531': { unM49: '531', isoAlpha2: 'SX', isoAlpha3: 'SXM', slug: 'sint-maarten', displayName: 'Sint Maarten' },
  '533': { unM49: '533', isoAlpha2: 'AW', isoAlpha3: 'ABW', slug: 'aruba', displayName: 'Aruba' },
  '534': { unM49: '534', isoAlpha2: 'SX', isoAlpha3: 'SXM', slug: 'sint-maarten-holandes', displayName: 'Sint Maarten (Holandés)' },
  '535': { unM49: '535', isoAlpha2: 'BQ', isoAlpha3: 'BES', slug: 'bonaire-san-eustaquio-y-saba', displayName: 'Bonaire, San Eustaquio y Saba' },
  '540': { unM49: '540', isoAlpha2: 'NC', isoAlpha3: 'NCL', slug: 'nueva-caledonia', displayName: 'Nueva Caledonia' },
  '548': { unM49: '548', isoAlpha2: 'VU', isoAlpha3: 'VUT', slug: 'vanuatu', displayName: 'Vanuatu' },
  '554': { unM49: '554', isoAlpha2: 'NZ', isoAlpha3: 'NZL', slug: 'nueva-zelanda', displayName: 'Nueva Zelanda' },
  '558': { unM49: '558', isoAlpha2: 'NI', isoAlpha3: 'NIC', slug: 'nicaragua', displayName: 'Nicaragua' },
  '562': { unM49: '562', isoAlpha2: 'NE', isoAlpha3: 'NER', slug: 'niger', displayName: 'Níger' },
  '566': { unM49: '566', isoAlpha2: 'NG', isoAlpha3: 'NGA', slug: 'nigeria', displayName: 'Nigeria' },
  '570': { unM49: '570', isoAlpha2: 'NU', isoAlpha3: 'NIU', slug: 'niue', displayName: 'Niue' },
  '574': { unM49: '574', isoAlpha2: 'NF', isoAlpha3: 'NFK', slug: 'isla-norfolk', displayName: 'Isla Norfolk' },
  '578': { unM49: '578', isoAlpha2: 'NO', isoAlpha3: 'NOR', slug: 'noruega', displayName: 'Noruega' },
  
  // P
  '580': { unM49: '580', isoAlpha2: 'MP', isoAlpha3: 'MNP', slug: 'islas-marianas-del-norte', displayName: 'Islas Marianas del Norte' },
  '583': { unM49: '583', isoAlpha2: 'FM', isoAlpha3: 'FSM', slug: 'micronesia', displayName: 'Micronesia' },
  '584': { unM49: '584', isoAlpha2: 'MH', isoAlpha3: 'MHL', slug: 'islas-marshall', displayName: 'Islas Marshall' },
  '585': { unM49: '585', isoAlpha2: 'PW', isoAlpha3: 'PLW', slug: 'palaos', displayName: 'Palaos' },
  '586': { unM49: '586', isoAlpha2: 'PK', isoAlpha3: 'PAK', slug: 'pakistan', displayName: 'Pakistán' },
  '591': { unM49: '591', isoAlpha2: 'PA', isoAlpha3: 'PAN', slug: 'panama', displayName: 'Panamá' },
  '598': { unM49: '598', isoAlpha2: 'PG', isoAlpha3: 'PNG', slug: 'papua-nueva-guinea', displayName: 'Papúa Nueva Guinea' },
  '600': { unM49: '600', isoAlpha2: 'PY', isoAlpha3: 'PRY', slug: 'paraguay', displayName: 'Paraguay' },
  '604': { unM49: '604', isoAlpha2: 'PE', isoAlpha3: 'PER', slug: 'peru', displayName: 'Perú' },
  '608': { unM49: '608', isoAlpha2: 'PH', isoAlpha3: 'PHL', slug: 'filipinas', displayName: 'Filipinas' },
  '612': { unM49: '612', isoAlpha2: 'PN', isoAlpha3: 'PCN', slug: 'islas-pitcairn', displayName: 'Islas Pitcairn' },
  '616': { unM49: '616', isoAlpha2: 'PL', isoAlpha3: 'POL', slug: 'polonia', displayName: 'Polonia' },
  '620': { unM49: '620', isoAlpha2: 'PT', isoAlpha3: 'PRT', slug: 'portugal', displayName: 'Portugal' },
  '624': { unM49: '624', isoAlpha2: 'GW', isoAlpha3: 'GNB', slug: 'guinea-bisau', displayName: 'Guinea-Bisáu' },
  '626': { unM49: '626', isoAlpha2: 'TL', isoAlpha3: 'TLS', slug: 'timor-oriental', displayName: 'Timor Oriental' },
  '630': { unM49: '630', isoAlpha2: 'PR', isoAlpha3: 'PRI', slug: 'puerto-rico', displayName: 'Puerto Rico' },
  
  // Q
  '634': { unM49: '634', isoAlpha2: 'QA', isoAlpha3: 'QAT', slug: 'catar', displayName: 'Catar' },
  
  // R
  '638': { unM49: '638', isoAlpha2: 'RE', isoAlpha3: 'REU', slug: 'reunion', displayName: 'Reunión' },
  '642': { unM49: '642', isoAlpha2: 'RO', isoAlpha3: 'ROU', slug: 'rumania', displayName: 'Rumanía' },
  '643': { unM49: '643', isoAlpha2: 'RU', isoAlpha3: 'RUS', slug: 'rusia', displayName: 'Rusia' },
  '646': { unM49: '646', isoAlpha2: 'RW', isoAlpha3: 'RWA', slug: 'ruanda', displayName: 'Ruanda' },
  
  // S
  '652': { unM49: '652', isoAlpha2: 'BL', isoAlpha3: 'BLM', slug: 'san-bartolome', displayName: 'San Bartolomé' },
  '654': { unM49: '654', isoAlpha2: 'SH', isoAlpha3: 'SHN', slug: 'santa-elena-ascension-y-tristan-de-acuna', displayName: 'Santa Elena, Ascensión y Tristán de Acuña' },
  '659': { unM49: '659', isoAlpha2: 'KN', isoAlpha3: 'KNA', slug: 'san-cristobal-y-nieves', displayName: 'San Cristóbal y Nieves' },
  '660': { unM49: '660', isoAlpha2: 'AI', isoAlpha3: 'AIA', slug: 'anguila', displayName: 'Anguila' },
  '662': { unM49: '662', isoAlpha2: 'LC', isoAlpha3: 'LCA', slug: 'santa-lucia', displayName: 'Santa Lucía' },
  '663': { unM49: '663', isoAlpha2: 'MF', isoAlpha3: 'MAF', slug: 'san-martin', displayName: 'San Martín' },
  '666': { unM49: '666', isoAlpha2: 'PM', isoAlpha3: 'SPM', slug: 'san-pedro-y-miquelon', displayName: 'San Pedro y Miquelón' },
  '670': { unM49: '670', isoAlpha2: 'VC', isoAlpha3: 'VCT', slug: 'san-vicente-y-las-granadinas', displayName: 'San Vicente y las Granadinas' },
  '674': { unM49: '674', isoAlpha2: 'SM', isoAlpha3: 'SMR', slug: 'san-marino', displayName: 'San Marino' },
  '678': { unM49: '678', isoAlpha2: 'ST', isoAlpha3: 'STP', slug: 'santo-tome-y-principe', displayName: 'Santo Tomé y Príncipe' },
  '682': { unM49: '682', isoAlpha2: 'SA', isoAlpha3: 'SAU', slug: 'arabia-saudita', displayName: 'Arabia Saudita' },
  '686': { unM49: '686', isoAlpha2: 'SN', isoAlpha3: 'SEN', slug: 'senegal', displayName: 'Senegal' },
  '688': { unM49: '688', isoAlpha2: 'RS', isoAlpha3: 'SRB', slug: 'serbia', displayName: 'Serbia' },
  '690': { unM49: '690', isoAlpha2: 'SC', isoAlpha3: 'SYC', slug: 'seychelles', displayName: 'Seychelles' },
  '694': { unM49: '694', isoAlpha2: 'SL', isoAlpha3: 'SLE', slug: 'sierra-leona', displayName: 'Sierra Leona' },
  '702': { unM49: '702', isoAlpha2: 'SG', isoAlpha3: 'SGP', slug: 'singapur', displayName: 'Singapur' },
  '703': { unM49: '703', isoAlpha2: 'SK', isoAlpha3: 'SVK', slug: 'eslovaquia', displayName: 'Eslovaquia' },
  '704': { unM49: '704', isoAlpha2: 'VN', isoAlpha3: 'VNM', slug: 'vietnam', displayName: 'Vietnam' },
  '705': { unM49: '705', isoAlpha2: 'SI', isoAlpha3: 'SVN', slug: 'eslovenia', displayName: 'Eslovenia' },
  '706': { unM49: '706', isoAlpha2: 'SO', isoAlpha3: 'SOM', slug: 'somalia', displayName: 'Somalia' },
  '710': { unM49: '710', isoAlpha2: 'ZA', isoAlpha3: 'ZAF', slug: 'sudafrica', displayName: 'Sudáfrica' },
  '716': { unM49: '716', isoAlpha2: 'ZW', isoAlpha3: 'ZWE', slug: 'zimbabue', displayName: 'Zimbabue' },
  '724': { unM49: '724', isoAlpha2: 'ES', isoAlpha3: 'ESP', slug: 'espana', displayName: 'España' },
  
  // T
  '728': { unM49: '728', isoAlpha2: 'SS', isoAlpha3: 'SSD', slug: 'sudan-del-sur', displayName: 'Sudán del Sur' },
  '729': { unM49: '729', isoAlpha2: 'SD', isoAlpha3: 'SDN', slug: 'sudan', displayName: 'Sudán' },
  '732': { unM49: '732', isoAlpha2: 'EH', isoAlpha3: 'ESH', slug: 'sahara-occidental', displayName: 'Sahara Occidental' },
  '740': { unM49: '740', isoAlpha2: 'SR', isoAlpha3: 'SUR', slug: 'surinam', displayName: 'Surinam' },
  '744': { unM49: '744', isoAlpha2: 'SJ', isoAlpha3: 'SJM', slug: 'svalbard-y-jan-mayen', displayName: 'Svalbard y Jan Mayen' },
  '748': { unM49: '748', isoAlpha2: 'SZ', isoAlpha3: 'SWZ', slug: 'esuatini', displayName: 'Esuatini' },
  '752': { unM49: '752', isoAlpha2: 'SE', isoAlpha3: 'SWE', slug: 'suecia', displayName: 'Suecia' },
  '756': { unM49: '756', isoAlpha2: 'CH', isoAlpha3: 'CHE', slug: 'suiza', displayName: 'Suiza' },
  '760': { unM49: '760', isoAlpha2: 'SY', isoAlpha3: 'SYR', slug: 'siria', displayName: 'Siria' },
  '762': { unM49: '762', isoAlpha2: 'TJ', isoAlpha3: 'TJK', slug: 'tayikistan', displayName: 'Tayikistán' },
  '764': { unM49: '764', isoAlpha2: 'TH', isoAlpha3: 'THA', slug: 'tailandia', displayName: 'Tailandia' },
  '768': { unM49: '768', isoAlpha2: 'TG', isoAlpha3: 'TGO', slug: 'togo', displayName: 'Togo' },
  '772': { unM49: '772', isoAlpha2: 'TK', isoAlpha3: 'TKL', slug: 'tokelau', displayName: 'Tokelau' },
  '776': { unM49: '776', isoAlpha2: 'TO', isoAlpha3: 'TON', slug: 'tonga', displayName: 'Tonga' },
  '780': { unM49: '780', isoAlpha2: 'TT', isoAlpha3: 'TTO', slug: 'trinidad-y-tobago', displayName: 'Trinidad y Tobago' },
  '784': { unM49: '784', isoAlpha2: 'AE', isoAlpha3: 'ARE', slug: 'emiratos-arabes-unidos', displayName: 'Emiratos Árabes Unidos' },
  '788': { unM49: '788', isoAlpha2: 'TN', isoAlpha3: 'TUN', slug: 'tunez', displayName: 'Túnez' },
  '792': { unM49: '792', isoAlpha2: 'TR', isoAlpha3: 'TUR', slug: 'turquia', displayName: 'Turquía' },
  '795': { unM49: '795', isoAlpha2: 'TM', isoAlpha3: 'TKM', slug: 'turkmenistan', displayName: 'Turkmenistán' },
  '796': { unM49: '796', isoAlpha2: 'TC', isoAlpha3: 'TCA', slug: 'islas-turcas-y-caicos', displayName: 'Islas Turcas y Caicos' },
  '798': { unM49: '798', isoAlpha2: 'TV', isoAlpha3: 'TUV', slug: 'tuvalu', displayName: 'Tuvalu' },
  
  // U
  '800': { unM49: '800', isoAlpha2: 'UG', isoAlpha3: 'UGA', slug: 'uganda', displayName: 'Uganda' },
  '804': { unM49: '804', isoAlpha2: 'UA', isoAlpha3: 'UKR', slug: 'ucrania', displayName: 'Ucrania' },
  '807': { unM49: '807', isoAlpha2: 'MK', isoAlpha3: 'MKD', slug: 'macedonia-del-norte', displayName: 'Macedonia del Norte' },
  '818': { unM49: '818', isoAlpha2: 'EG', isoAlpha3: 'EGY', slug: 'egipto', displayName: 'Egipto' },
  '826': { unM49: '826', isoAlpha2: 'GB', isoAlpha3: 'GBR', slug: 'reino-unido', displayName: 'Reino Unido' },
  '831': { unM49: '831', isoAlpha2: 'GG', isoAlpha3: 'GGY', slug: 'guernsey', displayName: 'Guernsey' },
  '832': { unM49: '832', isoAlpha2: 'JE', isoAlpha3: 'JEY', slug: 'jersey', displayName: 'Jersey' },
  '833': { unM49: '833', isoAlpha2: 'IM', isoAlpha3: 'IMN', slug: 'isla-de-man', displayName: 'Isla de Man' },
  '834': { unM49: '834', isoAlpha2: 'TZ', isoAlpha3: 'TZA', slug: 'tanzania', displayName: 'Tanzania' },
  '840': { unM49: '840', isoAlpha2: 'US', isoAlpha3: 'USA', slug: 'estados-unidos', displayName: 'Estados Unidos' },
  '850': { unM49: '850', isoAlpha2: 'VI', isoAlpha3: 'VIR', slug: 'islas-virgenes-de-los-estados-unidos', displayName: 'Islas Vírgenes de los Estados Unidos' },
  
  // V
  '854': { unM49: '854', isoAlpha2: 'BF', isoAlpha3: 'BFA', slug: 'burkina-faso', displayName: 'Burkina Faso' },
  '858': { unM49: '858', isoAlpha2: 'UY', isoAlpha3: 'URY', slug: 'uruguay', displayName: 'Uruguay' },
  '860': { unM49: '860', isoAlpha2: 'UZ', isoAlpha3: 'UZB', slug: 'uzbekistan', displayName: 'Uzbekistán' },
  '862': { unM49: '862', isoAlpha2: 'VE', isoAlpha3: 'VEN', slug: 'venezuela', displayName: 'Venezuela' },
  
  // W
  '876': { unM49: '876', isoAlpha2: 'WF', isoAlpha3: 'WLF', slug: 'wallis-y-futuna', displayName: 'Wallis y Futuna' },
  
  // Y
  '882': { unM49: '882', isoAlpha2: 'WS', isoAlpha3: 'WSM', slug: 'samoa', displayName: 'Samoa' },
  
  // Z
  '887': { unM49: '887', isoAlpha2: 'YE', isoAlpha3: 'YEM', slug: 'yemen', displayName: 'Yemen' },
  '894': { unM49: '894', isoAlpha2: 'ZM', isoAlpha3: 'ZMB', slug: 'zambia', displayName: 'Zambia' },
};

/**
 * Obtiene un país del mundo por su código UN M.49
 * @param unM49 - Código numérico de la ONU (ej: '484' para México)
 * @returns WorldCountry | undefined
 */
export function getWorldCountryByUnM49(unM49: string): WorldCountry | undefined {
  return worldCountries[unM49];
}

/**
 * Obtiene un país del mundo por su código ISO Alpha-2
 * @param isoAlpha2 - Código ISO de 2 letras (ej: 'MX')
 * @returns WorldCountry | undefined
 */
export function getWorldCountryByIsoAlpha2(isoAlpha2: string): WorldCountry | undefined {
  const upperCode = isoAlpha2.toUpperCase();
  return Object.values(worldCountries).find(country => country.isoAlpha2 === upperCode);
}

/**
 * Obtiene un país del mundo por su slug
 * @param slug - Slug URL-friendly (ej: 'mexico')
 * @returns WorldCountry | undefined
 */
export function getWorldCountryBySlug(slug: string): WorldCountry | undefined {
  const normalizedSlug = slug.toLowerCase();
  return Object.values(worldCountries).find(
    country => country.slug.toLowerCase() === normalizedSlug
  );
}

/**
 * Verifica si un código UN M.49 corresponde a un país conocido
 * @param unM49 - Código numérico de la ONU
 * @returns boolean
 */
export function isKnownCountryCode(unM49: string): boolean {
  return unM49 in worldCountries;
}