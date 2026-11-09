export interface PublicShop {
  id: string
  name: string
  slug: string
  address?: string | null
  timezone?: string
}

/** History is a convenience, never a membership/permission boundary. */
export function shopContext<T extends PublicShop>(known: T[], preferred: PublicShop | null) {
  return {
    known,
    preferred,
    selection: preferred ? 'explicit_preference' : known.length === 1 ? 'suggest_only_shop' : 'ask_customer',
    historyIsAccessRestriction: false,
    instructions: 'El historial no demuestra visitas ni limita dónde puedes reservar. No elijas la última barbería por defecto. Confirma la barbería con el cliente; una preferencia explícita es solo un valor por defecto que puede cambiarse. No guardes una preferencia sin que te lo pida.',
  }
}
