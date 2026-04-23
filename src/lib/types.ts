export interface Lead {
  id: string
  organization: string
  partner: string
  zayavka: string
  status: string | null
  activityType: string
  comment: string | null
  contactInfo: string
  email: string
  margin: string
  manager: string
  turnoverTsp: string
  ourRate: string
  revenue: string
  callDate: string | null
  reported: boolean
  statusChangedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface StatsData {
  totalLeads: number
  completedLeads: number
  inProgressLeads: number
  onHoldLeads: number
  rejectedLeads: number
  leadsByPartner: { partner: string; _count: { id: number } }[]
  leadsByZayavka: { zayavka: string; _count: { id: number } }[]
  rejectedByReason: { name: string; count: number }[]
  // Combat leads
  totalCombatLeads: number
  combatLeadsTurnover: number
  combatLeadsRevenue: number
  combatCompletedLeads: number
  // Churn
  totalChurns: number
  churnsTurnover: number
  churnsRevenue: number
  // Lead dynamics
  leadDynamics: { week: string; count: number }[]
  // Top orgs
  topOrgs: { organization: string; turnover: number; revenue: number; zayavka: string }[]
}

export interface AuthUser {
  id: string
  username: string
  fullName: string
  role: 'uniteller' | 'vtb'
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
