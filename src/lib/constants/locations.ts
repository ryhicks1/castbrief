export interface LocationOption {
  city: string;
  country: string;
  code: string;
}

export const LOCATIONS: LocationOption[] = [
  // Australia
  { city: "Sydney", country: "Australia", code: "SYD" },
  { city: "Melbourne", country: "Australia", code: "MEL" },
  { city: "Brisbane", country: "Australia", code: "BNE" },
  { city: "Perth", country: "Australia", code: "PER" },
  { city: "Adelaide", country: "Australia", code: "ADL" },
  { city: "Canberra", country: "Australia", code: "CBR" },
  { city: "Hobart", country: "Australia", code: "HBA" },
  { city: "Darwin", country: "Australia", code: "DRW" },

  // New Zealand
  { city: "Wellington", country: "New Zealand", code: "WLG" },
  { city: "Auckland", country: "New Zealand", code: "AKL" },

  // USA
  { city: "Washington DC", country: "USA", code: "DCA" },
  { city: "New York", country: "USA", code: "NYC" },
  { city: "Los Angeles", country: "USA", code: "LAX" },
  { city: "Chicago", country: "USA", code: "CHI" },
  { city: "Atlanta", country: "USA", code: "ATL" },
  { city: "Miami", country: "USA", code: "MIA" },
  { city: "Dallas", country: "USA", code: "DFW" },
  { city: "San Francisco", country: "USA", code: "SFO" },
  { city: "Seattle", country: "USA", code: "SEA" },
  { city: "Boston", country: "USA", code: "BOS" },
  { city: "Nashville", country: "USA", code: "NSH" },
  { city: "Portland", country: "USA", code: "PDX" },
  { city: "Denver", country: "USA", code: "DEN" },
  { city: "Phoenix", country: "USA", code: "PHX" },
  { city: "Las Vegas", country: "USA", code: "LAS" },
  { city: "Minneapolis", country: "USA", code: "MSP" },
  { city: "Detroit", country: "USA", code: "DTW" },
  { city: "Philadelphia", country: "USA", code: "PHL" },
  { city: "Houston", country: "USA", code: "HOU" },

  // Canada
  { city: "Ottawa", country: "Canada", code: "OTT" },
  { city: "Toronto", country: "Canada", code: "YYZ" },
  { city: "Vancouver", country: "Canada", code: "YVR" },
  { city: "Montreal", country: "Canada", code: "YUL" },
  { city: "Calgary", country: "Canada", code: "YYC" },

  // UK
  { city: "London", country: "UK", code: "LDN" },
  { city: "Edinburgh", country: "UK", code: "EDI" },
  { city: "Cardiff", country: "UK", code: "CWL" },
  { city: "Belfast", country: "UK", code: "BFS" },
  { city: "Manchester", country: "UK", code: "MAN" },
  { city: "Birmingham", country: "UK", code: "BHX" },

  // Mexico
  { city: "Mexico City", country: "Mexico", code: "MEX" },
  { city: "Guadalajara", country: "Mexico", code: "GDL" },

  // Japan
  { city: "Tokyo", country: "Japan", code: "TYO" },
  { city: "Osaka", country: "Japan", code: "OSA" },
  { city: "Kyoto", country: "Japan", code: "KYO" },

  // Korea
  { city: "Seoul", country: "Korea", code: "SEL" },
  { city: "Busan", country: "Korea", code: "PUS" },

  // China
  { city: "Beijing", country: "China", code: "PEK" },
  { city: "Shanghai", country: "China", code: "SHA" },
  { city: "Hong Kong", country: "China", code: "HKG" },
  { city: "Shenzhen", country: "China", code: "SZX" },

  // Singapore
  { city: "Singapore", country: "Singapore", code: "SIN" },

  // Malaysia
  { city: "Kuala Lumpur", country: "Malaysia", code: "KUL" },

  // Thailand
  { city: "Bangkok", country: "Thailand", code: "BKK" },

  // Vietnam
  { city: "Hanoi", country: "Vietnam", code: "HAN" },
  { city: "Ho Chi Minh City", country: "Vietnam", code: "SGN" },

  // Brazil
  { city: "Brasilia", country: "Brazil", code: "BSB" },
  { city: "S\u00e3o Paulo", country: "Brazil", code: "GRU" },
  { city: "Rio de Janeiro", country: "Brazil", code: "GIG" },

  // Argentina
  { city: "Buenos Aires", country: "Argentina", code: "EZE" },

  // France
  { city: "Paris", country: "France", code: "PAR" },
  { city: "Lyon", country: "France", code: "LYS" },
  { city: "Marseille", country: "France", code: "MRS" },

  // Spain
  { city: "Madrid", country: "Spain", code: "MAD" },
  { city: "Barcelona", country: "Spain", code: "BCN" },
];

// Group by country for the dropdown
export const LOCATIONS_BY_COUNTRY = LOCATIONS.reduce<
  Record<string, LocationOption[]>
>((acc, loc) => {
  if (!acc[loc.country]) acc[loc.country] = [];
  acc[loc.country].push(loc);
  return acc;
}, {});
