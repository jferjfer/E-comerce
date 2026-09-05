import { z } from 'zod'

export const emailSchema = z.string().email('Email inválido')

export const newsletterSchema = z.object({
  email: emailSchema
})

export const userPreferencesSchema = z.object({
  style: z.string().min(1, 'Selecciona un estilo'),
  colors: z.array(z.string()).min(1, 'Selecciona al menos un color'),
  size: z.string().min(1, 'Selecciona una talla')
})

export type NewsletterForm = z.infer<typeof newsletterSchema>
export type UserPreferencesForm = z.infer<typeof userPreferencesSchema>