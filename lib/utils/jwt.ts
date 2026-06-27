import { SignJWT, jwtVerify } from 'jose'

function getSecret(): Uint8Array {
  const secret = process.env.CANCEL_JWT_SECRET
  if (!secret) throw new Error('CANCEL_JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

/** Sign a cancel token for an appointment (expires in 48h) */
export async function signCancelToken(appointmentId: string): Promise<string> {
  return new SignJWT({ appointmentId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('48h')
    .setIssuedAt()
    .sign(getSecret())
}

/** Verify a cancel token and return the appointmentId */
export async function verifyCancelToken(
  token: string
): Promise<{ appointmentId: string }> {
  const { payload } = await jwtVerify(token, getSecret())
  if (typeof payload.appointmentId !== 'string') {
    throw new Error('Invalid token payload')
  }
  return { appointmentId: payload.appointmentId }
}
