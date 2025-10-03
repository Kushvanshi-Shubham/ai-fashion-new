'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Download, 
  Edit, 
  Trash, 
  Eye,
  Plus,
  Heart,
  Star,
  User,
  Mail,
  Phone
} from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { CardList } from '@/components/ui/card-list'
import { Form, FormField, FormSection, FormAlert, validators } from '@/components/ui/form'
import { Modal, ConfirmModal, AlertModal, useModal, useConfirm } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Sample data for demonstrations
const sampleTableData = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    lastLogin: '2025-01-01',
    actions: 'edit'
  },
  {
    id: '2', 
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'inactive',
    lastLogin: '2024-12-15',
    actions: 'edit'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Moderator',
    status: 'active',
    lastLogin: '2025-01-02',
    actions: 'edit'
  }
]

const sampleCardData = [
  {
    id: '1',
    title: 'Modern Dashboard Design',
    description: 'A clean and modern dashboard interface with responsive layout and dark mode support.',
    image: '/next.svg',
    status: 'active' as const,
    tags: ['React', 'TypeScript', 'Tailwind'],
    metadata: {
      views: 1234,
      likes: 89,
      created: '2025-01-01'
    },
    actions: [
      { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: () => console.log('View') },
      { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: () => console.log('Edit') },
      { label: 'Delete', icon: <Trash className="w-4 h-4" />, onClick: () => console.log('Delete'), variant: 'destructive' as const }
    ]
  },
  {
    id: '2',
    title: 'E-commerce Platform',
    description: 'Full-stack e-commerce solution with payment integration and inventory management.',
    image: '/vercel.svg',
    status: 'pending' as const,
    tags: ['Next.js', 'Stripe', 'Prisma'],
    metadata: {
      views: 567,
      likes: 42,
      created: '2024-12-28'
    },
    actions: [
      { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: () => console.log('View') },
      { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: () => console.log('Edit') }
    ]
  },
  {
    id: '3',
    title: 'AI Chat Interface',
    description: 'Intelligent chat interface with real-time messaging and AI-powered responses.',
    status: 'error' as const,
    tags: ['OpenAI', 'WebSocket', 'Redis'],
    metadata: {
      views: 890,
      likes: 156,
      created: '2024-12-20'
    },
    actions: [
      { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: () => console.log('View') },
      { label: 'Retry', icon: <Plus className="w-4 h-4" />, onClick: () => console.log('Retry') }
    ]
  }
]

