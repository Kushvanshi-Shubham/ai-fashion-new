'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Circle,
  Settings,
  Images,
  Brain,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';


import CategorySelector from '@/components/CategorySelector';
import CategoryAttributeTable from '@/components/CategoryAttributeTable';
import ImageUpload from '@/components/ImageUpload';
import ExtractionResults from '@/components/ExtractionResults';
import { useCategoryWorkflow } from '@/hooks/useCategoryWorkflow';
import { CategoryFormData } from '@/types/fashion';
import { getCategoryStats } from '@/lib/category-processor';
import { cn } from '@/lib/utils';

type WorkflowStep = 'category' | 'attributes' | 'upload' | 'results';

export default function CategoryWorkflowPage() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('category');
  const workflow = useCategoryWorkflow({
    onCategoryChange: (category) => {
      if (category) {
        setCurrentStep('attributes');
      }
    }
  });

  const categoryStats = getCategoryStats();

  const handleCategorySelect = (category: CategoryFormData | null) => {
    workflow.setCategory(category);
    
    if (category) {
      setCurrentStep('attributes');
    }
  };

  const steps = [
    {
      id: 'category' as WorkflowStep,
      title: 'Select Category',
      description: 'Choose department → sub-department → major category',
      completed: !!workflow.selectedCategory,
      icon: Settings
    },
    {
      id: 'attributes' as WorkflowStep,
      title: 'Review Attributes',
      description: 'Preview extractable attributes for selected category',
      completed: !!workflow.selectedCategory && currentStep !== 'category',
      icon: BarChart3
    },
    {
      id: 'upload' as WorkflowStep,
      title: 'Upload Images',
      description: 'Upload images for AI attribute extraction',
      completed: workflow.uploadedImages.length > 0,
      icon: Images
    },
    {
      id: 'results' as WorkflowStep,
      title: 'View Results',
      description: 'Review extraction results and export data',
      completed: workflow.completedImages.length > 0,
      icon: Brain
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header & Progress */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              AI Fashion Extraction Workflow
            </h1>
            <p className="text-muted-foreground">
              Category-driven extraction for precise fashion attribute analysis
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {categoryStats.totalCategories} Categories Available
          </Badge>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Workflow Progress</CardTitle>
            <CardDescription>
              Follow these steps to extract fashion attributes from your images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = step.completed
                
                return (
                  <div key={step.id} className="flex items-center">
                    <Button
                      variant={isCompleted ? "default" : isActive ? "secondary" : "outline"}
                      size="sm"
                      className={cn(
                        "h-12 w-12 rounded-full p-0 transition-all",
                        isActive && "ring-2 ring-ring ring-offset-2"
                      )}
                      onClick={() => setCurrentStep(step.id)}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="ml-3 min-w-0 flex-1">
                      <p className={cn(
                        "text-sm font-medium",
                        isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <ChevronRight className="mx-4 h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sidebar - Category Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Selection</CardTitle>
              <CardDescription>
                Choose the fashion category for targeted extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategorySelector
                onCategorySelect={handleCategorySelect}
                selectedCategory={workflow.selectedCategory}
              />
            </CardContent>
          </Card>

          {/* Category Stats */}
          {workflow.selectedCategory && (
            <Card>
              <CardHeader>
                <CardTitle>Category Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Fields</span>
                  <Badge variant="outline">
                    {workflow.selectedCategory.totalAttributes}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">AI Extractable</span>
                  <Badge variant="default">
                    {workflow.selectedCategory.extractableAttributes}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Coverage</span>
                  <Badge variant="secondary">
                    {Math.round((workflow.selectedCategory.extractableAttributes / workflow.selectedCategory.totalAttributes) * 100)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {currentStep === 'category' && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Welcome to AI Extraction</CardTitle>
                <CardDescription className="text-base">
                  Start by selecting a fashion category to configure targeted attribute extraction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    Category selection ensures AI focuses only on relevant attributes. 
                    For example, &ldquo;Dresses&rdquo; will extract neckline and sleeve details, 
                    while &ldquo;Shoes&rdquo; won&apos;t include these irrelevant attributes.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-bold text-primary">
                      {categoryStats.totalDepartments}
                    </div>
                    <div className="text-sm text-muted-foreground">Departments</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-bold text-primary">
                      {categoryStats.totalSubDepartments}
                    </div>
                    <div className="text-sm text-muted-foreground">Sub-Departments</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-bold text-primary">
                      {categoryStats.averageEnabledAttributesPerCategory}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Attributes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'attributes' && workflow.selectedCategory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Extractable Attributes
                </CardTitle>
                <CardDescription>
                  Review the {workflow.selectedCategory.extractableAttributes} attributes that will be extracted for {workflow.selectedCategory.categoryName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryAttributeTable
                  category={workflow.selectedCategory}
                  showDescription={true}
                  showOnlyExtractable={false}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 'upload' && (
            <div className="space-y-6">
              {workflow.selectedCategory && (
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Targeted extraction enabled:</strong> AI will extract {workflow.selectedCategory.extractableAttributes} specific attributes 
                    relevant to {workflow.selectedCategory.categoryName} category.
                  </AlertDescription>
                </Alert>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Images className="h-5 w-5" />
                    Image Upload
                  </CardTitle>
                  <CardDescription>
                    Upload fashion images to extract attributes using AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!workflow.selectedCategory ? (
                    <EmptyState 
                      icon={<Circle className="h-12 w-12 text-muted-foreground/50" />}
                      title="Select a Category First"
                      description="Choose a category before uploading images"
                    />
                  ) : (
                    <ImageUpload onFilesSelected={workflow.addImages} />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'results' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Extraction Results
                </CardTitle>
                <CardDescription>
                  Review AI-extracted fashion attributes and export data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workflow.results.length === 0 ? (
                  <EmptyState 
                    icon={<Circle className="h-12 w-12 text-muted-foreground/50" />}
                    title="No Results Yet"
                    description="Upload and process images to see extraction results"
                  />
                ) : (
                  <ExtractionResults results={workflow.results} />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
