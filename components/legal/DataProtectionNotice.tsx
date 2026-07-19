import Link from 'next/link'

type DataProtectionNoticeProps = {
  accepted?: boolean
  onAcceptedChange?: (accepted: boolean) => void
  required?: boolean
}

export default function DataProtectionNotice({
  accepted,
  onAcceptedChange,
  required = false,
}: DataProtectionNoticeProps) {
  return (
    <div className="border border-[#E5E5E5] rounded-sm bg-white px-4 py-3">
      <p className="font-['DM_Sans'] text-[12px] leading-relaxed text-[#555555]">
        Usaremos tu nombre, email y móvil solo para gestionar tu cita, enviarte confirmaciones,
        recordatorios y avisos relacionados con la reserva. La barbería actúa como responsable del
        servicio y trujas como proveedor tecnológico.
      </p>

      <details className="mt-2 group">
        <summary className="cursor-pointer font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#1A3A6B] list-none">
          Ver información de protección de datos
        </summary>
        <div className="mt-2 flex flex-col gap-2 font-['DM_Sans'] text-[12px] leading-relaxed text-[#555555]">
          <p>
            <strong className="text-[#111111] font-medium">Finalidad:</strong> gestionar reservas,
            contactar contigo por incidencias de la cita y enviar comunicaciones operativas como
            confirmaciones, cambios, cancelaciones y recordatorios.
          </p>
          <p>
            <strong className="text-[#111111] font-medium">Base legal:</strong> ejecución de la
            solicitud de reserva y, cuando corresponda, consentimiento para comunicaciones asociadas.
          </p>
          <p>
            <strong className="text-[#111111] font-medium">Conservación:</strong> durante la relación
            con la barbería y los plazos necesarios para atender obligaciones legales o reclamaciones.
          </p>
          <p>
            <strong className="text-[#111111] font-medium">Derechos:</strong> puedes solicitar acceso,
            rectificación, supresión, oposición, limitación o portabilidad contactando con la barbería.
          </p>
          <Link href="/legal/proteccion-datos" className="text-[#1A3A6B] underline underline-offset-2">
            Leer información completa
          </Link>
        </div>
      </details>

      {required && typeof accepted === 'boolean' && onAcceptedChange && (
        <label className="mt-3 flex items-start gap-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => onAcceptedChange(event.target.checked)}
            className="mt-1 h-4 w-4 rounded-sm border-[#111111] accent-[#C8102E]"
          />
          <span className="font-['DM_Sans'] text-[12px] leading-relaxed text-[#555555]">
            He leído y acepto la información de protección de datos para poder gestionar mi reserva.
          </span>
        </label>
      )}
    </div>
  )
}
