## AI Fashion Extractor (Next.js)

Full‑stack AI powered fashion attribute extraction with:
- Server-side OpenAI Vision calls (secure, centralized prompts)
- Category + attribute schema (283 categories)
- Rate limiting with Redis fallback to in‑memory
- Image validation & normalization pipeline (size/type/dimensions)
- Unified extraction transformer for consistent results
- CSV export, health endpoint, schema audit tooling

---
## Quick Start
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

Environment variables (create `.env.local`):
```
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379   # optional (falls back to memory if absent)
REDIS_DISABLED=false               # set true to force memory fallback
NEXT_PUBLIC_APP_URL=http://localhost:3000
AI_MODEL=gpt-4-vision-preview      # override with gpt-4o-mini, gpt-4o if supported
DATABASE_URL=postgres://user:pass@host:5432/db
```

If Redis is not running the app will gracefully degrade to in-memory stores (rate limit + cache) without failing extraction.

---
## Core Scripts
| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run schema:audit` | Report missing / anomalous attribute keys |
| `npm run test` | Run unit tests (Vitest) |
| `npm run import:fashion` | Import fashion category/attribute data |
| `npm run db:seed` | Seed Prisma data (if DB configured) |
| `npx prisma migrate dev` | Apply local schema changes (ExtractionEvent, DailyStat) |

---
## API Endpoints

### `GET /api/health`
Returns service + dependency status.
```json
{
	"status": "healthy | degraded | unhealthy",
	"environment": { "openaiKey": true, "redisUrl": false },
	"ai": { "checks": {"openai": true, "redis": false, "memory": true } }
}
```

### `POST /api/extract`
### `GET /api/analytics/summary`
Returns aggregated analytics when `DATABASE_URL` configured.
```json
{
	"success": true,
	"data": {
		"totals": {
			"totalEvents": 120,
			"successCount": 100,
			"failedCount": 15,
			"cachedCount": 5,
			"successRate": 0.833,
			"avgProcessingTimeMs": 812,
			"avgTokens": 452
		},
		"categoryTop": [
			{ "categoryCode": "M_JEANS", "count": 34, "avgProcessingMs": 790, "avgTokens": 430 }
		],
		"hours": [ { "hour": "09", "total": 4, "completed": 3, "failed": 1 } ]
	}
}
```
If DB unavailable: `503 ANAYTICS_DISABLED`.

Cost Fields (Phase 3):
- `totalCostUsd` (aggregate of `ExtractionEvent.costUsd`)
- `avgCostUsd` average per event (heuristic token split if exact input/output unknown)


Multipart form fields:
| field | type | description |
|-------|------|-------------|
| `file` | image | JPEG / PNG / WEBP (<=5MB) |
| `categoryId` | string | Category code/id |

Response (success excerpt):
```json
{
	"success": true,
	"data": {
		"extraction": { "status": "completed", "attributes": {"color_main": {"value": "RED"}} },
		"performance": { "processingTime": 812, "tokensUsed": 452 }
	}
}
```
Error responses include `code` (e.g. `RATE_LIMIT_EXCEEDED`, `INVALID_IMAGE`).

---
## Extraction Transformer
`normalizeExtraction(raw, fileName)` consolidates different raw AI or API payload shapes into a strict union (`ExtractionResult`)—centralizing logic previously duplicated in the client store & API route.

Guarantees:
- Confidence scaled 0–100 (accepts 0–1 or 0–100)
- Tokens always at `tokensUsed` for completed results
- Attribute map sanitized & value coerced to string/null
- Fallback IDs generated if missing

---
## CSV Export
## XLSX Export (Phase 2)
## Cost Tracking & Model Selection (Phase 3)
Centralized in `src/lib/ai/model-pricing.ts`.

Heuristic cost estimation: if only total tokens available, applies a 60/40 input/output split and optional vision multiplier.

Change model at runtime:
```bash
AI_MODEL=gpt-4o npm run dev
```
If an unsupported value is supplied it falls back to `gpt-4-vision-preview`.

Extraction events store: model, tokensUsed, costUsd, status, timing, cache flag.
Daily aggregation upserts maintain category-specific and global (categoryCode = 'ALL') stats.

`exportExtractionsToXlsx` dynamically loads `xlsx` and exports completed (and optionally failed) extractions.
```tsx
import { exportExtractionsToXlsx } from '@/lib/export/xlsx'
// results = array of normalized extraction objects from store
await exportExtractionsToXlsx(results, { includeFailed: true, filename: 'run-2025-10-02.xlsx' })
```
The module is code-split by dynamic import so unused builds stay lean.

Use `ExportCsvButton` component:
```tsx
import { ExportCsvButton } from '@/components/export/ExportCsvButton'
// ... inside page / component
<ExportCsvButton includeFailed />
```
Columns are dynamically built from completed extraction attributes plus core meta fields.

---
## Schema Audit
Run:
```bash
npm run schema:audit
```
Outputs:
- Missing master definitions
- Normalization anomalies (collapsed underscores)
- Unused master attributes (sample)

Use results to reconcile category JSON or regenerate definitions.

---
## Testing
Framework: Vitest
```bash
npm test
```
Coverage (V8) enabled. Path aliases resolved via `vite-tsconfig-paths` plugin; adjust `tsconfig.json` if adding aliases.

Add new tests under `tests/` with `.test.ts` suffix.

---
## Rate Limiting & Caching
- Primary backend: Redis (if `REDIS_URL` present & reachable)
- Automatic downgrade to in-memory on connection error (single warning emitted)
- Health endpoint reflects backend status (`redis` vs `memory`).

---
## Roadmap (Next Phases)
| Phase | Focus |
|-------|-------|
| 2 | (Delivered) Analytics dashboard + summary endpoint, XLSX export, DB persistence (ExtractionEvent) |
| 3 | (In Progress) Cost tracking, model selection, daily stats aggregation, future multi-model abstraction |
| 4 | Streaming extraction updates, queue-backed batch jobs |

---
## Troubleshooting
| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| 502 on `/api/extract` | Missing `OPENAI_API_KEY` | Verify env + restart dev server |
| Frequent rate limit errors | High request burst | Reduce concurrency / check Redis health |
| Missing attributes in results | Schema mismatch | Run `npm run schema:audit` and fix anomalies |
| Icons 404 | Absent size variants | Add additional png sizes under `public/` |

---
## License
MIT

---
_Generated & maintained with a focus on reliability, observability, and iterative AI feature expansion._
