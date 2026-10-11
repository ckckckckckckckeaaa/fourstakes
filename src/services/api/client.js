const API_URL = import.meta.env.VITE_API_URL || '/api'

const idempotencyKey = () => crypto.randomUUID()

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
  } catch {
    throw new ApiError('We could not reach the account service. Please try again shortly.', 0, {})
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new ApiError(payload.message || 'The request could not be completed.', response.status, payload)
  }
  return response.status === 204 ? null : response.json()
}

export const accountApi = {
  me: () => apiRequest('/me'),
  wallets: () => apiRequest('/wallets'),
  portfolio: () => apiRequest('/portfolio'),
  portfolioHistory: (timeframe = '1M') => apiRequest(`/portfolio/history?timeframe=${timeframe}`),
  ledger: () => apiRequest('/ledger'),
  markets: () => apiRequest('/markets'),
  stakingPools: () => apiRequest('/staking-pools'),
  stakingPositions: () => apiRequest('/staking-positions'),
  networkActivity: () => apiRequest('/network-activity'),
  linkWallet: (payload) => apiRequest('/wallets/link', { method: 'POST', body: JSON.stringify(payload) }),
  verifyWallet: (payload) => apiRequest('/wallets/verify', { method: 'POST', body: JSON.stringify(payload) }),
  disconnectWallet: (id) => apiRequest(`/wallets/${id}`, { method: 'DELETE' }),
  createDeposit: (payload) => apiRequest('/deposits', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey() }, body: JSON.stringify(payload) }),
  createStake: (payload) => apiRequest('/staking', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey() }, body: JSON.stringify(payload) }),
  createUnstake: (payload) => apiRequest('/unstaking', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey() }, body: JSON.stringify(payload) }),
  createWithdrawal: (payload) => apiRequest('/withdrawals', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey() }, body: JSON.stringify(payload) }),
}
