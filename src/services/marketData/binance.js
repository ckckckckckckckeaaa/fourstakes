export const BINANCE_SYMBOLS = {
  ETH: 'ETHUSDT', SOL: 'SOLUSDT', BNB: 'BNBUSDT', SUI: 'SUIUSDT',
  ATOM: 'ATOMUSDT', TRX: 'TRXUSDT', AVAX: 'AVAXUSDT', POL: 'POLUSDT',
}

const assetForPair = (pair) => Object.entries(BINANCE_SYMBOLS).find(([, value]) => value === pair)?.[0]
const toMarket = (ticker) => {
  const symbol = assetForPair(ticker.symbol || ticker.s)
  if (!symbol) return null
  return {
    symbol,
    priceUsd: Number(ticker.lastPrice || ticker.c || 0),
    change24h: Number(ticker.priceChangePercent || ticker.P || 0),
    timestamp: new Date(Number(ticker.closeTime || ticker.E || Date.now())).toISOString(),
    source: 'binance',
  }
}

export async function fetchBinanceMarkets() {
  const response = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr')
  if (!response.ok) throw new Error('Binance market data is unavailable.')
  const tickers = await response.json()
  return tickers.map(toMarket).filter(Boolean)
}

export function subscribeBinanceMarkets(onUpdate) {
  const streams = Object.values(BINANCE_SYMBOLS).map((pair) => `${pair.toLowerCase()}@ticker`).join('/')
  const socket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`)
  socket.onmessage = (event) => {
    try {
      const market = toMarket(JSON.parse(event.data).data)
      if (market) onUpdate(market)
    } catch {
      // Ignore malformed public market messages.
    }
  }
  return () => socket.close()
}
