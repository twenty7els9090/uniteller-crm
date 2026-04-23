import { useSettings } from '@/hooks/use-settings'
import { PARTNERS, MANAGERS } from '@/lib/constants'

export function useDynamicOptions() {
  const { settings } = useSettings()

  return {
    partners: settings.partner.length > 0 ? settings.partner : [...PARTNERS],
    managers: settings.manager.length > 0 ? settings.manager : [...MANAGERS],
  }
}
