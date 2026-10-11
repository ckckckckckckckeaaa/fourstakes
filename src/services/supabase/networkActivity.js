const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const apiBaseUrl = import.meta.env.DEV ? '/supabase' : supabaseUrl
const realtimeBaseUrl = import.meta.env.DEV
  ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/supabase`
  : supabaseUrl?.replace(/^http/, 'ws')

export const isNetworkActivityConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export async function fetchNetworkActivity() {
  if (!isNetworkActivityConfigured) return []
  const response = await fetch(`${apiBaseUrl}/rest/v1/network_activity?select=id,network,symbol,event_type,amount,block_height,transaction_preview,address_preview,status,occurred_at&order=occurred_at.desc&limit=15`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  })
  if (!response.ok) throw new Error('Network activity is not available yet.')
  const rows = await response.json()
  return rows.map((row) => ({
    id: row.id, network: row.network, symbol: row.symbol, type: row.event_type,
    amount: row.amount, block: row.block_height, tx: row.transaction_preview,
    address: row.address_preview, status: row.status, timestamp: row.occurred_at,
  }))
}

export function subscribeNetworkActivity(onInsert) {
  if (!isNetworkActivityConfigured || !realtimeBaseUrl) return () => {}
  let socket
  let heartbeat
  let reconnect
  let closed = false
  const topic = 'realtime:public:network_activity'
  const connect = () => {
    socket = new WebSocket(`${realtimeBaseUrl}/realtime/v1/websocket?apikey=${encodeURIComponent(supabaseAnonKey)}&vsn=1.0.0`)
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ topic, event: 'phx_join', payload: { config: { broadcast: { self: false }, presence: { key: '' }, postgres_changes: [{ event: 'INSERT', schema: 'public', table: 'network_activity' }] } }, ref: '1' }))
      heartbeat = window.setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(Date.now()) })), 30000)
    })
    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.event === 'postgres_changes' && payload.payload?.data?.type === 'INSERT') onInsert(payload.payload.data.record)
      } catch {
        // Ignore malformed realtime frames; the current feed stays visible.
      }
    })
    socket.addEventListener('close', () => {
      window.clearInterval(heartbeat)
      if (!closed) reconnect = window.setTimeout(connect, 5000)
    })
  }
  connect()
  return () => {
    closed = true
    window.clearInterval(heartbeat)
    window.clearTimeout(reconnect)
    socket?.close()
  }
}
