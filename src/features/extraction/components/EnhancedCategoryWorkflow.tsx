// Enhanced Customer-Focused Category Workflow
'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Upload, 
  Brain, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Download,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

import CategorySelector from '@/components/CategorySelector';
import ImageUpload from '@/components/ImageUpload';
import ExtractionResults from '@/components/ExtractionResults';
import { useCategoryWorkflow } from '@/hooks/useCategoryWorkflow';
import { cn } from '@/lib/utils';

type WorkflowStep = 'welcome' | 'category' | 'upload' | 'processing' | 'results' | 'export';

interface UserProgress {
  totalExtractions: number;
  successRate: number;
  timesSaved: number; // in hours
  attributesExtracted: number;
}

export default function EnhancedCategoryWorkflowPage() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('welcome');
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalExtractions: 0,
    successRate: 0,
    timesSaved: 0,
    attributesExtracted: 0
  });
  const [isFirstTime] = useState(true);
  
  const workflow = useCategoryWorkflow({
    onCategoryChange: (category) => {
      if (category) {
        setCurrentStep('upload');
      }
    },
    onImageProcessed: () => {
      setCurrentStep('results');
    }
  });

  // Simulate user progress (replace with actual API call)
  useEffect(() => {
    const fetchUserProgress = async () => {
      // Replace with actual API call
      setUserProgress({
        totalExtractions: 24,
        successRate: 94,
        timesSaved: 12.5,
        attributesExtracted: 486
      });
    };
    fetchUserProgress();
  }, []);

  const steps = [
    { id: 'welcome', title: 'Welcome', description: 'Get started with AI extraction' },
    { id: 'category', title: 'Select Category', description: 'Choose your fashion category' },
    { id: 'upload', title: 'Upload Images', description: 'Add your product images' },
    { id: 'processing', title: 'AI Processing', description: 'AI analyzes your images' },
    { id: 'results', title: 'Review Results', description: 'Verify and edit attributes' },
    { id: 'export', title: 'Export Data', description: 'Download your results' }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const progress = ((getCurrentStepIndex() + 1) / steps.length) * 100;

  const handleStepChange = (newStep: WorkflowStep) => {
    setCurrentStep(newStep);
  };

  const WelcomeStep = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-none">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  Welcome to AI Fashion Extraction
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Say goodbye to manual data entry. Our AI extracts fashion attributes from images 
                  10x faster than traditional methods, with 95% accuracy.
                </p>
              </div>
              
              {!isFirstTime && (
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>{userProgress.totalExtractions} extractions completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{userProgress.timesSaved} hours saved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span>{userProgress.successRate}% success rate</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="hidden lg:block">
              <div className="relative">
                <Brain className="w-24 h-24 text-blue-500 opacity-20" />
                <Upload className="w-16 h-16 text-purple-500 absolute top-2 left-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-blue-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">New Extraction</CardTitle>
                <CardDescription>Start fresh with new images</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleStepChange('category')} 
              className="w-full"
              size="lg"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <RefreshCw className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Continue Previous</CardTitle>
                <CardDescription>Resume where you left off</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="lg" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Batch Upload</CardTitle>
                <CardDescription>Process multiple images at once</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="lg" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Stats */}
      {!isFirstTime && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your Progress</CardTitle>
            <CardDescription>Track your productivity improvements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userProgress.totalExtractions}</div>
                <div className="text-sm text-muted-foreground">Total Extractions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userProgress.attributesExtracted}</div>
                <div className="text-sm text-muted-foreground">Attributes Extracted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userProgress.timesSaved}h</div>
                <div className="text-sm text-muted-foreground">Time Saved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{userProgress.successRate}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

  const StepNavigation = () => (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Extraction Workflow</h2>
          <Badge variant="outline">{getCurrentStepIndex() + 1} of {steps.length}</Badge>
        </div>
        
        <Progress value={progress} className="mb-4" />
        
        <div className="flex items-center justify-between text-sm">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = getCurrentStepIndex() > index;
            
            return (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-center gap-2",
                  isActive && "font-semibold text-blue-600",
                  isCompleted && "text-green-600"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2",
                    isActive ? "border-blue-600 bg-blue-600" : "border-muted"
                  )} />
                )}
                <span className="hidden sm:block">{step.title}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {currentStep !== 'welcome' && <StepNavigation />}
      
      {/* Step Content */}
      {currentStep === 'welcome' && <WelcomeStep />}
      
      {currentStep === 'category' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Select Fashion Category</CardTitle>
              <CardDescription>
                Choose the category that best matches your product for optimal AI extraction accuracy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategorySelector
                onCategorySelect={(category) => {
                  workflow.setCategory(category);
                  if (category) {
                    setCurrentStep('upload');
                  }
                }}
                selectedCategory={workflow.selectedCategory}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {currentStep === 'upload' && workflow.selectedCategory && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Upload Product Images</CardTitle>
              <CardDescription>
                Upload high-quality images of your {workflow.selectedCategory.categoryName} for AI analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload 
                onFilesSelected={(files) => {
                  const uploadedImages = workflow.addImages(files);
                  if (uploadedImages.length > 0) {
                    setCurrentStep('processing');
                    // Start extraction automatically
                    workflow.startBatchExtraction();
                  }
                }}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {currentStep === 'processing' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle>AI Processing in Progress</CardTitle>
              <CardDescription>
                Our AI is analyzing your images and extracting fashion attributes...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-500 animate-pulse" />
                <div>
                  <div className="font-medium">Advanced AI Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    Detecting colors, materials, patterns, and style details
                  </div>
                </div>
              </div>
              <Progress value={75} className="h-2" />
              <div className="text-center text-sm text-muted-foreground">
                This usually takes 10-30 seconds depending on image complexity
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {currentStep === 'results' && workflow.results.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Extraction Results</CardTitle>
                <CardDescription>
                  Review and edit the extracted attributes. Success rate: {workflow.stats.successRate}%
                </CardDescription>
              </CardHeader>
            </Card>
            
            <ExtractionResults 
              results={workflow.results}
            />
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('upload')}
              >
                Process Another
              </Button>
              <Button 
                onClick={() => setCurrentStep('export')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export Results
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {currentStep === 'export' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>
                Download your extracted attributes in various formats.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Download className="w-6 h-6" />
                  <span>Excel (.xlsx)</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Download className="w-6 h-6" />
                  <span>CSV</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Download className="w-6 h-6" />
                  <span>JSON</span>
                </Button>
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('welcome')}
                >
                  Start New Extraction
                </Button>
                <Button onClick={() => setCurrentStep('welcome')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}