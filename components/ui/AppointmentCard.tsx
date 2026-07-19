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
      className={`w-full flex items-start gap-3 border-2 border-[#111111] border-l-4 ${statusBorderStyles[status]} rounded-sm bg-white px-4 py-4 text-left min-h-[76px] transition-colors hover:border-[#1A3A6B]`}
    >
      {/* Hora */}
      <div className="w-[54px] shrink-0 pt-0.5">
        <span className="block font-['Oswald'] font-bold text-[26px] text-[#111111] leading-none">
          {time}
        </span>
        {period && (
          <span className="block font-['DM_Sans'] text-[10px] text-[#999999] uppercase tracking-[0.1em] mt-1">
            {period}
          </span>
        )}
      </div>

      {/* Separador */}
      <div className="w-px min-h-11 bg-[#E5E5E5] shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="font-['Oswald'] font-semibold text-[16px] leading-tight text-[#111111] break-words">
          {clientName}
        </p>
        <p className="font-['DM_Sans'] text-[12px] text-[#999999] mt-1 break-words">
          {service} · {duration} min
        </p>
      </div>

      {/* Badge */}
      <div className="shrink-0 max-w-[96px]">
        <StatusBadge status={status} />
      </div>
    </button>
  )
}
