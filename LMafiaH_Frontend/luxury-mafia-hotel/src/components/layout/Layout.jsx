import Navbar from './Navbar'
import Footer from './Footer'
import CustomCursor from '../common/CustomCursor'
import { PageTransition } from '../common/Motion'

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-obsidian">
      <div className="grain-overlay" />
      <CustomCursor />
      <Navbar />
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  )
}
