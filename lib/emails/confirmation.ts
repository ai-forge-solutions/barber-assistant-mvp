export interface ConfirmationEmailData {
  clientName: string
  shopName: string
  barberName: string
  serviceName: string
  servicePrice: number
  startsAt: string // ISO timestamp
  cancelUrl: string
}

/** Returns a plain-text HTML email body for appointment confirmation sent to the client */
export function confirmationEmailHtml(data: ConfirmationEmailData): string {
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
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Confirmación de cita</title></head>
<body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:#18181b;padding:24px 32px;">
      <h1 style="color:#fff;font-size:20px;margin:0;">✂️ ${data.shopName}</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:18px;color:#18181b;margin-top:0;">Cita confirmada</h2>
      <p style="color:#52525b;margin-bottom:24px;">Hola ${data.clientName}, tu cita ha quedado registrada.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">Barbero</td><td style="padding:8px 0;color:#18181b;font-weight:600;text-align:right;">${data.barberName}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">Servicio</td><td style="padding:8px 0;color:#18181b;font-weight:600;text-align:right;">${data.serviceName}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">Fecha</td><td style="padding:8px 0;color:#18181b;font-weight:600;text-align:right;">${formattedDate}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">Hora</td><td style="padding:8px 0;color:#18181b;font-weight:600;text-align:right;">${formattedTime}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">Precio</td><td style="padding:8px 0;color:#18181b;font-weight:600;text-align:right;">€${data.servicePrice.toFixed(2)}</td></tr>
      </table>
      <a href="${data.cancelUrl}" style="display:inline-block;padding:10px 20px;background:#ef4444;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Cancelar cita</a>
      <p style="color:#a1a1aa;font-size:12px;margin-top:24px;">El enlace de cancelación caduca en 48 horas.</p>
    </div>
  </div>
</body>
</html>
`.trim()
}
