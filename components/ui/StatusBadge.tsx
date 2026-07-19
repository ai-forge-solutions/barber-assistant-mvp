export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

const badgeStyles: Record<AppointmentStatus, string> = {
  pending:   'bg-white text-[#C8102E] border-[#C8102E]',
  confirmed: 'bg-white text-[#1A3A6B] border-[#1A3A6B]',
  completed: 'bg-white text-[#555555] border-[#E5E5E5]',
  cancelled: 'bg-white text-[#999999] border-[#E5E5E5]',
  no_show:   'bg-white text-[#C8102E] border-[#C8102E]',
}

const badgeLabels: Record<AppointmentStatus, string> = {
  pending:   'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show:   'No-show',
}

interface StatusBadgeProps {
  status: AppointmentStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`font-['Oswald'] font-semibold text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-sm border ${badgeStyles[status]}`}
    >
      {badgeLabels[status]}
    </span>
  )
}
