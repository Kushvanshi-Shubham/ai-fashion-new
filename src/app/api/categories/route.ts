import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  attributes: z.array(z.object({
    key: z.string().min(1, 'Attribute key is required'),
    label: z.string().min(1, 'Attribute label is required'),
    type: z.enum(['TEXT', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'BOOLEAN', 'RANGE', 'COLOR', 'URL', 'DATE']),
    required: z.boolean().default(false),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
      description: z.string().optional()
    })).optional(),
    aiExtractable: z.boolean().default(true),
    aiWeight: z.number().min(0).max(1).default(1.0),
    aiPromptHint: z.string().optional()
  })).default([])
})

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        attributes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: { extractions: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: categories,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        total: categories.length
      }
    })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)
    
    const { name, description, attributes } = validatedData

    const category = await prisma.category.create({
      data: {
        name,
        description,
        aiPromptTemplate: `Analyze this ${name.toLowerCase()} image and extract the following attributes with high accuracy. Focus on clearly visible features only.`,
        attributes: {
          create: attributes.map((attr, index) => ({
            key: attr.key,
            label: attr.label,
            type: attr.type,
            required: attr.required,
            options: attr.options ? JSON.stringify(attr.options) : null,
            aiExtractable: attr.aiExtractable,
            aiWeight: attr.aiWeight,
            aiPromptHint: attr.aiPromptHint,
            sortOrder: index + 1
          }))
        }
      },
      include: {
        attributes: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: category,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input data',
          details: error.errors,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID()
          }
        },
        { status: 400 }
      )
    }

    console.error('Category creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create category',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      },
      { status: 500 }
    )
  }
}
