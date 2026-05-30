import '../styles/globals.css'
import dynamic from 'next/dynamic'

const Navigation = dynamic(() => import('../src/components/Navigation'), { ssr: false })

export default function App({ Component, pageProps }) {
  return (
    <>
      <Navigation />
      <Component {...pageProps} />
    </>
  )
}
