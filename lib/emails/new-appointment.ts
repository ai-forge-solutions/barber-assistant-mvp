export interface NewAppointmentEmailData {
  barberName: string
  clientName: string
  serviceName: string
  startsAt: string // ISO timestamp
}

/** Returns a plain-text HTML email body for new appointment notification sent to the barber */
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

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Nueva cita</title></head>
<body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:#18181b;padding:24px 32px;">
      <h1 style="color:#fff;font-size:20px;margin:0;">✂️ Nueva cita</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#52525b;margin-top:0;">Hola ${data.barberName}, tienes una nueva reserva:</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">Cliente</td><td style="padding:8px 0;color:#18181b;font-weight:600;text-align:right;">${data.clientName}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">Servicio</td><td style="padding:8px 0;color:#18181b;font-weight:600;text-align:right;">${data.serviceName}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">Fecha</td><td style="padding:8px 0;color:#18181b;font-weight:600;text-align:right;">${formattedDate}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">Hora</td><td style="padding:8px 0;color:#18181b;font-weight:600;text-align:right;">${formattedTime}</td></tr>
      </table>
    </div>
  </div>
</body>
</html>
`.trim()
}
