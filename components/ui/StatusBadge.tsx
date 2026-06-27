export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

const badgeStyles: Record<AppointmentStatus, string> = {
  pending:   'bg-[#FFF0F2] text-[#C8102E] border-[#F5C0C8]',
  confirmed: 'bg-[#EEF2FF] text-[#1A3A6B] border-[#C0CCF0]',
  completed: 'bg-[#F5F5F5] text-[#555555] border-[#E5E5E5]',
  cancelled: 'bg-[#F5F5F5] text-[#999999] border-[#E5E5E5]',
  no_show:   'bg-[#FFF0F2] text-[#C8102E] border-[#F5C0C8]',
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
