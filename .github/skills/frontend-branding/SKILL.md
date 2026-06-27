---
name: turno-brand
description: Aplica el sistema de diseño de TURNO. a cualquier pantalla Next.js/Tailwind del proyecto — landing, app de barbero y página pública de barbería. Úsala SIEMPRE que toques UI. Modo estricto: rechaza colores fuera de paleta, fuentes no permitidas y componentes que no sigan el sistema.
---

# TURNO. · Sistema de Diseño (modo estricto)

Eres un diseñador-ingeniero trabajando en **TURNO.**, un SaaS de gestión
de citas para barberías independientes en España.
Stack: **Next.js 14 (App Router) · Tailwind CSS · Supabase**.

Tu trabajo es que cada pantalla que toques salga con el branding correcto
sin que nadie tenga que pedírtelo explícitamente.

---

## Contexto del producto

TURNO. tiene tres superficies distintas:

| Superficie | Quién la usa | Mood |
|---|---|---|
| Landing de captación | Barbero que aún no es cliente | Impacto, confianza, reconocimiento de gremio |
| App — agenda del barbero | Barbero en su día a día | Funcional, rápido, legible en móvil |
| Página pública `/[slug]` | Cliente final que va a reservar | Limpio, fácil, inspirador de confianza |

Las tres comparten la misma paleta y tipografía. El tono visual cambia
solo en el navbar (oscuro en la app, blanco en landing y página pública).

---

## Paleta de color

### Valores exactos

```
--color-negro:       #111111   /* base, textos, bordes fuertes, navbar app */
--color-blanco:      #FFFFFF   /* fondo principal de todas las superficies */
--color-rojo:        #C8102E   /* acción primaria, alertas, estado pendiente */
--color-azul:        #1A3A6B   /* estado confirmado, acción secundaria */
--color-gris-borde:  #E5E5E5   /* separadores, bordes sutiles */
--color-gris-texto:  #555555   /* cuerpo de texto secundario */
--color-gris-muted:  #999999   /* placeholders, metadatos */
```

### Reglas de uso

- **Rojo** = acción primaria (CTA), estado pendiente, alertas
- **Azul** = estado confirmado, acción secundaria, enlaces
- **Negro** = navbar de la app, textos de peso, bordes fuertes
- **Blanco** = fondo de todas las superficies sin excepción
- **Nunca** usar grises intermedios inventados fuera de la paleta
- **Nunca** usar colores fuera de este sistema (no hay verde de éxito,
  no hay amarillo, no hay morado)
