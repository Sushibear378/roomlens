'use client'

import { useRef, useState, useCallback } from 'react'

interface Props {
  onFile: (file: File, previewUrl: string) => void
  disabled?: boolean
  preview?: string | null
}

export default function UploadZone({ onFile, disabled, preview }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      onFile(file, url)
    },
    [onFile]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [disabled, handleFile]
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile]
  )

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      className={[
        'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors overflow-hidden',
        'aspect-video w-full cursor-pointer',
        disabled ? 'cursor-not-allowed opacity-60' : '',
        isDragOver
          ? 'border-stone-500 bg-stone-100'
          : preview
          ? 'border-transparent'
          : 'border-stone-200 bg-stone-50 hover:border-stone-400 hover:bg-stone-100',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />

      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Room preview" className="absolute inset-0 w-full h-full object-cover" />
          {!disabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
                Change photo
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 text-stone-400 p-8 text-center pointer-events-none">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-stone-600">
              {isDragOver ? 'Drop your photo here' : 'Drag & drop a room photo'}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">or click to browse — JPG, PNG, WEBP</p>
          </div>
        </div>
      )}
    </div>
  )
}
