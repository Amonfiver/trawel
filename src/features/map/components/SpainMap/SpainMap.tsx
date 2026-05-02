/**
 * SpainMap queda como wrapper legado temporal.
 *
 * El render principal de mapas internos vive en CountryInternalMap y no pinta
 * ciudades, marcadores ni labels fijos.
 */

import { CountryInternalMap } from '../CountryInternalMap';

interface SpainMapProps {
  countryName?: string;
}

export function SpainMap({ countryName = 'España' }: SpainMapProps) {
  return (
    <CountryInternalMap
      assetUrl="/maps/countries/spain/spain-adm2.topojson"
      countryName={countryName}
      attribution="Datos cartográficos: geoBoundaries (CC BY 4.0)"
    />
  );
}
