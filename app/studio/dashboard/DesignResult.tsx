'use client'

import type { GenerateResult } from '@/app/studio/actions'
import DesignSlider from './DesignSlider'

type DesignData = Extract<GenerateResult, { ok: true }>['design']

interface Props {
  design: DesignData
  onReset: () => void
}

export default function DesignResult({ design, onReset }: Props) {
  const { roomUpload, matchedProducts, generatedUrl } = design

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {roomUpload.style} · {roomUpload.roomType}
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">Drag the slider to compare before &amp; after</p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-stone-500 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-xl transition-colors hover:border-stone-400"
        >
          New design
        </button>
      </div>

      {/* Main layout: slider + sidebar */}
      <div className="flex gap-6 items-start">
        {/* Before/After slider */}
        <div className="flex-1 min-w-0">
          <DesignSlider
            beforeSrc={roomUpload.originalUrl}
            afterSrc={generatedUrl ?? 'https://placehold.co/900x600/e2e8f0/64748b?text=AI+Redesign'}
          />
        </div>

        {/* Shop the Look sidebar */}
        <div className="w-72 shrink-0 space-y-3">
          <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-widest">Shop the Look</h3>
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {matchedProducts.map((product) => (
              <a
                key={product.id}
                href={product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-3 rounded-xl border border-stone-100 hover:border-stone-300 hover:shadow-sm transition-all group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover shrink-0 bg-stone-100"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate group-hover:text-stone-900">
                    {product.name}
                  </p>
                  <p className="text-xs text-stone-500 capitalize mt-0.5">{product.category}</p>
                  <p className="text-sm font-semibold text-stone-900 mt-1">{product.price}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
