// Get user's country from various sources
export const detectUserCountry = async (): Promise<string | null> => {
  try {
    // Try to get from browser locale first
    const browserCountry = getBrowserCountry();
    if (browserCountry) {
      return browserCountry;
    }

    // Fallback to IP-based detection using a free service
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.country_code) {
        return data.country_code.toUpperCase();
      }
    } catch (error) {
      console.warn('Failed to detect country from IP:', error);
    }

    // Final fallback - return null to use library default
    return null;
  } catch (error) {
    console.warn('Country detection failed:', error);
    return null;
  }
};

// Get country from browser locale
const getBrowserCountry = (): string | null => {
  try {
    const locale = navigator.language || navigator.languages?.[0];
    if (!locale) return null;

    // Extract country code from locale (e.g., 'en-US' -> 'US')
    const parts = locale.split('-');
    if (parts.length >= 2) {
      const countryCode = parts[1].toUpperCase();
      // Validate it's a 2-letter country code
      if (countryCode.length === 2 && /^[A-Z]{2}$/.test(countryCode)) {
        return countryCode;
      }
    }

    // Handle special cases for common locales
    const localeCountryMap: Record<string, string> = {
      'en': 'US',
      'es': 'ES',
      'fr': 'FR',
      'de': 'DE',
      'it': 'IT',
      'pt': 'BR',
      'ru': 'RU',
      'ja': 'JP',
      'ko': 'KR',
      'zh': 'CN',
      'ar': 'SA',
      'hi': 'IN'
    };

    const lang = parts[0].toLowerCase();
    return localeCountryMap[lang] || null;
  } catch (error) {
    console.warn('Failed to get country from browser locale:', error);
    return null;
  }
};