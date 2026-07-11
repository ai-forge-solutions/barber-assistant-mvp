export type CountryDialCode = {
  code: string
  label: string
  dialCode: string
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: 'ES', label: 'España', dialCode: '+34' },
  { code: 'PT', label: 'Portugal', dialCode: '+351' },
  { code: 'FR', label: 'Francia', dialCode: '+33' },
  { code: 'IT', label: 'Italia', dialCode: '+39' },
  { code: 'DE', label: 'Alemania', dialCode: '+49' },
  { code: 'GB', label: 'Reino Unido', dialCode: '+44' },
  { code: 'US', label: 'Estados Unidos', dialCode: '+1' },
]

export const DEFAULT_COUNTRY_DIAL_CODE = COUNTRY_DIAL_CODES[0]
