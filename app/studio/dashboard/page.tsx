export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Designs</h1>
        <p className="text-stone-500 text-sm mt-1">Your AI-redesigned rooms will appear here.</p>
      </div>

      <div className="border-2 border-dashed border-stone-200 rounded-2xl p-16 text-center">
        <div className="text-stone-400 mb-3">
          <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-stone-600 font-medium mb-1">No designs yet</p>
        <p className="text-stone-400 text-sm">Upload your first room photo to get started</p>
      </div>
    </div>
  )
}
