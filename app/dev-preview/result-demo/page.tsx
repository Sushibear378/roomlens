'use client'

import DesignResult from '@/app/studio/dashboard/DesignResult'

const MOCK_DESIGN = {
  id: 'demo-001',
  status: 'COMPLETED',
  generatedUrl: 'https://placehold.co/900x600/d4c5b0/4a3f35?text=Japandi+Redesign',
  roomUpload: {
    originalUrl: 'https://placehold.co/900x600/f5f0eb/8a7968?text=Original+Room',
    roomType: 'Living Room',
    style: 'Japandi',
  },
  matchedProducts: [
    { id: '1', name: 'Linen Sectional Sofa', price: '$1,299', imageUrl: 'https://placehold.co/300x200/e2e8f0/64748b?text=Sofa', productUrl: '#', category: 'sofa' },
    { id: '2', name: 'Wool Area Rug 8×10', price: '$349', imageUrl: 'https://placehold.co/300x200/fef3c7/92400e?text=Rug', productUrl: '#', category: 'rug' },
    { id: '3', name: 'Arched Floor Lamp', price: '$189', imageUrl: 'https://placehold.co/300x200/f1f5f9/475569?text=Lamp', productUrl: '#', category: 'lamp' },
    { id: '4', name: 'Walnut Coffee Table', price: '$499', imageUrl: 'https://placehold.co/300x200/fef9c3/713f12?text=Table', productUrl: '#', category: 'coffee table' },
    { id: '5', name: 'Fiddle Leaf Fig', price: '$79', imageUrl: 'https://placehold.co/300x200/dcfce7/166534?text=Plant', productUrl: '#', category: 'plant' },
  ],
}

export default function ResultDemoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white">
        <span className="text-lg font-semibold tracking-tight">Roomlens</span>
        <span className="text-sm text-stone-400">dev-preview · result demo</span>
      </nav>
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <DesignResult design={MOCK_DESIGN} onReset={() => {}} />
      </main>
    </div>
  )
}
