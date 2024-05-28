import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const fontname = Open_Sans({
  style: 'normal',
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CompraInteligente: Encuentra los mejores precios',
  description:
    'CompraInteligente es un comparador de precios en línea que te ayuda a encontrar las mejores ofertas y los precios más bajos para tus productos favoritos. Compara precios de múltiples tiendas en un solo lugar y ahorra dinero en cada compra.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='es'>
      <body className={`${fontname.className} max-w-5xl mx-auto my-20 py-20`}>
        {children}
        <footer className='text-center text-xs text-slate-500'>
          <Link href='https://github.com/pedrosorrentino' target='_blank'>
            Creado con <span className='text-rose-500'>❤️</span> por Pedro
            Sorrentino
          </Link>
        </footer>
      </body>
    </html>
  );
}
