import type { ReactNode } from 'react'
import MobileMockup, { type ChatMessage } from '@/components/ui/great-ui-mobile-mockup'

export function ExampleMockup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure>
      {children}
      <figcaption className="mt-3 font-['DM_Sans'] text-[12px] leading-relaxed text-[#555555]">
        {label}. Datos ficticios para mostrar la interfaz.
      </figcaption>
    </figure>
  )
}

const messages: ChatMessage[] = [
  { id: 1, sender: 'Cliente de ejemplo', avatarInitial: 'C', text: 'Buenas, ¿tienes hueco mañana por la tarde?', isCurrentUser: false, timestamp: '18:42' },
  { id: 2, sender: 'Barbero de ejemplo', avatarInitial: 'B', text: 'Mañana voy completo.', isCurrentUser: true, timestamp: '18:44' },
  { id: 3, sender: 'Cliente de ejemplo', avatarInitial: 'C', text: '¿Y el viernes a última hora?', isCurrentUser: false, timestamp: '18:45' },
  { id: 4, sender: 'Barbero de ejemplo', avatarInitial: 'B', text: 'Me queda a las 18:30, pero tengo que confirmarlo.', isCurrentUser: true, timestamp: '18:48' },
  { id: 5, sender: 'Cliente de ejemplo', avatarInitial: 'C', text: 'Déjame mirar y te digo.', isCurrentUser: false, timestamp: '18:51' },
  { id: 6, sender: 'Barbero de ejemplo', avatarInitial: 'B', text: 'De acuerdo, avísame cuando lo sepas.', isCurrentUser: true, timestamp: '18:52' },
]

export function WhatsappExample() {
  return (
    <figure>
      <MobileMockup
        className="max-w-[245px] xs:max-w-[265px] sm:max-w-[305px]"
        headerTitle="Cliente de ejemplo"
        headerSubtitle="Conversación ficticia"
        avatarUrl=""
        avatarFallback="C"
        messages={messages}
      />
      <figcaption className="mt-3 font-['DM_Sans'] text-[12px] leading-relaxed text-[#555555]">
        Conversación ficticia para ilustrar cómo se cuadran citas por mensajes. No es un testimonio.
      </figcaption>
    </figure>
  )
}
