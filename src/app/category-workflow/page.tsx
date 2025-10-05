'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Circle,
  Settings,
  Images,
  Brain,
  ChevronRight,
  ArrowRight
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
import { ExtractionResultsTable } from '@/components/ExtractionResultsTable';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header & Progress */}
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-100/90 to-indigo-100/90 dark:from-blue-900/80 dark:to-indigo-900/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-blue-300/50 dark:border-blue-600/50">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                🔷 AI Fashion Extraction Workflow
              </h1>
              <p className="text-lg text-blue-700 dark:text-blue-200 font-medium">
                🎯 Category-driven extraction for precise fashion attribute analysis
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800/70 dark:to-indigo-800/70 text-blue-900 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-500 shadow-md">
              📊 {categoryStats.totalCategories} Categories Available
            </Badge>
          </div>

          {/* Progress Steps */}
          <Card className="bg-blue-50/80 dark:bg-blue-950/60 backdrop-blur-sm border-2 border-blue-300 dark:border-blue-600 shadow-2xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-t-lg border-b border-blue-200 dark:border-blue-700">
              <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100">📋 Workflow Progress</CardTitle>
              <CardDescription className="text-lg text-blue-700 dark:text-blue-200">
                🚀 Follow these steps to extract fashion attributes from your images
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
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
            <Card className="bg-blue-50/90 dark:bg-blue-950/70 backdrop-blur-sm border-2 border-blue-300 dark:border-blue-600 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800/50 dark:to-indigo-800/50 rounded-t-lg border-b border-blue-300 dark:border-blue-600">
                <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  🔷 Category Selection
                </CardTitle>
                <CardDescription className="text-blue-800 dark:text-blue-200 font-medium">
                  🎯 Choose the fashion category for targeted extraction
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
              <CategorySelector
                onCategorySelect={handleCategorySelect}
                selectedCategory={workflow.selectedCategory}
              />
            </CardContent>
          </Card>

            {/* Category Stats */}
            {workflow.selectedCategory && (
              <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 border-2 border-blue-300 dark:border-blue-600 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    📊 Category Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50/70 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">📋 Total Fields</span>
                    <Badge variant="outline" className="bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 border-blue-400 dark:border-blue-500 font-bold">
                      {workflow.selectedCategory.totalAttributes}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-cyan-50/70 dark:bg-cyan-900/30 rounded-lg border border-cyan-200 dark:border-cyan-700">
                    <span className="text-sm font-medium text-cyan-800 dark:text-cyan-200">🤖 AI Extractable</span>
                    <Badge variant="default" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold">
                      {workflow.selectedCategory.extractableAttributes}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-indigo-50/70 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700">
                    <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">🎯 Coverage</span>
                    <Badge variant="secondary" className="bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 border-indigo-400 dark:border-indigo-500 font-bold">
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
              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-700 shadow-2xl">
                <CardHeader className="text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-t-lg p-8">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                    <Settings className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    🎉 Welcome to AI Extraction
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                    🚀 Start by selecting a fashion category to configure targeted attribute extraction
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
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div className="rounded-xl border-2 border-blue-200 dark:border-blue-700 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 shadow-lg transform hover:scale-105 transition-all duration-200">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      🏢 {categoryStats.totalDepartments}
                    </div>
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Departments</div>
                  </div>
                  <div className="rounded-xl border-2 border-green-200 dark:border-green-700 p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 shadow-lg transform hover:scale-105 transition-all duration-200">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                      🏪 {categoryStats.totalSubDepartments}
                    </div>
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">Sub-Departments</div>
                  </div>
                  <div className="rounded-xl border-2 border-purple-200 dark:border-purple-700 p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 shadow-lg transform hover:scale-105 transition-all duration-200">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                      📊 {categoryStats.averageEnabledAttributesPerCategory}
                    </div>
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg. Attributes</div>
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
                  showNextButton={true}
                  onNext={() => setCurrentStep('upload')}
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
                    <div className="space-y-6">
                      <ImageUpload 
                        onFilesSelected={workflow.addImages}
                        existingFiles={workflow.uploadedImages.map(img => ({
                          id: img.id,
                          name: img.file.name,
                          size: img.file.size,
                          type: img.file.type,
                          preview: img.preview,
                          status: img.status,
                          progress: img.progress,
                          error: img.error
                        }))}
                        onRemoveFile={workflow.removeImage}
                      />
                      
                      {/* Extraction Controls */}
                      {workflow.uploadedImages.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-blue-300 dark:border-blue-600 rounded-xl p-6 shadow-lg">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">🚀 Ready for AI Extraction</h4>
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full inline-block">
                                📊 {workflow.stats.pending} pending • {workflow.stats.processing} processing • {workflow.stats.completed} completed
                              </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-4">
                              <Button
                                onClick={workflow.startBatchExtraction}
                                disabled={!workflow.canStartExtraction || workflow.isProcessing}
                                size="lg"
                                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 border-0"
                              >
                                {workflow.isProcessing ? (
                                  <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white"></div>
                                    <span>🔄 Processing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Brain className="h-6 w-6" />
                                    <span>🧠 Start AI Extraction</span>
                                  </>
                                )}
                              </Button>
                              
                              {workflow.completedImages.length > 0 && (
                                <Button
                                  onClick={() => setCurrentStep('results')}
                                  variant="outline"
                                  size="lg"
                                  className="flex items-center gap-3 border-2 border-green-500 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/20 font-semibold text-lg px-6 py-4 rounded-xl shadow-md transform hover:scale-105 transition-all duration-200"
                                >
                                  <span>📊 View Results</span>
                                  <ArrowRight className="h-5 w-5" />
                                </Button>
                              )}
                            </div>
                            
                            {/* Progress Bar */}
                            {workflow.uploadedImages.length > 0 && (
                              <div className="w-full">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                    {Math.round((workflow.stats.completed / workflow.stats.total) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                                    style={{ 
                                      width: `${Math.round((workflow.stats.completed / workflow.stats.total) * 100)}%` 
                                    }}
                                  >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Inline Results Display - Show results as they come in */}
                      {workflow.results.length > 0 && (
                        <Card className="mt-6">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ✅ Live Extraction Results ({workflow.results.length})
                            </CardTitle>
                            <CardDescription>
                              Results appear here automatically as extraction completes - same page, no redirects!
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ExtractionResultsTable 
                              results={workflow.results}
                              category={workflow.selectedCategory}
                            />
                          </CardContent>
                        </Card>
                      )}
                    </div>
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
    </div>
  );
}
