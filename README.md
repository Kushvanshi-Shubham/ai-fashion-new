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

## 🎨 Design System (v2)

### Principles
- Professional & Minimal: Low-noise surfaces, clear hierarchy, restrained color usage.
- Accessible: Focus visibility, reduced motion support, semantic landmarks.
- Scalable: Token-driven decisions (color, spacing, radius, elevation, motion).
- Performant: Subtle motion, no gratuitous parallax or large blocking animations.

### Color Tokens
Defined in CSS variables (OKLCH) and extended Tailwind palette `brand`:
- `--background` / `--foreground`
- `--primary` / `--primary-foreground`
- `--muted` / `--muted-foreground`
- `--accent`, `--secondary`, `--destructive`
- Brand blues: 50–950 scale for future semantic mapping.

Recommendation: Use semantic utilities (e.g. `bg-card`, `text-muted-foreground`) instead of raw hex values to retain dark-mode fidelity.

### Typography
- Base font: Inter (system fallbacks) via CSS variable.
- Scale: `text-xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl` (hero). Avoid >`6xl` unless marketing page.
- Use `tracking-tight` for large headings; avoid all-caps except micro labels.

### Spacing Rhythm
- Section vertical spacing: 48–64px (`py-12 md:py-16`).
- Container padding: Horizontal `px-4 sm:px-6 lg:px-8` centralized in `Container` component.
- Component internal padding: Cards use 20–24px (`p-5` / `p-6`), large panels 32–48px.

### Elevation & Surfaces
- Shadow scale (`shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-glow`).
- Hover: Elevation shift only when interactive.
- Blurred translucent surfaces use `backdrop-blur` + reduced alpha backgrounds.

### Radius
- Design token root: `--radius` (10px). Derived sizes in Tailwind config (sm, md, lg). Keep consistency; avoid ad-hoc rounding.

### Components Added
- `Container`: Standard width + horizontal padding.
- `PageSection`: Layout wrapper with optional `subdued`, `borderTop`, `borderBottom`, `bleed`.
- `StatCard`: Metric display with subtle reveal.
- `FeatureCard`: Marketing features (interactive state, low motion).
- `StepCard`: Workflow guidance with consistent icon presentation.
- `EmptyState` / `ErrorState`: Standardized non-content & failure patterns.

### Motion Guidelines
Centralized variants in `lib/motion.ts`:
- `fadeUp`, `fadeInScale`, `staggerContainer`.
Usage:
```ts
<motion.div variants={fadeUp} initial="hidden" whileInView="show" />
```
Rules:
- Limit entrance animations to first fold + key transitions.
- Respect reduced motion: `prefers-reduced-motion` removes animations.
- Max duration for simple reveals: 450ms; chain with stagger not > 120ms per element.

### Accessibility
- Landmarks: `header[role=banner]`, `nav[aria-label]`, logical heading order.
- Focus: Visible focus rings using `focus-visible:ring` patterns.
- Reduced Motion: Media query disables transitions for sensitive users.
- ARIA labels on icon-only / ambiguous interactive elements.

### Empty & Error States
Structure:
- Title (concise outcome)
- Supporting description (actionable, no blame)
- Primary action (progress) & secondary action (alternative / dismiss)
- Use icon circle with brand tint for quick recognition.

### Theming Strategy
Current: Single light/dark via CSS variables + `.dark` class.
Future: Introduce semantic themes (e.g. `--brand-hue`) allowing dynamic palette shifts without refactoring components.

### Future Enhancements (Suggested)
- Skeleton loaders for extraction table.
- Global toast system standardization (success/info/destructive variants).
- Form primitives: `<FormField />`, `<FieldGroup />` with validation states.
- Analytics dashboard redesign with mini visualizations (spark lines / radial progress).
- Command palette (quick nav + actions) using Radix Dialog + fuzzy search.
- Theme switcher expansion (brand accent selection) persisted in user profile.

---

## ✅ Changelog (Design Overhaul)
- Added Tailwind config with brand palette & motion tokens.
- Refactored home hero + sections with composable primitives.
- Implemented accessibility improvements (ARIA, focus, reduced motion support).
- Centralized motion variants.
- Added standardized empty & error states.

This section will evolve as additional primitives (forms, tables, charts) are standardized.