import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { Category, UploadedImage, ExtractionResult } from '@/types'

// Define the status type locally to avoid import issues
type ExtractionStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CACHED'

interface ExtractionProgress {
  id: string
  status: ExtractionStatus
  progress: number
  estimatedTime?: number
  currentStep?: string
}

interface ExtractionStore {
  // State
  selectedCategory?: Category
  uploadedImages: UploadedImage[]
  results: ExtractionResult[]
  isProcessing: boolean
  currentProgress?: ExtractionProgress
  error?: string

  // Actions
  setCategory: (category?: Category) => void
  addImages: (files: File[]) => void
  removeImage: (imageId: string) => void
  clearImages: () => void
  startExtraction: (imageId: string) => Promise<void>
  addResult: (result: ExtractionResult) => void
  clearResults: () => void
  setError: (error?: string) => void
  setProcessing: (processing: boolean) => void
  updateProgress: (progress: ExtractionProgress) => void
}

export const useExtractionStore = create<ExtractionStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Initial state
          uploadedImages: [],
          results: [],
          isProcessing: false,

          // Actions
          setCategory: (category) => set({ selectedCategory: category }),

          addImages: (files) => {
            const newImages: UploadedImage[] = files.map(file => ({
              id: crypto.randomUUID(),
              file,
              previewUrl: URL.createObjectURL(file),
              uploadProgress: 100,
              status: 'uploaded'
            }))
            set(state => ({ 
              uploadedImages: [...state.uploadedImages, ...newImages] 
            }))
          },

          removeImage: (imageId) => {
            const { uploadedImages } = get()
            const image = uploadedImages.find(img => img.id === imageId)
            if (image) {
              URL.revokeObjectURL(image.previewUrl)
            }
            set(state => ({
              uploadedImages: state.uploadedImages.filter(img => img.id !== imageId)
            }))
          },

          clearImages: () => {
            const { uploadedImages } = get()
            uploadedImages.forEach(image => {
              URL.revokeObjectURL(image.previewUrl)
            })
            set({ uploadedImages: [] })
          },

          startExtraction: async (imageId) => {
            const { selectedCategory, uploadedImages } = get()
            
            if (!selectedCategory) {
              set({ error: 'Please select a category first' })
              return
            }

            const image = uploadedImages.find(img => img.id === imageId)
            if (!image) {
              set({ error: 'Image not found' })
              return
            }

            set({ 
              isProcessing: true, 
              error: undefined,
              currentProgress: {
                id: imageId,
                status: 'PROCESSING' as ExtractionStatus,
                progress: 0,
                estimatedTime: 5000,
                currentStep: 'Uploading image...'
              }
            })

            try {
              // Update image status
              set(state => ({
                uploadedImages: state.uploadedImages.map(img =>
                  img.id === imageId ? { ...img, status: 'processing' } : img
                )
              }))

              // Simulate progress updates
              const progressSteps = [
                { progress: 20, step: 'Processing image...' },
                { progress: 50, step: 'Analyzing with AI...' },
                { progress: 80, step: 'Extracting attributes...' },
                { progress: 95, step: 'Finalizing results...' }
              ]

              for (const { progress, step } of progressSteps) {
                await new Promise(resolve => setTimeout(resolve, 500))
                set(state => ({
                  currentProgress: state.currentProgress ? {
                    ...state.currentProgress,
                    progress,
                    currentStep: step
                  } : undefined
                }))
              }

              // Call extraction API
              const formData = new FormData()
              formData.append('image', image.file)
              formData.append('categoryId', selectedCategory.id)

              const response = await fetch('/api/extract/simulate', {
                method: 'POST',
                body: formData
              })

              if (!response.ok) {
                throw new Error('Extraction failed')
              }

              const result = await response.json()

              if (!result.success) {
                throw new Error(result.error || 'Extraction failed')
              }

              // Update stores
              set(state => ({
                results: [...state.results, result.data],
                uploadedImages: state.uploadedImages.map(img =>
                  img.id === imageId ? { ...img, status: 'completed' } : img
                ),
                currentProgress: {
                  id: imageId,
                  status: 'COMPLETED' as ExtractionStatus,
                  progress: 100,
                  currentStep: 'Completed!'
                }
              }))

              // Clear progress after delay
              setTimeout(() => {
                set({ currentProgress: undefined })
              }, 2000)

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error'
              
              set(state => ({
                error: errorMessage,
                uploadedImages: state.uploadedImages.map(img =>
                  img.id === imageId ? { ...img, status: 'error' } : img
                ),
                currentProgress: {
                  id: imageId,
                  status: 'FAILED' as ExtractionStatus,
                  progress: 0,
                  currentStep: `Error: ${errorMessage}`
                }
              }))

              // Clear progress after delay
              setTimeout(() => {
                set({ currentProgress: undefined })
              }, 3000)
            } finally {
              set({ isProcessing: false })
            }
          },

          addResult: (result) => set(state => ({
            results: [...state.results, result]
          })),

          clearResults: () => set({ results: [] }),
          
          setError: (error) => set({ error }),
          
          setProcessing: (processing) => set({ isProcessing: processing }),
          
          updateProgress: (progress) => set({ currentProgress: progress })
        }),
        {
          name: 'extraction-store',
          partialize: (state) => ({
            selectedCategory: state.selectedCategory,
            results: state.results.slice(-5) // Keep only last 5 results
          })
        }
      )
    ),
    { name: 'ExtractionStore' }
  )
)
