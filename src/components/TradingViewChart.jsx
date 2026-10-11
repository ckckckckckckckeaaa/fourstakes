import { useEffect, useRef } from 'react'
import { BINANCE_SYMBOLS } from '../services/marketData/binance'

export default function TradingViewChart({ asset = 'ETH' }) {
  const container = useRef(null)
  const pair = BINANCE_SYMBOLS[asset] || BINANCE_SYMBOLS.ETH

  useEffect(() => {
    const root = container.current
    if (!root) return undefined
    root.replaceChildren()
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.text = JSON.stringify({
      autosize: true, symbol: `BINANCE:${pair}`, interval: '60', timezone: 'Etc/UTC',
      theme: 'dark', style: '1', locale: 'en', allow_symbol_change: true,
      hide_side_toolbar: false, withdateranges: true, hide_legend: false,
      save_image: false, calendar: false, backgroundColor: '#11151a', gridColor: '#252b32',
      support_host: 'https://www.tradingview.com',
    })
    root.appendChild(script)
    return () => root.replaceChildren()
  }, [pair])

  return <div className="tradingview-chart" ref={container} aria-label={`${asset} live TradingView chart`} />
}
