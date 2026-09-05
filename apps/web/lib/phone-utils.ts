/**
 * Comprehensive international country calling codes & E.164 phone validation utilities.
 */

export interface CountryCodeOption {
  name: string;
  code: string; // e.g. "+91", "+1"
  flag: string; // e.g. "🇮🇳", "🇺🇸"
  placeholder: string;
  iso: string;
}

export const ALL_COUNTRY_CODES: CountryCodeOption[] = [
  // Frequently used on top
  { iso: 'IN', name: 'India', code: '+91', flag: '🇮🇳', placeholder: '95561 47082' },
  { iso: 'US', name: 'United States', code: '+1', flag: '🇺🇸', placeholder: '202 555 0123' },
  { iso: 'GB', name: 'United Kingdom', code: '+44', flag: '🇬🇧', placeholder: '7911 123456' },
  { iso: 'CA', name: 'Canada', code: '+1', flag: '🇨🇦', placeholder: '416 555 0199' },
  { iso: 'AE', name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', placeholder: '50 123 4567' },
  { iso: 'SG', name: 'Singapore', code: '+65', flag: '🇸🇬', placeholder: '8123 4567' },
  { iso: 'AU', name: 'Australia', code: '+61', flag: '🇦🇺', placeholder: '412 345 678' },
  { iso: 'DE', name: 'Germany', code: '+49', flag: '🇩🇪', placeholder: '151 23456789' },

  // All Global Countries Alphabetical
  { iso: 'AF', name: 'Afghanistan', code: '+93', flag: '🇦🇫', placeholder: '70 123 4567' },
  { iso: 'AL', name: 'Albania', code: '+355', flag: '🇦🇱', placeholder: '67 123 4567' },
  { iso: 'DZ', name: 'Algeria', code: '+213', flag: '🇩🇿', placeholder: '55 123 4567' },
  { iso: 'AD', name: 'Andorra', code: '+376', flag: '🇦🇩', placeholder: '312 345' },
  { iso: 'AO', name: 'Angola', code: '+244', flag: '🇦🇴', placeholder: '923 123 456' },
  { iso: 'AR', name: 'Argentina', code: '+54', flag: '🇦🇷', placeholder: '9 11 1234 5678' },
  { iso: 'AM', name: 'Armenia', code: '+374', flag: '🇦🇲', placeholder: '77 123456' },
  { iso: 'AT', name: 'Austria', code: '+43', flag: '🇦🇹', placeholder: '664 1234567' },
  { iso: 'AZ', name: 'Azerbaijan', code: '+994', flag: '🇦🇿', placeholder: '50 123 45 67' },
  { iso: 'BH', name: 'Bahrain', code: '+973', flag: '🇧🇭', placeholder: '3600 1234' },
  { iso: 'BD', name: 'Bangladesh', code: '+880', flag: '🇧🇩', placeholder: '1712 345678' },
  { iso: 'BY', name: 'Belarus', code: '+375', flag: '🇧🇾', placeholder: '29 123 45 67' },
  { iso: 'BE', name: 'Belgium', code: '+32', flag: '🇧🇪', placeholder: '470 12 34 56' },
  { iso: 'BZ', name: 'Belize', code: '+501', flag: '🇧🇿', placeholder: '622 1234' },
  { iso: 'BT', name: 'Bhutan', code: '+975', flag: '🇧🇹', placeholder: '17 12 34 56' },
  { iso: 'BO', name: 'Bolivia', code: '+591', flag: '🇧🇴', placeholder: '7123 4567' },
  { iso: 'BR', name: 'Brazil', code: '+55', flag: '🇧🇷', placeholder: '11 91234 5678' },
  { iso: 'BG', name: 'Bulgaria', code: '+359', flag: '🇧🇬', placeholder: '87 123 4567' },
  { iso: 'KH', name: 'Cambodia', code: '+855', flag: '🇰🇭', placeholder: '12 345 678' },
  { iso: 'CL', name: 'Chile', code: '+56', flag: '🇨🇱', placeholder: '9 1234 5678' },
  { iso: 'CN', name: 'China', code: '+86', flag: '🇨🇳', placeholder: '138 0013 8000' },
  { iso: 'CO', name: 'Colombia', code: '+57', flag: '🇨🇴', placeholder: '300 123 4567' },
  { iso: 'CR', name: 'Costa Rica', code: '+506', flag: '🇨🇷', placeholder: '8312 3456' },
  { iso: 'HR', name: 'Croatia', code: '+385', flag: '🇭🇷', placeholder: '91 234 5678' },
  { iso: 'CY', name: 'Cyprus', code: '+357', flag: '🇨🇾', placeholder: '96 123456' },
  { iso: 'CZ', name: 'Czech Republic', code: '+420', flag: '🇨🇿', placeholder: '601 123 456' },
  { iso: 'DK', name: 'Denmark', code: '+45', flag: '🇩🇰', placeholder: '20 12 34 56' },
  { iso: 'EG', name: 'Egypt', code: '+20', flag: '🇪🇬', placeholder: '100 123 4567' },
  { iso: 'EE', name: 'Estonia', code: '+372', flag: '🇪🇪', placeholder: '5123 4567' },
  { iso: 'ET', name: 'Ethiopia', code: '+251', flag: '🇪🇹', placeholder: '91 123 4567' },
  { iso: 'FI', name: 'Finland', code: '+358', flag: '🇫🇮', placeholder: '40 1234567' },
  { iso: 'FR', name: 'France', code: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { iso: 'GE', name: 'Georgia', code: '+995', flag: '🇬🇪', placeholder: '577 12 34 56' },
  { iso: 'GR', name: 'Greece', code: '+30', flag: '🇬🇷', placeholder: '691 234 5678' },
  { iso: 'HK', name: 'Hong Kong', code: '+852', flag: '🇭🇰', placeholder: '9123 4567' },
  { iso: 'HU', name: 'Hungary', code: '+36', flag: '🇭🇺', placeholder: '20 123 4567' },
  { iso: 'IS', name: 'Iceland', code: '+354', flag: '🇮🇸', placeholder: '612 3456' },
  { iso: 'ID', name: 'Indonesia', code: '+62', flag: '🇮🇩', placeholder: '812 3456 7890' },
  { iso: 'IR', name: 'Iran', code: '+98', flag: '🇮🇷', placeholder: '912 345 6789' },
  { iso: 'IQ', name: 'Iraq', code: '+964', flag: '🇮🇶', placeholder: '790 123 4567' },
  { iso: 'IE', name: 'Ireland', code: '+353', flag: '🇮🇪', placeholder: '85 123 4567' },
  { iso: 'IL', name: 'Israel', code: '+972', flag: '🇮🇱', placeholder: '50 123 4567' },
  { iso: 'IT', name: 'Italy', code: '+39', flag: '🇮🇹', placeholder: '320 123 4567' },
  { iso: 'JP', name: 'Japan', code: '+81', flag: '🇯🇵', placeholder: '90 1234 5678' },
  { iso: 'JO', name: 'Jordan', code: '+962', flag: '🇯🇴', placeholder: '7 9012 3456' },
  { iso: 'KZ', name: 'Kazakhstan', code: '+7', flag: '🇰🇿', placeholder: '701 123 4567' },
  { iso: 'KE', name: 'Kenya', code: '+254', flag: '🇰🇪', placeholder: '712 345678' },
  { iso: 'KR', name: 'South Korea', code: '+82', flag: '🇰🇷', placeholder: '10 1234 5678' },
  { iso: 'KW', name: 'Kuwait', code: '+965', flag: '🇰🇼', placeholder: '9123 4567' },
  { iso: 'LV', name: 'Latvia', code: '+371', flag: '🇱🇻', placeholder: '21 234 567' },
  { iso: 'LB', name: 'Lebanon', code: '+961', flag: '🇱🇧', placeholder: '70 123 456' },
  { iso: 'MY', name: 'Malaysia', code: '+60', flag: '🇲🇾', placeholder: '12 345 6789' },
  { iso: 'MV', name: 'Maldives', code: '+960', flag: '🇲🇻', placeholder: '771 2345' },
  { iso: 'MU', name: 'Mauritius', code: '+230', flag: '🇲🇺', placeholder: '5251 2345' },
  { iso: 'MX', name: 'Mexico', code: '+52', flag: '🇲🇽', placeholder: '55 1234 5678' },
  { iso: 'NP', name: 'Nepal', code: '+977', flag: '🇳🇵', placeholder: '984 1234567' },
  { iso: 'NL', name: 'Netherlands', code: '+31', flag: '🇳🇱', placeholder: '6 12345678' },
  { iso: 'NZ', name: 'New Zealand', code: '+64', flag: '🇳🇿', placeholder: '21 123 4567' },
  { iso: 'NG', name: 'Nigeria', code: '+234', flag: '🇳🇬', placeholder: '802 123 4567' },
  { iso: 'NO', name: 'Norway', code: '+47', flag: '🇳🇴', placeholder: '412 34 567' },
  { iso: 'OM', name: 'Oman', code: '+968', flag: '🇴🇲', placeholder: '9123 4567' },
  { iso: 'PK', name: 'Pakistan', code: '+92', flag: '🇵🇰', placeholder: '301 2345678' },
  { iso: 'PH', name: 'Philippines', code: '+63', flag: '🇵🇭', placeholder: '917 123 4567' },
  { iso: 'PL', name: 'Poland', code: '+48', flag: '🇵🇱', placeholder: '512 345 678' },
  { iso: 'PT', name: 'Portugal', code: '+351', flag: '🇵🇹', placeholder: '912 345 678' },
  { iso: 'QA', name: 'Qatar', code: '+974', flag: '🇶🇦', placeholder: '3312 3456' },
  { iso: 'RO', name: 'Romania', code: '+40', flag: '🇷🇴', placeholder: '712 345 678' },
  { iso: 'RU', name: 'Russia', code: '+7', flag: '🇷🇺', placeholder: '912 345 67 89' },
  { iso: 'SA', name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', placeholder: '50 123 4567' },
  { iso: 'ZA', name: 'South Africa', code: '+27', flag: '🇿🇦', placeholder: '71 123 4567' },
  { iso: 'ES', name: 'Spain', code: '+34', flag: '🇪🇸', placeholder: '612 34 56 78' },
  { iso: 'LK', name: 'Sri Lanka', code: '+94', flag: '🇱🇰', placeholder: '71 234 5678' },
  { iso: 'SE', name: 'Sweden', code: '+46', flag: '🇸🇪', placeholder: '70 123 45 67' },
  { iso: 'CH', name: 'Switzerland', code: '+41', flag: '🇨🇭', placeholder: '78 123 45 67' },
  { iso: 'TW', name: 'Taiwan', code: '+886', flag: '🇹🇼', placeholder: '912 345 678' },
  { iso: 'TH', name: 'Thailand', code: '+66', flag: '🇹🇭', placeholder: '81 234 5678' },
  { iso: 'TR', name: 'Turkey', code: '+90', flag: '🇹🇷', placeholder: '501 234 56 78' },
  { iso: 'UA', name: 'Ukraine', code: '+380', flag: '🇺🇦', placeholder: '50 123 4567' },
  { iso: 'VN', name: 'Vietnam', code: '+84', flag: '🇻🇳', placeholder: '91 234 56 78' },
];

export const COUNTRY_CODES = ALL_COUNTRY_CODES;

export interface PhoneValidationResult {
  isValid: boolean;
  formattedPhone?: string; // Standard E.164 format e.g. "+918852924002" or "+12025550123"
  cleanDigits?: string;
  error?: string;
}

/**
 * Validates and formats a phone number into strict E.164 standard (+[countryCode][number]).
 */
export function formatAndValidatePhone(
  rawPhone: string | null | undefined,
  countryCode: string = '+91'
): PhoneValidationResult {
  if (!rawPhone || !rawPhone.trim()) {
    return {
      isValid: false,
      error: 'Please enter your mobile phone number.',
    };
  }

  // 1. Remove all spaces, dashes, parentheses, dots, symbols
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.\+\,]/g, '');

  // 2. Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');

  const cleanCountryPrefix = countryCode.replace('+', '');

  // 3. If user typed country code directly inside input, strip duplicated prefix
  while (cleaned.startsWith(cleanCountryPrefix) && cleaned.length > 8) {
    cleaned = cleaned.substring(cleanCountryPrefix.length);
    cleaned = cleaned.replace(/^0+/, '');
  }

  // 4. Validate digits only
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Phone number must contain numbers only.',
    };
  }

  // Specific rules for India (+91)
  if (countryCode === '+91') {
    if (cleaned.length < 10) {
      return {
        isValid: false,
        error: `Phone number is too short (${cleaned.length}/10 digits). Please enter 10 digits.`,
      };
    }
    if (cleaned.length > 10) {
      return {
        isValid: false,
        error: `Phone number has too many digits (${cleaned.length} digits). Please enter a 10-digit number.`,
      };
    }
    if (!/^[6-9]/.test(cleaned)) {
      return {
        isValid: false,
        error: 'Invalid Indian mobile number. Mobile numbers must start with 6, 7, 8, or 9.',
      };
    }
  } else {
    // International E.164 rules (minimum 6 digits, maximum 15 digits)
    if (cleaned.length < 6) {
      return {
        isValid: false,
        error: `Phone number is too short (${cleaned.length} digits).`,
      };
    }
    if (cleaned.length > 15) {
      return {
        isValid: false,
        error: `Phone number is too long (${cleaned.length} digits, max 15).`,
      };
    }
  }

  const prefix = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  const formattedPhone = `${prefix}${cleaned}`;

  return {
    isValid: true,
    formattedPhone,
    cleanDigits: cleaned,
  };
}

/**
 * Validates any already formed E.164 phone string (e.g. "+918852924002" or "+12025550123").
 */
export function isValidE164Phone(phone: string): boolean {
  if (!phone || !phone.trim()) return false;
  const clean = phone.trim();
  // Valid E.164 starts with + followed by 7 to 15 digits
  return /^\+[1-9]\d{6,14}$/.test(clean);
}

/**
 * Backward compatibility alias
 */
export function formatAndValidateIndianPhone(rawPhone: string | null | undefined): PhoneValidationResult {
  return formatAndValidatePhone(rawPhone, '+91');
}
