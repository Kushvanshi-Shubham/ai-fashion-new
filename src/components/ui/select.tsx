// Select component for UI
import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
  disabled?: boolean
}

export interface SelectValueProps {
  placeholder?: string
  className?: string
}

export interface SelectContentProps {
  className?: string
  children: React.ReactNode
}

export interface SelectItemProps {
  value: string
  className?: string
  children: React.ReactNode
  onSelect?: () => void
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}>({
  open: false,
  setOpen: () => {}
})

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ 
      value: value || '', 
      onValueChange: onValueChange || (() => {}), 
      open, 
      setOpen 
    }}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        {children}
      </DropdownMenu>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ className, children, disabled = false }: SelectTriggerProps) {
  const { open } = React.useContext(SelectContext)

  return (
    <DropdownMenuTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        className={cn(
          'w-full justify-between',
          !open && 'text-muted-foreground',
          className
        )}
      >
        {children}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </DropdownMenuTrigger>
  )
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = React.useContext(SelectContext)
  
  return (
    <span className={cn(!value && 'text-muted-foreground')}>
      {value || placeholder}
    </span>
  )
}

export function SelectContent({ className, children }: SelectContentProps) {
  return (
    <DropdownMenuContent className={cn('w-full min-w-[8rem]', className)}>
      {children}
    </DropdownMenuContent>
  )
}

export function SelectItem({ value, className, children, onSelect }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext)
  const isSelected = selectedValue === value

  const handleSelect = () => {
    onValueChange?.(value)
    setOpen(false)
    onSelect?.()
  }

  return (
    <DropdownMenuItem
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      onSelect={handleSelect}
    >
      <Check
        className={cn(
          'mr-2 h-4 w-4',
          isSelected ? 'opacity-100' : 'opacity-0'
        )}
      />
      {children}
    </DropdownMenuItem>
  )
}