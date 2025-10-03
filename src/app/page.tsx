import Link from 'next/link'
import { ArrowRight, Eye, Zap, Shield, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white" id="main">
      {/* Hero Section */}
      <section className="section">
        <div className="container text-center">
          <div className="stack-lg max-w-4xl mx-auto">
            <Badge variant="secondary">
              AI-Powered Fashion Analysis
            </Badge>
            
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Extract Fashion Attributes
              <span className="block text-primary">with Precision</span>
            </h1>
            
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Upload product images and get structured fashion attributes using advanced AI vision technology. 
              Built for retailers, brands, and marketplaces.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild>
                <Link href="/category-workflow">
                  Start Analysis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              
              <Button variant="secondary" size="lg" asChild>
                <Link href="/rich-tables">
                  View Data
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-sm surface">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">283</div>
              <div className="text-sm text-subtle">Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">80+</div>
              <div className="text-sm text-subtle">Attributes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">95%+</div>
              <div className="text-sm text-subtle">Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform
            </h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Professional-grade AI analysis with industry-leading accuracy and speed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Vision AI
              </h3>
              <p className="text-muted">
                Advanced computer vision technology identifies clothing details, colors, patterns, and materials with high precision.
              </p>
            </div>
            
            <div className="card p-8 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Fast Processing
              </h3>
              <p className="text-muted">
                Batch process hundreds of images in minutes with parallel processing and smart caching.
              </p>
            </div>
            
            <div className="card p-8 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Structured Data
              </h3>
              <p className="text-muted">
                Get clean, structured data ready for your catalog, search, and analytics systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section surface">
        <div className="container text-center">
          <div className="stack-lg max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted">
              Start extracting fashion attributes from your product images today. 
              No setup required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild>
                <Link href="/category-workflow">
                  Launch Platform
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              
              <Button variant="ghost" size="lg" asChild>
                <Link href="/analytics">
                  <Download className="w-5 h-5" />
                  View Sample Data
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
            <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded"></div>
            </div>
            Fashion AI Platform
          </div>
          <div className="text-subtle text-sm mt-2">
            © 2025 • Professional Fashion Analysis
          </div>
        </div>
      </footer>
    </main>
  )
}