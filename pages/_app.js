import '../styles/globals.css'
import dynamic from 'next/dynamic'

const Navigation = dynamic(() => import('../src/components/Navigation'), { ssr: false })

// FullCalendar CSS imports have been moved to the component that uses FullCalendar

export default function App({ Component, pageProps }) {
  return (
    <>
      <Navigation />
      <Component {...pageProps} />
    </>
  )
}
