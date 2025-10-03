'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Tags, Brain, Zap, Database, BarChart3, Shield, Upload, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { FeatureCard } from '@/components/ui/feature-card'
import { StepCard } from '@/components/ui/step-card'
import { Container } from '@/components/ui/container'
import { PageSection } from '@/components/ui/page-section'

export default function HomePage() {
  const features = [
    {
      icon: Tags,
      title: "Category-Driven Extraction",
      description: "Select Department → Sub-department → Category to define exactly which attributes to extract",
      gradient: "from-blue-500/20 to-indigo-600/20"
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis", 
      description: "GPT-4 Vision analyzes images and extracts only relevant attributes for your selected category",
      gradient: "from-purple-500/20 to-pink-600/20"
    },
    {
      icon: Zap,
      title: "Fast & Accurate",
      description: "Get precise fashion attribute extraction in seconds with industry-leading accuracy",
      gradient: "from-amber-500/20 to-orange-600/20"
    },
    {
      icon: Database,
      title: "Rich Data Export",
      description: "Export results to Excel, CSV, or JSON with comprehensive data management features",
      gradient: "from-emerald-500/20 to-teal-600/20"
    }
  ]

  const stats = [
    { label: "Categories", value: "283", description: "Across all departments", icon: Tags },
    { label: "Attributes", value: "80+", description: "Fashion properties", icon: BarChart3 },
    { label: "Accuracy", value: "95%+", description: "AI precision", icon: Brain },
    { label: "Speed", value: "3s", description: "Processing time", icon: Zap }
  ]

  const workflow = [
    { step: 1, title: "Select Category", description: "Choose Department → Sub-department → Category", icon: Tags },
    { step: 2, title: "Review Attributes", description: "Preview extraction attributes", icon: BarChart3 },
    { step: 3, title: "Upload Images", description: "Add fashion images", icon: Upload },
    { step: 4, title: "Get Results", description: "Export detailed results", icon: Shield }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <PageSection className="relative hero-shell text-center overflow-hidden section-feather" bleed>
        <Container className="center-stack stack-gap-xl">
          {/* Hero Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 mb-8 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge variant="soft" className="px-4 py-2 text-sm shadow-soft">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by GPT-4 Vision
            </Badge>
          </motion.div>

          {/* Hero Title */}
          <motion.h1 
            className="hero-title mb-6 text-balance"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Professional Fashion
            <br />
            <span className="text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              AI Analysis
            </span>
          </motion.h1>

          {/* Hero Description */}
          <motion.p 
            className="hero-sub text-muted-foreground mx-auto mb-10 text-pretty leading-relaxed font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            Extract precise fashion attributes using category-driven AI. Professional-grade analysis for fashion retailers and brands with industry-leading accuracy.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="hero-actions flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/category-workflow">
              <Button size="lg" variant="premium" className="w-full sm:w-auto group">
                <Upload className="w-5 h-5 mr-2" />
                Start Analysis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/rich-tables">
              <Button variant="outline" size="lg" className="w-full sm:w-auto group">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Data Tables
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform opacity-60" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            className="stats-grid max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <StatCard 
                  label={stat.label} 
                  value={stat.value} 
                  description={stat.description} 
                  icon={<stat.icon className="w-5 h-5" />}
                  index={i} 
                />
              </motion.div>
            ))}
          </motion.div>
        </Container>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[12%] left-[4%] w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-[18%] right-[6%] w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5/10 to-transparent opacity-40" />
        </div>
      </PageSection>

      {/* Features Section */}
      <PageSection className="relative overflow-hidden" subdued borderTop>
        <Container>
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge variant="soft" className="mb-4">
              <Brain className="w-4 h-4 mr-2" />
              Smart Analysis
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
              Category-Driven Analysis
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
              Unlike traditional tools that extract everything, our system analyzes only the attributes relevant to your selected fashion category with precision and speed.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FeatureCard
                    icon={<Icon className="w-6 h-6" />}
                    title={feature.title}
                    description={feature.description}
                    gradient={feature.gradient}
                    index={i}
                  />
                </motion.div>
              )
            })}
          </div>
        </Container>

        {/* Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/3 rounded-full blur-3xl -z-10" />
      </PageSection>

      {/* Workflow Section */}
      <PageSection className="relative">
        <Container>
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge variant="premium" className="mb-4">
              <Zap className="w-4 h-4 mr-2" />
              Lightning Fast
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
              Simple 4-Step Process
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Get professional fashion analysis in minutes with our streamlined workflow
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {workflow.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <StepCard
                    step={item.step}
                    title={item.title}
                    description={item.description}
                    icon={<Icon className="w-5 h-5" />}
                  />
                </motion.div>
              )
            })}
          </div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/category-workflow">
              <Button size="lg" variant="premium" className="group">
                <Clock className="w-5 h-5 mr-2" />
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </Container>

        {/* Background Decoration */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
      </PageSection>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/20 backdrop-blur-sm">
        <Container>
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-between gap-6 py-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Fashion AI</div>
                <div className="text-xs text-muted-foreground">© 2025 Advanced AI-powered analysis</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Badge variant="premium" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                v2.0
              </Badge>
              <Badge variant="outline" className="text-xs">GPT-4 Vision</Badge>
              <Badge variant="soft" className="text-xs">283 Categories</Badge>
            </div>
          </motion.div>
        </Container>
      </footer>
    </div>
  )
}