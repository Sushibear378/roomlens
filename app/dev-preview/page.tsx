import StudioDashboard from '@/app/studio/dashboard/StudioDashboard'

// Temporary preview route — NOT for production
export default function DevPreviewPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white">
        <span className="text-lg font-semibold tracking-tight">Roomlens</span>
        <span className="text-sm text-stone-400">dev-preview</span>
      </nav>
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <StudioDashboard userId="dev-preview-user" />
      </main>
    </div>
  )
}
