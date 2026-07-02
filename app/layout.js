import './globals.css'

export const metadata = {
  title: 'Quiz App',
  description: 'Frågesport underlagsapp',
}

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body className="antialiased">{children}</body>
    </html>
  )
}
