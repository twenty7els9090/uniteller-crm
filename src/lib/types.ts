export interface AuthUser {
  id: string
  username: string
  fullName: string
  role: 'uniteller'
}

export interface Additional {
  id: string
  organization: string
  partner: string
  finInstrument: string
  turnover: string
  revenue: string
  createdAt: string
  updatedAt: string
}

export interface Relegal {
  id: string
  fromOrg: string
  toOrg: string
  action: string
  manager: string
  createdAt: string
  updatedAt: string
}

export interface Churn {
  id: string
  organization: string
  turnoverTsp: string
  revenue: string
  status: string
  comment: string
  reported: boolean
  manager: string
  createdAt: string
  updatedAt: string
}

export interface StatsData {
  // Churn
  totalChurns: number
  churnsTurnover: number
  churnsRevenue: number
}
