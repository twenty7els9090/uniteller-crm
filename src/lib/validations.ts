import { z } from 'zod/v4'

export const leadSchema = z.object({
  id: z.string().optional(),
  organization: z.string().min(1, 'Название организации обязательно'),
  partner: z.string().min(1, 'Партнёр обязателен'),
  zayavka: z.enum(['Входящий', 'Выполнена', 'В работе', 'На паузе', 'Отклонена'], {
    error: 'Выберите статус заявки',
  }),
  status: z.string().default(''),
  activityType: z.string().default(''),
  comment: z.string().default(''),
  contactInfo: z.string().default(''),
  email: z.string().default(''),
  margin: z.string().default(''),
  manager: z.string().min(1, 'Менеджер обязателен'),
  turnoverTsp: z.string().default(''),
  ourRate: z.string().default(''),
  revenue: z.string().default(''),
  reported: z.boolean().default(false),
})

export type LeadFormData = z.input<typeof leadSchema>

export const additionalSchema = z.object({
  id: z.string().optional(),
  organization: z.string().min(1, 'Название организации обязательно'),
  partner: z.string().default(''),
  finInstrument: z.string().default(''),
  turnover: z.string().default(''),
  revenue: z.string().default(''),
})

export type AdditionalFormData = z.input<typeof additionalSchema>

export const churnSchema = z.object({
  id: z.string().optional(),
  organization: z.string().min(1, 'Название организации обязательно'),
  turnoverTsp: z.string().default(''),
  revenue: z.string().default(''),
  status: z.string().default(''),
  comment: z.string().default(''),
  reported: z.boolean().default(false),
  manager: z.string().min(1, 'Менеджер обязателен'),
})

export const relegalSchema = z.object({
  id: z.string().optional(),
  fromOrg: z.string().default(''),
  toOrg: z.string().default(''),
  action: z.string().default(''),
  manager: z.string().min(1, 'Менеджер обязателен'),
})

export type RelegalFormData = z.input<typeof relegalSchema>
export type ChurnFormData = z.input<typeof churnSchema>
