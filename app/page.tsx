import type { ReactNode } from 'react'
import Link from 'next/link'
import ColorStripe from '@/components/brand/ColorStripe'
import Logo from '@/components/brand/Logo'
import { PricingTeaser } from '@/components/pricing/PricingBlocks'

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

const trustNotes = [
  {
    label: 'Sin marketplace',
    title: 'Tu cliente reserva en tu página',
    text: 'trujas no te mete en una lista con otros locales. El enlace es para tu barbería.',
  },
  {
    label: 'Sin comisión',
    title: 'No pagas por cada reserva',
    text: 'El precio es mensual. Si entran más citas, no hay comisión extra por reserva.',
  },
  {
    label: 'Primer mes gratis',
    title: 'Lo pruebas con tu barbería real',
    text: 'Configuras servicios, barberos y horarios antes de decidir si encaja contigo.',
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
    answer: 'Sí. trujas no te quita WhatsApp; te quita la conversación pesada de cuadrar día y hora una y otra vez.',
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

function PhoneShell({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="mx-auto w-full max-w-[330px] rounded-[28px] border-2 border-[#111111] bg-[#111111] p-3">
      <div className="mx-auto mb-3 h-1 w-20 rounded-sm bg-[#E5E5E5]" />
      <div className="overflow-hidden rounded-[20px] border border-[#E5E5E5] bg-white">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-2 font-['DM_Sans'] text-[11px] text-[#111111]">
          <span>9:41</span>
          <span>{label}</span>
        </div>
        {children}
      </div>
      <div className="mx-auto mt-3 h-1 w-24 rounded-sm bg-[#E5E5E5]" />
    </div>
  )
}

function WhatsappMockup() {
  const messages = [
    { from: 'client', text: '¿Tienes hueco el jueves?' },
    { from: 'barber', text: 'El jueves lo tengo lleno.' },
    { from: 'client', text: 'Vale, ¿y el viernes?' },
    { from: 'barber', text: 'Viernes me queda 11:00 o 13:30.' },
    { from: 'client', text: 'Uy, esas no me van. ¿La semana que viene?' },
  ]

  return (
    <PhoneShell label="WhatsApp">
      <div className="flex items-center gap-3 border-b border-[#E5E5E5] px-3 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#111111] bg-[#111111] font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.08em] text-white">
          CL
        </div>
        <div>
          <p className="font-['Oswald'] text-[14px] font-semibold uppercase tracking-[0.08em] text-[#111111]">Cliente por WhatsApp</p>
          <p className="font-['DM_Sans'] text-[12px] text-[#999999]">en línea</p>
        </div>
      </div>
      <div className="flex min-h-[420px] flex-col gap-3 bg-white px-3 py-4">
        {messages.map((message) => (
          <div
            key={message.text}
            className={`max-w-[84%] rounded-sm border px-3 py-2 font-['DM_Sans'] text-[14px] leading-relaxed ${
              message.from === 'barber'
                ? 'self-end border-[#111111] bg-[#111111] text-white'
                : 'self-start border-[#E5E5E5] bg-white text-[#111111]'
            }`}
          >
            {message.text}
          </div>
        ))}
        <div className="mt-auto border-l-4 border-[#C8102E] bg-white px-3 py-3">
          <p className="font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#111111]">Esto no es una cita</p>
          <p className="mt-1 font-['DM_Sans'] text-[13px] leading-relaxed text-[#555555]">Es la conversación interminable.</p>
        </div>
      </div>
    </PhoneShell>
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

function ReminderMockup() {
  return (
    <PhoneShell label="Gmail">
      <div className="bg-[#E5E5E5] px-3 py-6">
        <div className="border-2 border-[#111111] bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#C8102E] font-['Oswald'] text-[14px] font-semibold uppercase text-[#C8102E]">
              M
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#111111]">Gmail</p>
              <p className="truncate font-['DM_Sans'] text-[12px] text-[#999999]">Barbería Norte</p>
            </div>
            <span className="font-['DM_Sans'] text-[11px] text-[#999999]">ahora</span>
          </div>
          <p className="mt-4 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">
            No te olvides, tienes cita hoy en Barbería Norte a las 17:00. Puedes modificar o cancelar la cita desde tu enlace de reservas.
          </p>
        </div>
      </div>
    </PhoneShell>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#E5E5E5]">
      <div className="mx-auto max-w-[1040px] bg-white">
        <ColorStripe />
        <main>
          <section className="border-b border-[#E5E5E5] bg-[#111111]">
            <div className="grid min-h-[620px] items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
              <div className="text-left">
                <Logo light size="lg" />
                <p className="mt-12 inline-block border border-[#C8102E] px-3 py-2 font-['Oswald'] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">
                  Para barberos independientes en España
                </p>
                <h1 className="mt-6 max-w-xl font-['Oswald'] text-[44px] font-bold uppercase leading-[0.95] text-white sm:text-[58px] lg:text-[64px]">
                  Reservas online. WhatsApp solo cuando hace falta.
                </h1>
                <p className="mt-6 max-w-lg font-['DM_Sans'] text-[17px] leading-relaxed text-white">
                  trujas ordena servicios, barberos y horas en un enlace claro. Tus clientes eligen hueco; tú ves la agenda sin perseguir mensajes.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PrimaryCta>Crear mi agenda gratis</PrimaryCta>
                  <Link
                    href="/pricing"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-sm border-2 border-white px-6 py-3 font-['Oswald'] text-[14px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:bg-white hover:text-[#111111] active:scale-[0.98]"
                  >
                    Ver precio
                  </Link>
                </div>
                <div className="mt-8 grid gap-3 border-t border-[#555555] pt-6 sm:grid-cols-3">
                  {[
                    ['1 enlace', 'Reservas para tu barbería'],
                    ['0 comisión', 'No pagas por cita recibida'],
                    ['1 mes gratis', 'Lo pruebas con datos reales'],
                  ].map(([label, text]) => (
                    <div key={label} className="border-l-2 border-[#C8102E] pl-3">
                      <p className="font-['Oswald'] text-[18px] font-bold uppercase text-white">{label}</p>
                      <p className="mt-1 font-['DM_Sans'] text-[12px] leading-relaxed text-[#E5E5E5]">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-2 border-white bg-white p-4">
                <p className="font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">Lo que ve el barbero</p>
                <h2 className="mt-2 font-['Oswald'] text-[28px] font-bold uppercase leading-tight text-[#111111]">Agenda del día, sin rebuscar en chats</h2>
                <div className="mt-5">
                  <AppointmentMockup />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 font-['DM_Sans'] text-[13px] text-[#555555]">
                  <p className="border border-[#E5E5E5] px-3 py-3">Confirmadas y pendientes separadas.</p>
                  <p className="border border-[#E5E5E5] px-3 py-3">Servicios y duración a la vista.</p>
                </div>
              </div>
            </div>
          </section>

          <ColorStripe />

          <section className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex max-w-xl flex-col gap-3 font-['DM_Sans'] text-[17px] leading-relaxed text-[#555555]">
              <p>trujas gestiona tus citas en automático.</p>
              <p>Tus clientes reservan, reciben recordatorios y tú ves la agenda clara.</p>
            </div>
          </section>

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
              El problema no es dónde apuntas la cita.<br />
              Es la conversación interminable.
            </blockquote>
            <div className="mt-7">
              <WhatsappMockup />
            </div>
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
                  <h3 className="font-['Oswald'] text-[20px] font-semibold text-[#111111]">Los recordatorios los manda trujas</h3>
                </div>
                <p className="mt-3 font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">La gente no desaparece y tú te dejas de estar pendiente.</p>
                <div className="mt-4">
                  <ReminderMockup />
                </div>
              </article>
            </div>
          </section>

          <PricingTeaser />

          <section className="px-6 py-12 sm:px-8">
            <h2 className="text-center font-['Oswald'] text-[32px] font-bold uppercase text-[#111111]">Por qué encaja en una barbería pequeña</h2>
            <p className="mx-auto mt-4 max-w-lg text-center font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">
              Sin frases grandilocuentes: una página de reservas, una agenda diaria y un precio que no depende de cuántas citas entren.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {trustNotes.map((note) => (
                <article key={note.title} className="border border-[#E5E5E5] bg-white px-5 py-5">
                  <p className="font-['Oswald'] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">{note.label}</p>
                  <h3 className="mt-3 font-['Oswald'] text-[18px] font-semibold uppercase leading-tight text-[#111111]">{note.title}</h3>
                  <p className="mt-3 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">{note.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-[#E5E5E5] px-5 py-12 sm:px-8">
            <h2 className="text-center font-['Oswald'] text-[32px] font-bold uppercase text-[#111111]">Hecho solo para barberos de barrio</h2>
            <div className="mt-8 overflow-hidden border border-[#E5E5E5] bg-white">
              <div className="grid grid-cols-3 border-b border-[#E5E5E5] text-center font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#111111]">
                <div className="px-3 py-4" />
                <div className="bg-[#111111] px-3 py-4 text-white">trujas</div>
                <div className="px-3 py-4 text-[#555555]">Apps genéricas</div>
              </div>
              {[
                ['Precio recomendado', '15€/mes', '400–500€/año'],
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
            <h2 className="mx-auto max-w-lg font-['Oswald'] text-[36px] font-bold uppercase leading-tight text-[#111111]">trujas gestiona tus citas. Tú sigues cortando.</h2>
            <div className="mt-7">
              <PrimaryCta>Empieza ahora</PrimaryCta>
            </div>
            <p className="mt-4 font-['DM_Sans'] text-[12px] text-[#999999]">Sin compromiso. Tu primer mes es gratis.</p>
          </section>
        </main>

        <ColorStripe />
        <footer className="px-6 py-8 text-center">
          <Logo size="md" />
          <div className="mt-4 flex flex-col items-center gap-3 font-['DM_Sans'] text-[14px] sm:flex-row sm:justify-center">
            <Link href="/privacidad" className="text-[#999999] underline-offset-4 hover:text-[#111111] hover:underline">Privacidad</Link>
            <Link href="/terminos" className="text-[#999999] underline-offset-4 hover:text-[#111111] hover:underline">Términos</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