export default function ComponentDemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAlert, setShowAlert] = useState(false)

  const basicModal = useModal()
  const { confirm, confirmModal } = useConfirm()

  const tableColumns = [
    { key: 'name' as const, header: 'Name', sortable: true },
    { key: 'email' as const, header: 'Email', sortable: true },
    { key: 'role' as const, header: 'Role', filterable: true },
    { 
      key: 'status' as const, 
      header: 'Status', 
      sortable: true,
      render: (item: typeof sampleTableData[0]) => (
        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      )
    },
    { key: 'lastLogin' as const, header: 'Last Login', sortable: true },
    {
      key: 'actions' as const,
      header: 'Actions',
      render: (item: typeof sampleTableData[0]) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => console.log('Edit', item.id)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={async () => {
              const confirmed = await confirm({
                title: 'Delete User',
                description: `Are you sure you want to delete ${item.name}? This action cannot be undone.`,
                variant: 'destructive'
              })
              if (confirmed) {
                console.log('Delete confirmed', item.id)
              }
            }}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    const nameError = validators.required(formData.name) || validators.minLength(2)(formData.name)
    if (nameError) errors.name = nameError
    
    const emailError = validators.required(formData.email) || validators.email(formData.email)
    if (emailError) errors.email = emailError
    
    const phoneError = validators.pattern(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number')(formData.phone)
    if (phoneError) errors.phone = phoneError
    
    const messageError = validators.required(formData.message) || validators.minLength(10)(formData.message)
    if (messageError) errors.message = messageError
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFormTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setFormTouched({
        name: true,
        email: true,
        phone: true,
        message: true
      })
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setShowAlert(true)
    
    // Reset form
    setFormData({ name: '', email: '', phone: '', message: '' })
    setFormTouched({})
  }

  const handleReset = () => {
    setFormData({ name: '', email: '', phone: '', message: '' })
    setFormErrors({})
    setFormTouched({})
  }

  return (
    <div className="container mx-auto py-8 space-y-12">
      <div className="space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight"
        >
          Component Showcase
        </motion.h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Explore our modern, reusable UI components built with React, TypeScript, and Tailwind CSS. 
          These components feature smooth animations, proper loading states, and comprehensive accessibility support.
        </p>
      </div>

      {/* Data Table Demo */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Data Table</h2>
        <p className="text-muted-foreground">
          Advanced data table with sorting, filtering, pagination, and row selection.
        </p>
        
        <DataTable
          data={sampleTableData}
          columns={tableColumns}
          title="User Management"
          description="Manage users and their permissions"
          searchable
          filterable
          selectable
          exportable
          refreshable
          onExport={(items) => console.log('Export:', items)}
          onRefresh={() => console.log('Refresh data')}
          onRowClick={(item) => console.log('Row clicked:', item)}
        />
      </section>

      {/* Card List Demo */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Card List</h2>
        <p className="text-muted-foreground">
          Flexible card layout with grid and list views, search, and interactive actions.
        </p>
        
        <CardList
          items={sampleCardData}
          title="Project Gallery"
          description="Showcase of recent projects and designs"
          searchable
          sortable
          layout="grid"
          gridCols={3}
          onItemClick={(item) => console.log('Card clicked:', item)}
          emptyState={{
            title: 'No projects found',
            description: 'Create your first project to get started',
            action: { label: 'New Project', onClick: () => console.log('New project') }
          }}
        />
      </section>

      {/* Form Demo */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Form Components</h2>
        <p className="text-muted-foreground">
          Modern forms with validation, error handling, and smooth animations.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Form
            title="Contact Form"
            description="Get in touch with our team"
            errors={formErrors}
            touched={formTouched}
            values={formData}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onReset={handleReset}
            variant="bordered"
          >
            {showAlert && (
              <FormAlert
                type="success"
                title="Message Sent!"
                message="We'll get back to you within 24 hours."
                dismissible
                onDismiss={() => setShowAlert(false)}
              />
            )}

            <FormSection title="Personal Information" description="Tell us about yourself">
              <FormField
                name="name"
                label="Full Name"
                required
                description="Enter your first and last name"
              >
                <Input
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </FormField>

              <FormField
                name="email"
                label="Email Address"
                required
                description="We'll never share your email"
              >
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </FormField>

              <FormField
                name="phone"
                label="Phone Number"
                description="Include country code if international"
              >
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </FormField>
            </FormSection>

            <FormSection title="Your Message">
              <FormField
                name="message"
                label="Message"
                required
                description="Minimum 10 characters"
              >
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Tell us about your project..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                />
              </FormField>
            </FormSection>
          </Form>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">✨ Modern Design</h4>
                  <p className="text-sm text-muted-foreground">
                    Clean, accessible form components with consistent styling
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">🔍 Real-time Validation</h4>
                  <p className="text-sm text-muted-foreground">
                    Composable validators with instant feedback
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">🎭 Smooth Animations</h4>
                  <p className="text-sm text-muted-foreground">
                    Subtle transitions for error states and loading
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">📱 Mobile Responsive</h4>
                  <p className="text-sm text-muted-foreground">
                    Optimized for all screen sizes and touch devices
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modal Demo */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Modal Components</h2>
        <p className="text-muted-foreground">
          Flexible modal dialogs with animations and accessibility features.
        </p>

        <div className="flex flex-wrap gap-4">
          <Button onClick={basicModal.openModal}>
            Open Modal
          </Button>
          
          <Button 
            variant="destructive"
            onClick={async () => {
              const confirmed = await confirm({
                title: 'Delete Item',
                description: 'This action cannot be undone. Are you sure?',
                variant: 'destructive'
              })
              if (confirmed) {
                console.log('Item deleted')
              }
            }}
          >
            Delete with Confirmation
          </Button>
        </div>

        {/* Basic Modal */}
        <Modal
          open={basicModal.open}
          onOpenChange={basicModal.setOpen}
          title="Welcome to the Component Library"
          description="This is a demonstration of our modal component"
          size="lg"
        >
          <div className="space-y-4">
            <p>
              This modal demonstrates the flexibility and power of our component system. 
              It features smooth animations, keyboard navigation, and proper focus management.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Smooth enter/exit animations</li>
                    <li>• Keyboard navigation (ESC to close)</li>
                    <li>• Click outside to close</li>
                    <li>• Focus management</li>
                    <li>• Responsive sizing</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Variants</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Basic Modal</li>
                    <li>• Confirmation Dialog</li>
                    <li>• Alert Modal</li>
                    <li>• Custom Content</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={basicModal.closeModal}>
                Close
              </Button>
              <Button onClick={() => {
                basicModal.closeModal()
                console.log('Action completed')
              }}>
                Got it!
              </Button>
            </div>
          </div>
        </Modal>

        {/* Confirmation Modal */}
        {confirmModal}
      </section>

      {/* Component Summary */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Component Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  📊
                </div>
                Data Table
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Advanced tables with sorting, filtering, pagination, search, and bulk operations.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  🎴
                </div>
                Card List
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Flexible card layouts with grid/list views, search, and interactive actions.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  📝
                </div>
                Forms
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Modern forms with validation, error handling, and composable field components.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  🪟
                </div>
                Modals
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Accessible dialogs with animations, focus management, and multiple variants.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  🎨
                </div>
                Loading States
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Elegant loading spinners, skeletons, and empty states for better UX.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  ⚡
                </div>
                Animations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Smooth transitions and micro-interactions powered by Framer Motion.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}