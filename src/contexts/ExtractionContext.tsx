import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { CategoryFormData, ExtractionResult } from '@/types/fashion'

interface ExtractionContextState {
  selectedCategory: CategoryFormData | null
  // allow partial ExtractionResult properties due to exactOptionalPropertyTypes
  extractions: (Partial<ExtractionResult> & { id: string })[]
  isProcessing: boolean
  error: string | null
}

type ExtractionAction =
  | { type: 'SET_CATEGORY'; payload: CategoryFormData | null }
  | { type: 'ADD_EXTRACTION'; payload: ExtractionResult }
  | { type: 'UPDATE_EXTRACTION'; payload: { id: string; update: Partial<ExtractionResult> } }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const ExtractionContext = createContext<{
  state: ExtractionContextState
  dispatch: React.Dispatch<ExtractionAction>
} | null>(null)

const initialState: ExtractionContextState = {
  selectedCategory: null,
  extractions: [],
  isProcessing: false,
  error: null,
}

function extractionReducer(state: ExtractionContextState, action: ExtractionAction): ExtractionContextState {
  switch (action.type) {
    case 'SET_CATEGORY':
      return { ...state, selectedCategory: action.payload }
    case 'ADD_EXTRACTION':
      return { ...state, extractions: [...state.extractions, action.payload] }
    case 'UPDATE_EXTRACTION':
      return {
        ...state,
        extractions: state.extractions.map(ext =>
          ext.id === action.payload.id ? { ...ext, ...action.payload.update } : ext
        ),
      }
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

export function ExtractionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(extractionReducer, initialState)

  return (
    <ExtractionContext.Provider value={{ state, dispatch }}>
      {children}
    </ExtractionContext.Provider>
  )
}

export function useExtraction() {
  const context = useContext(ExtractionContext)
  if (!context) {
    throw new Error('useExtraction must be used within an ExtractionProvider')
  }

  const { state, dispatch } = context

  const setCategory = useCallback(
    (category: CategoryFormData | null) => {
      dispatch({ type: 'SET_CATEGORY', payload: category })
    },
    [dispatch]
  )

  const addExtraction = useCallback(
    (extraction: ExtractionResult) => {
      dispatch({ type: 'ADD_EXTRACTION', payload: extraction })
    },
    [dispatch]
  )

  const updateExtraction = useCallback(
    (id: string, update: Partial<ExtractionResult>) => {
      dispatch({ type: 'UPDATE_EXTRACTION', payload: { id, update } })
    },
    [dispatch]
  )

  const setProcessing = useCallback(
    (isProcessing: boolean) => {
      dispatch({ type: 'SET_PROCESSING', payload: isProcessing })
    },
    [dispatch]
  )

  const setError = useCallback(
    (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    },
    [dispatch]
  )

  return {
    state,
    actions: {
      setCategory,
      addExtraction,
      updateExtraction,
      setProcessing,
      setError,
    },
  }
}