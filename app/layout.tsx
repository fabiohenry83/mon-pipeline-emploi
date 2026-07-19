import { Toaster } from 'react-hot-toast';
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning>
        {children}
        {/* Le Toaster doit être à l'intérieur du body ! */}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}