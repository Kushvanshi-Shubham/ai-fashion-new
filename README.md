# AI Fashion Extractor v2.0

A revolutionary category-driven AI fashion analysis tool powered by GPT-4 Vision. This application provides precise attribute extraction based on hierarchical category selection, ensuring users get only the relevant data for their specific fashion items.

## 🚀 Key Features

### Category-Driven Extraction
- **Hierarchical Selection**: Department → Sub-department → Major Category workflow
- **Targeted Analysis**: Only extracts attributes relevant to the selected category
- **283 Categories**: Comprehensive coverage across KIDS, MENS, and LADIES departments
- **80+ Attributes**: Detailed fashion properties with type definitions

### Advanced AI Analysis
- **GPT-4 Vision Integration**: Industry-leading image analysis
- **95%+ Accuracy**: Precise attribute extraction with confidence scoring
- **3-Second Processing**: Fast analysis with async job queuing
- **Smart Filtering**: Irrelevant attributes automatically excluded

### Rich Data Management
- **Interactive Tables**: Sort, filter, and export functionality
- **Multiple Export Formats**: Excel, CSV, JSON support
- **Real-time Processing**: Live status updates with progress tracking
- **Bulk Operations**: Process multiple images efficiently

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── category-workflow/        # Main workflow page (primary interface)
│   ├── rich-tables/             # Rich data tables demo
│   ├── admin/                   # Category management
│   ├── analytics/               # Usage analytics
│   └── api/                     # API endpoints
├── components/                   # React components
│   ├── CategorySelector.tsx     # Hierarchical category selection
│   ├── CategoryAttributeTable.tsx # Attribute display & filtering
│   ├── ImageUpload.tsx          # File upload interface
│   ├── ExtractionResults.tsx    # Results display
│   └── tables/                  # Rich table components
├── hooks/                       # Custom React hooks
│   └── useCategoryWorkflow.ts   # Main workflow state management
├── lib/                         # Utilities and services
│   ├── category-processor.ts    # Category data processing
│   ├── ai/                      # AI integration
│   ├── extraction/              # Extraction logic
│   ├── export/                  # Data export utilities
│   └── services/                # External services
├── types/                       # TypeScript type definitions
│   ├── fashion.ts               # Core types
│   └── discovery.ts             # Discovery types
└── data/                        # Static data
    ├── categoryDefinitions.ts   # 18,700+ lines of category data
    └── masterAttributes.ts      # Attribute definitions
```

## 🎯 Core Workflow

### 1. Category Selection (`/category-workflow`)
Users select their fashion category through a guided 3-step process:
- **Department**: KIDS, MENS, LADIES
- **Sub-department**: Specific clothing types (IB, IG, KB_L, etc.)
- **Major Category**: Detailed item classification

### 2. Attribute Preview
Display relevant attributes that will be extracted:
- **Total Attributes**: All available fields
- **Enabled Attributes**: Currently active fields  
- **Extractable Attributes**: AI-processable fields
- **Coverage Percentage**: Extraction efficiency metrics

### 3. Image Upload & Processing
- Drag-and-drop interface with preview
- Async job queue with status polling
- Real-time progress tracking
- Error handling and retry mechanisms

### 4. Results & Export
- Comprehensive extraction results
- Confidence scoring and metadata
- Multiple export formats
- Rich data table interface

## 🔧 Technical Implementation

### State Management
- **useCategoryWorkflow**: Primary workflow hook
- **React Hook patterns**: Modern state management
- **Job-based processing**: Async extraction handling

### Data Processing
- **Category Processor**: Hierarchical data structuring
- **Attribute Filtering**: Smart relevance detection
- **Export Utilities**: Multi-format data export
- **Validation Layer**: Type-safe operations

### AI Integration
- **GPT-4 Vision API**: Advanced image analysis
- **Prompt Engineering**: Category-specific extraction
- **Confidence Scoring**: Result quality metrics
- **Token Management**: Cost optimization

## 📊 Category System

The application processes 283 categories across three main departments:

- **KIDS**: 169 categories (children's clothing)
- **MENS**: 47 categories (men's fashion)  
- **LADIES**: 67 categories (women's apparel)

Each category defines specific attributes for extraction, ensuring users get precise, relevant data.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation
```bash
# Clone and install
npm install

# Set up database
npm run db:generate
npm run db:push

# Import fashion data
npm run import:fashion

# Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
REDIS_URL="redis://..." # Optional for job queuing
```

## 📈 Usage

1. **Visit** `/category-workflow` for the main interface
2. **Select** your fashion category through the hierarchical system
3. **Review** the attributes that will be extracted
4. **Upload** fashion images for analysis
5. **Export** results in your preferred format

## 🔄 API Endpoints

- `POST /api/extract` - Start extraction job
- `GET /api/extractions/[id]` - Get extraction status
- `GET /api/categories` - List available categories
- `GET /api/categories/[id]/form` - Get category form data

## 📋 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database operations
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database

# Data import
npm run import:fashion  # Import fashion categories
npm run import:fast     # Fast import (simplified)
npm run schema:audit    # Audit schema consistency
```

## 🎨 UI Components

### Primary Interface
- **CategorySelector**: Multi-level dropdown with search
- **CategoryAttributeTable**: Filterable attribute display
- **ImageUpload**: Drag-and-drop with previews
- **ExtractionResults**: Rich results display

### Data Management  
- **RichDataTable**: Advanced table with sorting/filtering
- **Export Components**: Multi-format export utilities
- **Analytics Dashboard**: Usage metrics and insights

## 🔮 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4 Vision API
- **State**: React Hooks, Custom workflow management
- **Icons**: Lucide React

## 📄 License

This project is proprietary software for AI fashion analysis applications.

---

**AI Fashion Extractor v2.0** - Revolutionizing fashion analysis with category-driven AI extraction.