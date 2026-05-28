import Link from 'next/link'
import BeforeAfterSlider from './components/BeforeAfterSlider'

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
        <span className="text-lg font-semibold tracking-tight">Roomlens</span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="text-sm bg-stone-900 text-white px-4 py-2 rounded-full hover:bg-stone-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-stone-100 text-stone-600 text-xs font-medium px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
          AI Room Redesign
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] max-w-2xl mb-5">
          Transform any room
          <br />
          <span className="text-stone-400">in seconds</span>
        </h1>

        <p className="text-stone-500 text-lg max-w-md mb-10 leading-relaxed">
          Upload a photo, pick a style, and watch AI reimagine your space —
          complete with a curated list of products to shop the look.
        </p>

        <div className="flex items-center gap-3 mb-16">
          <Link
            href="/login"
            className="bg-stone-900 text-white px-6 py-3 rounded-full font-medium hover:bg-stone-700 transition-colors"
          >
            Redesign your room
          </Link>
          <span className="text-stone-400 text-sm">Free to try</span>
        </div>

        {/* Slider */}
        <div className="w-full max-w-3xl">
          <p className="text-xs text-stone-400 mb-3 uppercase tracking-widest">
            Drag to compare
          </p>
          <BeforeAfterSlider />
        </div>
      </section>

      {/* Features strip */}
      <section className="border-t border-stone-100 py-12 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { title: 'Upload', body: 'Drag and drop any room photo' },
            { title: 'Choose a style', body: 'Japandi, Mid-Century, Bohemian, and more' },
            { title: 'Shop the look', body: 'Get matched furniture for your new design' },
          ].map((f) => (
            <div key={f.title}>
              <p className="font-semibold mb-1">{f.title}</p>
              <p className="text-stone-500 text-sm">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-100 py-6 px-6 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} Roomlens
      </footer>
    </main>
  )
}