- Para éxito usar azul (#1A3A6B). Para error usar rojo (#C8102E).

### El ornamento de franja

La franja rojo/blanco/azul es el elemento decorativo de marca.
Se usa en header y footer de landing, y como borde izquierdo
de tarjetas de cita según estado.

```css
/* Franja horizontal — 6px, repetida */
background: repeating-linear-gradient(
  90deg,
  #C8102E 0px, #C8102E 33.3%,
  #FFFFFF 33.3%, #FFFFFF 66.6%,
  #1A3A6B 66.6%, #1A3A6B 100%
);
height: 6px;
```

---

## Tipografía

### Fuentes

```
Display / Logo:    Rye            (Google Fonts) — SOLO para nombre de marca y nombre de barbería
Headings / UI:     Oswald 600–700 (Google Fonts) — Títulos, botones, labels, nav
Cuerpo:            DM Sans 400    (Google Fonts) — Texto corrido, descripciones, emails
```

Importar siempre así en `layout.tsx` o `globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Rye&family=Oswald:wght@600;700&family=DM+Sans:wght@400;500&display=swap');
```

### Jerarquía

| Rol | Fuente | Tamaño | Peso | Uso |
|---|---|---|---|---|
| Logo TURNO. | Rye | 24–72px | — | Navbar, hero de landing |
| Nombre barbería | Rye | 28–48px | — | Página pública `/[slug]` |
| H1 landing | Oswald | 48–64px | 700 | Hero de captación |
| H2 sección | Oswald | 28–36px | 700 | Títulos de sección |
| H3 / card title | Oswald | 18–22px | 600 | Nombre de cliente en cita |
| Label / botón | Oswald | 12–15px | 600 | MAYÚSCULAS, letter-spacing 0.08em |
| Body | DM Sans | 14–16px | 400 | Descripciones, textos de apoyo |
| Meta / muted | DM Sans | 12–13px | 400 | Servicio, duración, hora secundaria |

### Reglas tipográficas estrictas

- **Rye NUNCA en UI funcional** — solo para el nombre de marca y el nombre
  de la barbería en la página pública. Nunca en botones, labels, headings
  de sección ni textos de la agenda.
- **Oswald siempre en mayúsculas** para botones y labels de estado.
- **No usar Inter, Roboto, Arial ni el system font** para ningún elemento
  visible. Si una fuente no carga, avisa — no hagas fallback silencioso.
- **No mezclar pesos** fuera de los definidos (no hay Oswald 400,
  no hay DM Sans 700).

---

## Componentes

### Botón primario

```tsx
// Fondo rojo, texto blanco, Oswald mayúsculas
<button className="
  bg-[#C8102E] text-white
  font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase
  px-6 py-3 rounded-sm
  hover:bg-[#A50D24] active:scale-[0.98]
  transition-colors duration-150
">
  Confirmar cita
</button>
```

### Botón secundario

```tsx
// Borde negro, texto negro, fondo transparente
<button className="
  bg-transparent text-[#111111]
  border-2 border-[#111111]
  font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase
  px-6 py-3 rounded-sm
  hover:bg-[#F5F5F5] active:scale-[0.98]
  transition-colors duration-150
">
  Bloquear hueco
</button>
```

### Botón ghost

```tsx
// Solo borde gris, texto gris
<button className="
  bg-transparent text-[#555555]
  border border-[#E5E5E5]
  font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase
  px-5 py-2.5 rounded-sm
  hover:border-[#111111] hover:text-[#111111]
  transition-colors duration-150
">
  Ver mis citas
</button>
```

### Tarjeta de cita (agenda del barbero)

El borde izquierdo de color codifica el estado:

```tsx
const statusStyles = {
  pending:   'border-l-[#C8102E]',  // rojo
  confirmed: 'border-l-[#1A3A6B]',  // azul
  completed: 'border-l-[#E5E5E5]',  // gris
  cancelled: 'border-l-[#E5E5E5]',  // gris
  no_show:   'border-l-[#C8102E]',  // rojo
}

<div className={`
  flex items-center gap-4
  border-2 border-[#111111] border-l-4 ${statusStyles[status]}
  rounded-sm bg-white px-5 py-4
`}>
  {/* Hora */}
  <div className="min-w-[56px]">
    <span className="font-['Oswald'] font-bold text-[28px] text-[#111111] leading-none">
      {time}
    </span>
    <span className="block font-['DM_Sans'] text-[10px] text-[#999999] uppercase tracking-[0.1em] mt-1">
      {period}
    </span>
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

  {/* Badge de estado */}
  <StatusBadge status={status} />
</div>
```

### Badge de estado

```tsx
const badgeStyles = {
  pending:   'bg-[#FFF0F2] text-[#C8102E] border-[#F5C0C8]',
  confirmed: 'bg-[#EEF2FF] text-[#1A3A6B] border-[#C0CCF0]',
  completed: 'bg-[#F5F5F5] text-[#555555] border-[#E5E5E5]',
  cancelled: 'bg-[#F5F5F5] text-[#999999] border-[#E5E5E5]',
  no_show:   'bg-[#FFF0F2] text-[#C8102E] border-[#F5C0C8]',
}

const badgeLabels = {
  pending:   'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show:   'No-show',
}

<span className={`
  font-['Oswald'] font-semibold text-[10px] tracking-[0.1em] uppercase
  px-2 py-1 rounded-sm border
  ${badgeStyles[status]}
`}>
  {badgeLabels[status]}
</span>
```

### Navbar — app del barbero

```tsx
<nav className="bg-[#111111] px-5 py-3.5 flex items-center justify-between">
  <span className="font-['Rye'] text-[22px] text-white tracking-[0.04em]">
    TURNO<span className="text-[#C8102E]">.</span>
  </span>
  <span className="font-['Oswald'] font-semibold text-[12px] text-[#999999] uppercase tracking-[0.1em]">
    {dayLabel} · {dateLabel}
  </span>
  {/* icono menú */}
</nav>
```

### Navbar — landing y página pública

```tsx
<nav className="bg-white border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between">
  <span className="font-['Rye'] text-[22px] text-[#111111] tracking-[0.04em]">
    TURNO<span className="text-[#C8102E]">.</span>
  </span>
  {/* nav links en Oswald */}
</nav>
```

### Franja de color (ornamento de marca)

```tsx
// Usar en top y bottom de landing, y en separadores de sección
<div className="h-[6px] w-full flex">
  <div className="flex-1 bg-[#C8102E]" />
  <div className="flex-1 bg-white border-y border-[#E5E5E5]" />
  <div className="flex-1 bg-[#1A3A6B]" />
  <div className="flex-1 bg-[#C8102E]" />
  <div className="flex-1 bg-white border-y border-[#E5E5E5]" />
  <div className="flex-1 bg-[#1A3A6B]" />
</div>
```

### Input / campo de formulario

```tsx
<input className="
  w-full
  border border-[#E5E5E5] focus:border-[#111111]
  rounded-sm px-4 py-3
  font-['DM_Sans'] text-[14px] text-[#111111]
  placeholder:text-[#999999]
  outline-none transition-colors duration-150
  bg-white
" />
```

---

## Spacing y layout

```
Border radius:  rounded-sm (2px) para botones y tarjetas
                rounded-none para separadores y franjas
                Nunca rounded-lg, nunca rounded-full excepto avatares
Touch targets:  mínimo 44×44px en todos los elementos interactivos
Padding cards:  px-5 py-4 (20px × 16px)
Gap entre citas: gap-2 (8px)
Max width app:  max-w-lg mx-auto (centrado en móvil)
Max width landing: max-w-4xl mx-auto
```

---

## Tono de voz en copy de UI

**SÍ:**
- Directo, tuteo siempre
- Verbos en imperativo para CTAs: "Confirmar", "Cancelar", "Reservar"
- Frases cortas sin adornos
- Ejemplos: "Tu agenda, sin caos." · "Ellos reservan. Tú trabajas."

**NO:**
- "Potencia tu negocio"
- "Optimiza tu flujo de trabajo"
- "Digitaliza tu barbería"
- "Solución integral"
- Usted. Nunca.

---

## Checklist antes de entregar cualquier pantalla

- [ ] ¿Solo colores de la paleta definida? Sin grises inventados.
- [ ] ¿Rye solo en logo y nombre de barbería?
- [ ] ¿Oswald en botones y labels, siempre mayúsculas?
- [ ] ¿DM Sans en cuerpo y textos de apoyo?
- [ ] ¿Borde izquierdo de color en tarjetas de cita según estado?
- [ ] ¿Franja rojo/blanco/azul presente en top de landing?
- [ ] ¿Touch targets ≥ 44px en móvil?
- [ ] ¿border-radius solo rounded-sm o rounded-none?
- [ ] ¿Copy en tuteo, sin jerga de startup?
- [ ] ¿Funciona en iOS Safari y Android Chrome?

Si algo falla, corrígelo antes de entregar. No pidas permiso para aplicar
el sistema — es la norma por defecto en este proyecto.

---

## Lo que NO debes hacer nunca

- Usar `Inter`, `Roboto`, `Arial` o el system font en elementos visibles
- Usar colores fuera de la paleta (#111111, #FFFFFF, #C8102E, #1A3A6B, #E5E5E5, #555555, #999999)
- Usar `rounded-lg`, `rounded-xl`, `rounded-full` en botones o tarjetas
- Usar `border-radius` > 4px en cualquier componente que no sea un avatar
- Poner Rye en headings de sección, botones o cualquier UI funcional
- Usar gradientes decorativos (solo la franja es válida)
- Escribir copy con "usted", gerundios de startup o promesas vagas
- Añadir sombras decorativas (box-shadow solo para focus rings)
