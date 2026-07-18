import type { ReactNode } from 'react'
import Link from 'next/link'
import ColorStripe from '@/components/brand/ColorStripe'
import Logo from '@/components/brand/Logo'

const problems = [
  {
    icon: '☰',
    title: 'Citas entre la libreta, las notas del móvil y la memoria',
    text: 'y rezas por acordarte de todas.',
  },
  {
    icon: '▯',
    title: 'Estás tomando algo y te suena el móvil: un cliente quiere hora',
    text: 'nunca sales del todo del trabajo.',
  },
  {
    icon: '×',
    title: 'Un cliente no se presenta',
    text: 'y esa hora ya no la recuperas.',
  },
]

const appointments = [
  {
    time: '17:00',
    client: 'Marcos Ruiz',
    service: 'Corte + barba · 30 min',
    status: 'Confirmada',
    color: 'border-l-[#1A3A6B]',
    badge: 'text-[#1A3A6B] border-[#1A3A6B]',
  },
  {
    time: '18:00',
    client: 'Javier Soto',
    service: 'Corte · 20 min',
    status: 'Pendiente',
    color: 'border-l-[#C8102E]',
    badge: 'text-[#C8102E] border-[#C8102E]',
  },
]

const testimonials = [
  {
    initials: 'RM',
    name: 'Rubén — Barbería Marconi',
    location: 'Lavapiés, Madrid',
    quote: 'Dejé de perder tardes contestando WhatsApp. Ahora el cliente coge hora y yo sigo cortando.',
  },
  {
    initials: 'AS',
    name: 'Antonio — Barbería San Blas',
    location: 'San Blas, Madrid',
    quote: 'Me gusta porque no va de postureo. Es una agenda clara y ya está. Para una barbería pequeña, eso vale oro.',
  },
  {
    initials: 'JV',
    name: 'Javi — El Sillón de Vallecas',
    location: 'Vallecas, Madrid',
    quote: 'Los recordatorios me han quitado muchos despistes. La gente llega más a su hora y yo voy menos apretado.',
  },
]

const faqs = [
  {
    question: '¿Y si mis clientes no saben usarlo?',
    answer: 'Reciben un enlace sencillo. Eligen servicio, barbero y hora. Si saben mandar un WhatsApp, pueden reservar aquí.',
  },
  {
    question: '¿Qué pasa si no tengo wifi en el local?',
    answer: 'Puedes revisar la agenda desde el móvil con tus datos. La página de reservas sigue funcionando para tus clientes.',
  },
  {
    question: '¿Puedo seguir usando WhatsApp con mis clientes?',
    answer: 'Sí. TURNO. no te quita WhatsApp; te quita la conversación pesada de cuadrar día y hora una y otra vez.',
  },
  {
    question: '¿Y si quiero dejarlo?',
    answer: 'No hay permanencia. Lo pruebas el primer mes y decides si encaja con tu barbería.',
  },
]

