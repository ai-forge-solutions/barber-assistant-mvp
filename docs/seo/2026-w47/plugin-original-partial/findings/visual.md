# Visual audit trujas.app (2026-W47)

Capturas: screenshots/{home,pricing,guia}/trujas_app_{desktop,laptop,tablet,mobile}.png (mobile = 375x812 @2x, 750x1624). Las capturas del directorio raíz screenshots/ son sobrescrituras de una ejecución paralela y NO son fiables; ignorarlas. Se analizaron solo desktop y mobile. Laptop y tablet capturadas, NO analizadas.

## Hallazgos
1. ALTA - Banner de cookies tapa el above-the-fold en móvil (home, /pricing, guía). Ocupa ~y1005-1590 de 1624 (~36% del viewport, tarjeta con 2 botones apilados). En home móvil el CTA "Empezar gratis" no es visible en la captura (queda bajo el banner o bajo el pliegue). Desktop: el banner es una tarjeta centrada (~510x190) que tapa contenido de texto en las tres páginas. Nota: Rechazar/Aceptar tienen tamaño y peso iguales (correcto).
2. MEDIA - Home móvil: el H1 (5 líneas, ~80px a 2x) más badge y logo consumen casi todo el primer viewport; el CTA principal queda fuera del pliegue incluso sin banner (no verificable sin banner: NO MEDIDO). Desktop: H1, propuesta de valor y CTA "Empezar gratis" + "¿Ya tienes cuenta?" visibles y claros (correcto).
3. MEDIA - Interlineado del H1 muy ajustado: "OLVIDARTE" solapa visualmente con la línea superior ("¿Y SI PUDIERAS"), con el signo ¿ rozando la línea siguiente, en desktop y móvil.
4. MEDIA - Guía móvil: la cabecera se rompe. Logo a la izquierda y enlaces RECURSOS / SOBRE NOSOTROS / VER PLANES envueltos en 2 líneas (VER PLANES cae sola), sin menú hamburguesa; cabecera de ~245px a 2x (~120 css px).
5. BAJA - Desktop: la página se renderiza en una columna de ~1040px centrada sobre fondo gris (home/pricing), con mucho espacio vacío en 1920; la guía usa columna de ~730px. Decisión de diseño, no un fallo.
6. BAJA - /pricing desktop: texto secundario de precio ("15€/mes con permanencia de 12 meses", "Primer mes gratis") en gris claro y ~11-12px; contraste y tamaño bajos (valor exacto de contraste NO MEDIDO). El selector de permanencia tiene el texto del botón en 2 líneas.
7. BAJA - Guía: aparece "Borrador pendiente de revisión editorial, no de publicación" visible en la página pública (contenido, relevante para confianza/E-E-A-T más que para lo visual). Autoría "Equipo de trujas · Elaborado con ayuda de IA".
8. INFO - Mockup hero: en desktop se ve una tarjeta "Agenda del día, sin rebuscar en chats" (17:00 Marcos Ruiz / 18:00 Javier Soto), no un mockup de WhatsApp. El mockup de WhatsApp animado con opacity:0 inicial NO se localizó en el pliegue ni en capturas; su estado (invisible a bots/captura, riesgo de LCP/CLS) NO MEDIDO. En móvil la tarjeta no es visible en el primer viewport.

## NO MEDIDO
- CLS real (ni Lighthouse ni trace); no se observó salto visual en capturas estáticas, lo cual no lo descarta.
- Tap targets en px exactos (botones del banner ~48px css+; enlaces de cabecera de la guía y "Más información" probablemente <48px, sin medir).
- Scroll horizontal en móvil, tamaño de fuente base computado, contraste exacto.
- Mockup WhatsApp (ver 8). render_page.py --a11y-tree se ejecutó (salida 428KB en screenshots/home/render.json) pero no se analizó el árbol.
- Laptop y tablet.
- Contenido por debajo del pliegue (capturas solo viewport).
