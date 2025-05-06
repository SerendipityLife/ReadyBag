import { storage } from "../storage";

// Cache expiration time (30 minutes in milliseconds for real-time updates)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// Default exchange rates in case the API is unavailable
const DEFAULT_RATES: Record<string, number> = {
  JPY: 9.94, // 1 JPY = 9.94 KRW (updated 2025.05.06)
  KRW: 0.1, // 1 KRW = 0.1 JPY
  USD: 1378, // 1 USD = 1378 KRW (updated 2025.05.06)
};

// Free currency API endpoint (ExchangeRate-API)
const API_URL = 'https://open.er-api.com/v6/latest';

/**
 * Get currency exchange rate from cache or API
 * @param fromCurrency Source currency code (e.g., "JPY")
 * @param toCurrency Target currency code (e.g., "KRW")
 * @returns Exchange rate data object
 */
export async function getCurrencyRate(fromCurrency: string, toCurrency: string = "KRW") {
  try {
    // Try to get rate from database
    const cachedRate = await storage.getCurrencyRate(fromCurrency, toCurrency);
    
    // Check if cached rate is valid and not expired
    if (
      cachedRate &&
      new Date().getTime() - new Date(cachedRate.lastUpdated).getTime() < CACHE_EXPIRATION
    ) {
      return {
        fromCurrency,
        toCurrency,
        rate: parseFloat(cachedRate.rate),
        lastUpdated: cachedRate.lastUpdated,
      };
    }
    
    // Try to fetch from exchange rate API
    try {
      const response = await fetch(`${API_URL}/${fromCurrency}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.rates && data.rates[toCurrency]) {
          const rate = data.rates[toCurrency];
          console.log(`실시간 환율 정보 업데이트: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
          
          // Save the rate to the database
          const updatedRate = await storage.updateCurrencyRate(fromCurrency, toCurrency, rate);
          
          return {
            fromCurrency,
            toCurrency,
            rate: parseFloat(updatedRate.rate),
            lastUpdated: updatedRate.lastUpdated,
          };
        }
      }
      
      // API call failed or returned invalid data, use backup value
      throw new Error('Exchange rate API returned invalid data');
    } catch (apiError) {
      console.warn('Exchange rate API error:', apiError);
      console.log('Using default rate as fallback');
      
      // Use default rate if API call fails
      const rate = DEFAULT_RATES[fromCurrency] || 1;
      const updatedRate = await storage.updateCurrencyRate(fromCurrency, toCurrency, rate);
      
      return {
        fromCurrency,
        toCurrency,
        rate: parseFloat(updatedRate.rate),
        lastUpdated: updatedRate.lastUpdated,
      };
    }
  } catch (error) {
    console.error("Error getting currency rate:", error);
    
    // Return default rate as fallback
    return {
      fromCurrency,
      toCurrency,
      rate: DEFAULT_RATES[fromCurrency] || 1,
      lastUpdated: new Date(),
    };
  }
}
