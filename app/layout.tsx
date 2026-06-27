import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TURNO. — Gestión de citas para barberías",
  description: "La agenda de tu barbería, sin caos. Reservas online, recordatorios automáticos y gestión de citas desde el móvil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rye&family=Oswald:wght@600;700&family=DM+Sans:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
