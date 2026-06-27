import StatusBadge, { AppointmentStatus } from './StatusBadge'

const statusBorderStyles: Record<AppointmentStatus, string> = {
  pending:   'border-l-[#C8102E]',
  confirmed: 'border-l-[#1A3A6B]',
  completed: 'border-l-[#E5E5E5]',
  cancelled: 'border-l-[#E5E5E5]',
  no_show:   'border-l-[#C8102E]',
}

export interface AppointmentCardData {
  id: string
  status: AppointmentStatus
  time: string   // e.g. "09:30"
  period?: string // e.g. "AM"
  clientName: string
  service: string
  duration: number
}

interface AppointmentCardProps {
  appointment: AppointmentCardData
  onClick?: () => void
}

export default function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const { status, time, period, clientName, service, duration } = appointment

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 border-2 border-[#111111] border-l-4 ${statusBorderStyles[status]} rounded-sm bg-white px-5 py-4 text-left min-h-[64px]`}
    >
      {/* Hora */}
      <div className="min-w-[56px]">
        <span className="font-['Oswald'] font-bold text-[28px] text-[#111111] leading-none">
          {time}
        </span>
        {period && (
          <span className="block font-['DM_Sans'] text-[10px] text-[#999999] uppercase tracking-[0.1em] mt-1">
            {period}
          </span>
        )}
      </div>

      {/* Separador */}
      <div className="w-px h-9 bg-[#E5E5E5] shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-['Oswald'] font-semibold text-[16px] text-[#111111] truncate">
          {clientName}
        </p>
        <p className="font-['DM_Sans'] text-[12px] text-[#999999] mt-0.5 truncate">
          {service} · {duration} min
        </p>
      </div>

      {/* Badge */}
      <StatusBadge status={status} />
    </button>
  )
}
