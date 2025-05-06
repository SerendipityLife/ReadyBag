import { storage } from "../storage";

// Cache expiration time (6 hours in milliseconds)
const CACHE_EXPIRATION = 6 * 60 * 60 * 1000;

// Default exchange rates in case the API is unavailable
const DEFAULT_RATES = {
  JPY: 9.82, // 1 JPY = 9.82 KRW
  KRW: 0.1, // 1 KRW = 0.1 JPY
  USD: 1300, // 1 USD = 1300 KRW
};

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
    // In a real implementation, this would call an actual exchange rate API
    // For now, we'll use the default rates
    const rate = DEFAULT_RATES[fromCurrency] || 1;
    
    // Save the rate to the database
    const updatedRate = await storage.updateCurrencyRate(fromCurrency, toCurrency, rate);
    
    return {
      fromCurrency,
      toCurrency,
      rate: parseFloat(updatedRate.rate),
      lastUpdated: updatedRate.lastUpdated,
    };
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