function PrimaryCta({ children }: { children: ReactNode }) {
  return (
    <Link
      href="/auth/barber?next=%2Fdashboard"
      className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-[#C8102E] px-8 py-3 font-['Oswald'] text-[14px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:bg-[#111111] active:scale-[0.98]"
    >
      {children}
    </Link>
  )
}

function WhatsappMockup() {
  return (
    <div className="mx-auto w-full max-w-[390px] border-2 border-[#111111] bg-white p-3 sm:p-4">
      <div className="border border-[#E5E5E5] bg-white">
        <div className="flex items-center gap-3 border-b border-[#E5E5E5] px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#111111] bg-[#111111] font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.08em] text-white">
            CL
          </div>
          <div>
            <p className="font-['Oswald'] text-[14px] font-semibold uppercase tracking-[0.08em] text-[#111111]">Cliente por WhatsApp</p>
            <p className="font-['DM_Sans'] text-[12px] text-[#999999]">Ahora</p>
          </div>
        </div>
        <div className="flex min-h-[520px] flex-col gap-3 bg-white px-3 py-4 sm:min-h-[560px]">
          <div className="max-w-[82%] self-start rounded-sm border border-[#E5E5E5] bg-white px-3 py-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#111111]">
            ¿Tienes hueco el jueves?
          </div>
          <div className="max-w-[82%] self-end rounded-sm border border-[#111111] bg-[#111111] px-3 py-2 font-['DM_Sans'] text-[14px] leading-relaxed text-white">
            No, el jueves está completo
          </div>
          <div className="max-w-[82%] self-start rounded-sm border border-[#E5E5E5] bg-white px-3 py-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#111111]">
            Vale, ¿y el viernes?
          </div>
          <div className="max-w-[82%] self-end rounded-sm border border-[#111111] bg-[#111111] px-3 py-2 font-['DM_Sans'] text-[14px] leading-relaxed text-white">
            Tengo a las 11:00 y a las 13:30
          </div>
          <div className="max-w-[86%] self-start rounded-sm border border-[#E5E5E5] bg-white px-3 py-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#111111]">
            Uy no, esas horas no me van... ¿tienes algo la semana que viene?
          </div>
          <div className="mt-auto border-l-4 border-[#C8102E] bg-white px-3 py-3">
            <p className="font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#111111]">Esto no es una cita</p>
            <p className="mt-1 font-['DM_Sans'] text-[13px] leading-relaxed text-[#555555]">Es tiempo que se te va entre corte y corte.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReservationMockup() {
  return (
    <div className="border-2 border-[#111111] bg-white p-4">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <div>
          <p className="font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#999999]">Reserva online</p>
          <p className="font-['Rye'] text-[24px] text-[#111111]">Barbería Norte</p>
        </div>
        <span className="border border-[#1A3A6B] px-2 py-1 font-['Oswald'] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1A3A6B]">Abierto</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {['Corte', 'Barba', 'Corte + barba', 'Afeitado'].map((service) => (
          <div key={service} className="border border-[#E5E5E5] px-3 py-3 font-['DM_Sans'] text-[13px] text-[#111111]">
            {service}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {['10:30', '11:00', '12:30', '13:30', '17:00', '18:30'].map((hour) => (
          <div key={hour} className="border border-[#111111] px-3 py-2 text-center font-['Oswald'] text-[13px] font-semibold text-[#111111]">
            {hour}
          </div>
        ))}
      </div>
      <button className="mt-4 min-h-[44px] w-full rounded-sm bg-[#C8102E] px-4 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-white">
        Reservar
      </button>
    </div>
  )
}

function AppointmentMockup() {
  return (
    <div className="flex flex-col gap-2">
      {appointments.map((appointment) => (
        <div key={appointment.time} className={`flex items-center gap-4 rounded-sm border-2 border-[#111111] border-l-4 ${appointment.color} bg-white px-5 py-4`}>
          <div className="min-w-[64px]">
            <p className="font-['Oswald'] text-[30px] font-bold leading-none text-[#111111]">{appointment.time}</p>
            <p className="mt-1 font-['DM_Sans'] text-[10px] uppercase tracking-[0.1em] text-[#999999]">PM</p>
          </div>
          <div className="h-10 w-px bg-[#E5E5E5]" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-['Oswald'] text-[16px] font-semibold text-[#111111]">{appointment.client}</p>
            <p className="mt-1 truncate font-['DM_Sans'] text-[12px] text-[#999999]">{appointment.service}</p>
          </div>
          <span className={`hidden border px-2 py-1 font-['Oswald'] text-[10px] font-semibold uppercase tracking-[0.1em] sm:inline-block ${appointment.badge}`}>
            {appointment.status}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#E5E5E5]">
      <div className="mx-auto max-w-[720px] bg-white">
        <ColorStripe />
        <header className="px-5 py-5 text-center">
          <Logo size="lg" />
        </header>

        <main>
          <section className="border-y border-[#E5E5E5]">
            <div className="relative min-h-[440px] overflow-hidden bg-[#111111] sm:min-h-[500px]">
              <img
                src="/landing/barbershop.webp"
                alt="Barbería clásica en blanco y negro"
                className="absolute inset-0 h-full w-full object-cover grayscale"
              />
              <div className="absolute inset-0 bg-[#111111] opacity-50" />
              <div className="relative z-10 flex min-h-[440px] flex-col justify-end px-6 pb-8 text-center sm:min-h-[500px] sm:px-10 sm:pb-12">
                <p className="mb-4 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.12em] text-white">Agenda para barberías de barrio</p>
                <h1 className="font-['Oswald'] text-[42px] font-bold uppercase leading-[0.95] text-white sm:text-[58px]">
                  Tu barbería,<br />sin libreta ni WhatsApp descontrolado
                </h1>
              </div>
            </div>
            <div className="px-6 py-8 text-center sm:px-12">
              <p className="mx-auto max-w-xl font-['DM_Sans'] text-[17px] leading-relaxed text-[#555555]">
                TURNO. gestiona las citas de tu barbería en automático. Tus clientes reservan solos y tú dejas de perder tiempo contestando mensajes entre corte y corte.
              </p>
              <div className="mt-7 flex flex-col items-center gap-4">
                <PrimaryCta>Empieza gratis</PrimaryCta>
                <a href="https://wa.me/" className="font-['DM_Sans'] text-[14px] text-[#1A3A6B] underline-offset-4 hover:underline">
                  ¿Prefieres que te lo enseñe? Escríbeme por WhatsApp →
                </a>
                <p className="font-['DM_Sans'] text-[12px] text-[#999999]">Sin tarjeta. Sin compromiso. Tu primer mes es gratis.</p>
              </div>
            </div>
          </section>

          <ColorStripe />

          <section className="px-6 py-12 sm:px-8">
            <h2 className="text-center font-['Oswald'] text-[32px] font-bold uppercase text-[#111111]">Sabes que esto te suena</h2>
            <div className="mt-8 flex flex-col gap-5">
              {problems.map((problem) => (
                <div key={problem.title} className="grid grid-cols-[28px_1fr] gap-4">
                  <span className="font-['Oswald'] text-[24px] font-semibold text-[#C8102E]">{problem.icon}</span>
                  <p className="font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">
                    <strong className="font-['Oswald'] text-[16px] font-semibold text-[#111111]">{problem.title}</strong> — {problem.text}
                  </p>
                </div>
              ))}
            </div>
            <blockquote className="mt-7 border-l-4 border-[#E5E5E5] pl-5 font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">
              El problema no es dónde apuntas la cita. Es la conversación interminable: “¿tienes hueco el jueves?”, “no, ¿y el viernes?”, “vale, ¿a qué hora?” — y así con cada cliente, cada día. ¿No es molesto?
            </blockquote>
          </section>

          <section className="bg-[#E5E5E5] px-5 py-12 sm:px-8">
            <h2 className="text-center font-['Oswald'] text-[32px] font-bold uppercase text-[#111111]">Así de simple para ti</h2>
            <div className="mt-8 flex flex-col gap-9">
              <article>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#111111] font-['Oswald'] text-[14px] font-semibold text-white">1</span>
                  <h3 className="font-['Oswald'] text-[20px] font-semibold text-[#111111]">Tu cliente reserva solo</h3>
                </div>
                <p className="mt-3 font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">Entra a tu enlace, elige barbero, servicio y hora. Sin llamarte, sin escribirte.</p>
                <div className="mt-4">
                  <ReservationMockup />
                </div>
              </article>

              <article>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#111111] font-['Oswald'] text-[14px] font-semibold text-white">2</span>
                  <h3 className="font-['Oswald'] text-[20px] font-semibold text-[#111111]">Tú ves tu agenda del día, clara</h3>
                </div>
                <p className="mt-3 font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">Confirmas, cancelas o marcas completado con un toque. Nada de scrollear un chat buscando quién quedó a las 5.</p>
                <div className="mt-4">
                  <AppointmentMockup />
                </div>
              </article>

              <article>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#111111] font-['Oswald'] text-[14px] font-semibold text-white">3</span>
                  <h3 className="font-['Oswald'] text-[20px] font-semibold text-[#111111]">Los recordatorios los manda TURNO.</h3>
                </div>
                <p className="mt-3 font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">Email 24h antes al cliente. Menos no-shows, sin que tengas que acordarte tú.</p>
              </article>
            </div>
          </section>

          <section className="px-5 py-12 sm:px-8">
            <h2 className="text-center font-['Oswald'] text-[32px] font-bold uppercase text-[#111111]">El WhatsApp que te roba el día</h2>
            <p className="mx-auto mt-3 max-w-lg text-center font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">
              En móvil lo ves casi a pantalla completa porque así se siente: una conversación pequeña que te corta el ritmo una y otra vez.
            </p>
            <div className="mt-7">
              <WhatsappMockup />
            </div>
          </section>

          <section className="bg-[#111111] px-6 py-12 text-center sm:px-10">
            <p className="mx-auto inline-block border border-[#C8102E] px-4 py-2 font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C8102E]">Oferta de apertura</p>
            <h2 className="mt-6 font-['Oswald'] text-[32px] font-bold uppercase leading-tight text-white">Solo para las primeras 50 barberías</h2>
            <p className="mx-auto mt-5 max-w-lg font-['DM_Sans'] text-[16px] leading-relaxed text-white">
              Tu primer mes, gratis. Y tu precio se queda bloqueado para siempre en <strong>150€/año</strong> — nunca subirá aunque el precio normal cambie más adelante.
            </p>
            <div className="mx-auto mt-6 inline-block border border-[#555555] px-5 py-2 font-['DM_Sans'] text-[14px] text-[#E5E5E5]">[ — / 50 plazas disponibles ]</div>
            <div className="mt-7">
              <PrimaryCta>Empezar mi mes gratis</PrimaryCta>
            </div>
          </section>

          <section className="px-6 py-12 sm:px-8">
            <h2 className="text-center font-['Oswald'] text-[32px] font-bold uppercase text-[#111111]">Barberías que ya dejaron la libreta</h2>
            <div className="mt-8 flex flex-col gap-4">
              {testimonials.map((testimonial) => (
                <article key={testimonial.initials} className="border border-[#E5E5E5] bg-white px-5 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-[#E5E5E5] font-['Oswald'] text-[14px] font-semibold text-[#111111]">{testimonial.initials}</div>
                    <div>
                      <h3 className="font-['Oswald'] text-[16px] font-semibold text-[#111111]">{testimonial.name}</h3>
                      <p className="font-['DM_Sans'] text-[12px] text-[#999999]">{testimonial.location}</p>
                    </div>
                  </div>
                  <p className="mt-4 font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">“{testimonial.quote}”</p>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-[#E5E5E5] px-5 py-12 sm:px-8">
            <h2 className="text-center font-['Oswald'] text-[32px] font-bold uppercase text-[#111111]">Hecho solo para barberos de barrio</h2>
            <div className="mt-8 overflow-hidden border border-[#E5E5E5] bg-white">
              <div className="grid grid-cols-3 border-b border-[#E5E5E5] text-center font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#111111]">
                <div className="px-3 py-4" />
                <div className="bg-[#111111] px-3 py-4 text-white">TURNO.</div>
                <div className="px-3 py-4 text-[#555555]">Apps genéricas</div>
              </div>
              {[
                ['Precio', '150€/año', '400–500€/año'],
                ['Comisiones por reserva', 'No', 'A veces'],
                ['Marketplace que te compara', 'No', 'Sí'],
                ['Pensado para', '1–3 sillas, barrio', 'Cadenas, salones'],
              ].map((row) => (
                <div key={row[0]} className="grid grid-cols-3 border-b border-[#E5E5E5] last:border-b-0">
                  {row.map((cell, index) => (
                    <div key={cell} className={`px-3 py-4 font-['DM_Sans'] text-[13px] ${index === 1 ? 'font-medium text-[#111111]' : 'text-[#555555]'}`}>
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="px-6 py-12 sm:px-8">
            <h2 className="text-center font-['Oswald'] text-[32px] font-bold uppercase text-[#111111]">Antes de que preguntes</h2>
            <div className="mt-8 divide-y divide-[#E5E5E5] border-y border-[#E5E5E5]">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-['Oswald'] text-[16px] font-semibold text-[#111111]">
                    {faq.question}
                    <span className="text-[#999999] group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-2 pr-8 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="px-6 py-12 text-center sm:px-10">
            <h2 className="mx-auto max-w-lg font-['Oswald'] text-[36px] font-bold uppercase leading-tight text-[#111111]">Tu primer mes es gratis. Lo demás lo decides tú.</h2>
            <div className="mt-7">
              <PrimaryCta>Empieza ahora</PrimaryCta>
            </div>
            <p className="mt-4 font-['DM_Sans'] text-[12px] text-[#999999]">Menos de 3 minutos para tener tu barbería lista.</p>
          </section>
        </main>

        <ColorStripe />
        <footer className="px-6 py-8 text-center">
          <Logo size="md" />
          <div className="mt-4 flex flex-col items-center gap-3 font-['DM_Sans'] text-[14px] sm:flex-row sm:justify-center">
            <a href="https://wa.me/" className="text-[#1A3A6B] underline-offset-4 hover:underline">Escríbenos por WhatsApp</a>
            <Link href="/privacidad" className="text-[#999999] underline-offset-4 hover:text-[#111111] hover:underline">Privacidad</Link>
            <Link href="/terminos" className="text-[#999999] underline-offset-4 hover:text-[#111111] hover:underline">Términos</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
