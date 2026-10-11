import { apiRequest } from '../api/client'

export class MarketDataService {
  getAssetPrice(symbol) { return apiRequest(`/markets/${symbol}`) }
  getAssetMarketData(symbol) { return apiRequest(`/markets/${symbol}`) }
  getHistoricalPrices(symbol, timeframe = '1M') { return apiRequest(`/markets/${symbol}/history?timeframe=${timeframe}`) }
}

export const marketDataService = new MarketDataService()
