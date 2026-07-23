export interface NewAppointmentEmailData {
  barberName: string
  clientName: string
  clientEmail: string
  clientPhone: string
  shopName: string
  serviceName: string
  servicePrice: number
  startsAt: string // ISO timestamp
}

/** Returns an HTML email body for new appointment notification sent to the barber */
export function newAppointmentEmailHtml(data: NewAppointmentEmailData): string {
  const date = new Date(data.startsAt)
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const rows = [
    ['Cliente', data.clientName],
    ['Email', data.clientEmail || 'No disponible'],
    ['Móvil', data.clientPhone || 'No disponible'],
    ['Barbería', data.shopName],
    ['Servicio', data.serviceName],
    ['Fecha', formattedDate],
    ['Hora', formattedTime],
    ['Precio', `€${data.servicePrice.toFixed(2)}`],
  ]

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Nueva cita</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f5;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:#18181b;padding:24px 32px;">
      <h1 style="color:#fff;font-size:20px;margin:0;">✂️ Nueva cita</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#52525b;margin-top:0;">Hola ${data.barberName}, tienes una nueva reserva en ${data.shopName}:</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${rows.map(([label, value]) => `<tr><td style="padding:8px 0;color:#71717a;font-size:14px;">${label}</td><td style="padding:8px 0;color:#18181b;font-weight:600;text-align:right;">${value}</td></tr>`).join('')}
      </table>
      <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0;">Puedes gestionar la cita desde tu agenda en trujas</p>
    </div>
  </div>
</body>
</html>
`.trim()
}
