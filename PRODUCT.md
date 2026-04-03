# We Invest — Property Search POC

> Interactive map-based property search for Belgium. Built as a proof of concept for the We Invest real estate platform.

## Quick start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## What this is

A Next.js application that lets users browse real estate properties in Belgium using an interactive map + list interface. Properties are displayed as price-tagged pill markers on a Carto Voyager map, with filtering, sorting, and a split-panel layout.

This is a **proof of concept** — property data is generated client-side (1500 mock listings across Belgium) and API calls are simulated with an 800ms delay. The architecture is designed to be swapped to a real backend.

---

## Features

### Map & markers

- **Leaflet map** with Carto Voyager tiles, constrained to Belgium (`maxBounds` = `[49.4, 2.3]` → `[51.6, 6.5]`, `minZoom` = 7, `maxBoundsViscosity` = 1.0). Default Leaflet zoom controls (+/−) are hidden (`zoomControl={false}`).
- **Price pill markers** — each marker is a rounded pill (`border-radius: 20px`) showing:
  - A 14×14 property type SVG icon (house / apartment / studio)
  - The short price label (e.g. "210k €", "1.5M €")
  - Font: Inter 12px weight 600, `line-height: 16px`
  - Pill size is estimated from label length: `width = 14 + 4 + label.length × 7 + 20`, `height = 26`. Anchor point is dead center (`width/2, 13`) so the pill floats centered over the coordinate.

- **Color-coded by price range** — thresholds differ for buy vs. rent:

  | Range | Buy threshold | Rent threshold | Background | Border | Text |
  |-------|-------------|---------------|------------|--------|------|
  | Affordable (green) | ≤ 250k € | ≤ 800 € | `#ecfdf5` | `#6ee7b7` | `#065f46` |
  | Mid (teal) | ≤ 400k € | ≤ 1 200 € | `#e9fcfc` | `#26e0e5` | `#115e59` |
  | Upper (blue) | ≤ 600k € | ≤ 1 800 € | `#eff6ff` | `#93c5fd` | `#1e40af` |
  | Premium (purple) | > 600k € | > 1 800 € | `#faf5ff` | `#c4b5fd` | `#5b21b6` |

- **Active marker** overrides all price colors to dark navy (`#172C40` bg + border, `#ffffff` text). The inner div gets class `marker-active`, which triggers a CSS pop animation:
  - `0%`: scale 0.9, opacity 0.7
  - `60%`: scale 1.15
  - `100%`: scale 1.1, opacity 1
  - Duration: 0.3s ease-out, `animation-fill-mode: forwards`
  - Respects `prefers-reduced-motion`: animation disabled, static `scale(1.1)`
  - Active marker also gets `zIndexOffset: 10000` to render above all other markers

- **Non-active marker z-index**: `properties.length - index` — earlier items in the sorted results array (higher ranked) render above lower-ranked overlapping markers

### Marker clustering

Markers are grouped using `react-leaflet-cluster` (`MarkerClusterGroup`) with the following configuration:

| Parameter | Value | Effect |
|-----------|-------|--------|
| `maxClusterRadius` | 50 | Markers within 50px of each other at the current zoom are merged into a cluster |
| `chunkedLoading` | `true` | Markers are added in chunks to avoid freezing the UI on large datasets |
| `spiderfyOnMaxZoom` | `true` | At max zoom, clicking a cluster fans out overlapping markers |
| `showCoverageOnHover` | `false` | No polygon shown on cluster hover |

**Cluster badge appearance:**
- White pill (`#fff` background) with turquoise border (`1.5px solid #1892A2`)
- A 14×14 map SVG icon (folded map paths) in turquoise (`#1892A2`)
- Label: `"{count} {t.properties}"` — localized per language:
  - FR: "12 biens"
  - NL: "12 eigendommen"
  - EN: "12 properties"
- Text: navy `#172C40`, Inter 12px weight 600
- Same pill sizing formula as property markers: `width = 14 + 4 + label.length × 7 + 20`, `height = 26`
- Has `role="img"` and `aria-label` with the full label text

### Geolocation

On first load (best-effort):
1. If `navigator.geolocation` is available, request position with a 5-second timeout
2. On success: center the map at the user's coordinates, zoom 13, no animation
3. On failure (denied / timeout): keep the default center `[50.5, 4.5]` zoom 8
4. Safety fallback: if geolocation hasn't resolved after 6 seconds, proceed with current map bounds regardless
5. After positioning, report initial bounds to `page.tsx` → triggers first property fetch

### Map popup

Clicking a marker (or having one selected from the list) opens a Leaflet popup above the marker with these settings: `closeButton={false}`, `maxWidth={320}`, `minWidth={280}`, `autoPan={false}`. The popup tip (the little triangle) is hidden via CSS (`.leaflet-popup-tip-container { display: none }`).

**Popup content** (280px wide):
1. **Photo area** (280×180px) — shows current photo from the property's image set
   - **Left click zone** (30% width): navigates to previous photo (wraps around)
   - **Right click zone** (30% width): navigates to next photo (wraps around)
   - Both zones show a semi-transparent white chevron indicator with drop shadow
   - **Dot indicators** at bottom center: up to 6 dots, clickable. Active dot is turquoise `#26e0e5` (10×10px), inactive dots are white at 60% opacity (7×7px).
2. **Details area** (padding 16px 12px):
   - Property type label (14px weight 600, gray `#6b7280`)
   - Price (20px weight 700, dark `#111827`), with "/mois" suffix for rentals
   - Bedrooms count (with house icon) + surface in m² (with expand icon) — both 14px weight 500, gray `#6b7280`
   - Address + postal code (with map pin icon) — 14px weight 500, gray `#6b7280`

### Search & filters

- **Buy / Rent** dropdown — switches property set, resets price range sliders to the new min/max, and **deselects any active property**
- **Property type** multi-select (Appartement, Maison, Studio):
  - 0 selected → placeholder text ("Quel type de bien ?")
  - 1–2 selected → joined names ("Appartement, Maison")
  - All 3 selected → "Tous les types"
  - Each option has a checkbox with hover highlight (`#F3F4F6`)
- **Budget** range sliders (min/max):
  - Buy mode: step = 25 000 €, range = actual min/max from generated buy properties
  - Rent mode: step = 50 €, range = actual min/max from generated rent properties
  - Slider accent color: `#1892a2`
  - Labels show `formatShortPrice` values
- **Bedrooms** filter: options 0+ to 5+. Active option highlighted in turquoise (`#1892a2`). Each option has hover highlight.
- **"Search this area" button** — always rendered as a pill at the top center of the map (hidden only in list view). Behavior:
  - **Disabled** (dimmed, `opacity: 0.6`, gray text `#9CA3AF`, cursor default) when `hasMoved` is false or `isLoading` is true
  - **Enabled** (full opacity, dark text `#374151`, pointer cursor) when the user has manually panned or zoomed since the last search
  - Shows a spinning loader (turquoise `#1892A2` border-top, gray `#e5e7eb` rest) during fetch
  - Shows a refresh icon (Tabler `IconRefresh`) when idle
  - Clicking it: loads properties in the pending viewport bounds, resets `hasMoved`, and **deselects any active property**
- **Location input** — not an actual input, just a display pill:
  - Before first search: shows placeholder ("Où souhaitez vous acheter ?") with gray location icon
  - After initial bounds are set: shows "Zone recherchée" with dark location icon
- **"All filters" button** — present but disabled with "(pas dans cette version)" label. Gray background `#9CA3AF`, white text, `opacity: 0.7`, `cursor: not-allowed`.

### Sort

The sort dropdown appears above the property list, right-aligned. Options:

| Sort | Logic | Direction |
|------|-------|-----------|
| **Relevance** (default) | Weighted score (0–100): price proximity to viewport median (0–40) + data completeness (0–30) + recency (0–30) | Highest score first |
| **Price (low to high)** | `a.price - b.price` | Ascending |
| **Price (high to low)** | `b.price - a.price` | Descending |
| **Surface (largest)** | `b.surface - a.surface` | Descending |

**Relevance score breakdown:**
- **Price proximity** (0–40 pts): `40 × (1 - |price - median| / median)`, clamped to 0. Properties priced close to the area median score highest.
- **Completeness** (0–30 pts): `images ≥ 4` → 15 pts, else `imageCount × 3`; `bedrooms > 0` → 5; `surface > 0` → 5; `address` truthy → 5
- **Recency** (0–30 pts): `(id / 1500) × 30` — higher IDs are treated as newer listings

Sort affects both list card order **and** map marker z-index (higher-ranked results render above overlapping markers via `zIndexOffset = properties.length - index`).

### Internationalization

- **3 languages**: French (default), Dutch, English
- Language switcher: 3 small buttons (FR / NL / EN) in the search bar. Active = turquoise `#1892a2` bg + white text, inactive = gray `#f3f4f6` bg + `#6b7280` text
- All UI labels, filter options, sort options, loading states, and error messages are translated (45 keys per locale)
- **Note**: changing language remounts the Leaflet map (`MapContainer key={locale}`) — this resets map position and zoom to defaults (`[50.5, 4.5]` zoom 8) and re-triggers geolocation

---

## View modes

The app has three view modes, toggled via the List / Hybrid / Map buttons in the search bar. Each button has an SVG icon + localized label.

### Hybrid (default)
- **Left panel**: 600px fixed-width scrollable property card list (padding: 32px left, 16px right)
- **Right panel**: interactive map with rounded corners (`borderRadius: 8px 32px 32px 8px`) and padding `16px 32px 16px 0`
- Both panels show the same filtered/sorted results
- Clicking a card in the list zooms the map to the property and opens its popup. Clicking a marker on the map scrolls the list to the corresponding card.

### List
- Full-width responsive grid of property cards (`repeat(auto-fill, minmax(480px, 1fr))`, gap 8px)
- Padding: 32px left + right
- The map is **not unmounted** — it is hidden with `width: 0; overflow: hidden; flex: none; padding: 0` to preserve its state (position, zoom, tiles)
- The "Search this area" button is hidden in list mode (`viewMode !== "list"` conditional)
- If there is an active property, the list scrolls to it when entering list mode

### Map
- Full-screen map with no padding and no border-radius — fills the entire content area
- The left panel is conditionally excluded from the DOM (`viewMode !== "map"` → render list panel)
- `map.invalidateSize()` is called after 150ms when view mode changes so Leaflet recalculates tile coverage
- If there is an active property, the map re-centers on it (minimum zoom 14) when entering map mode

### Preserved across all view switches
- Active property selection (highlighted card + marker)
- All filter state (transaction type, property type, price range, bedrooms)
- Sort order
- Fetched results
- Active/pending bounds
- "Search this area" enabled state (`hasMoved` is not cleared on view switch)

---

## Property card

Each card in the list panel has this structure:

**Outer container**: `border-radius: 24px`, `padding: 8px`, clickable (`role="button"`, `tabIndex={0}`)
- **Default**: transparent 2px border
- **Hovered**: gray border `#d1d5db` + subtle shadow
- **Active**: turquoise border `2px solid #1892A2` + turquoise tint bg `rgba(24,146,162,0.06)` + outer glow `0 0 0 3px rgba(24,146,162,0.12)` + "Sélectionné" label with checkmark icon

**Layout**: two-column flex, 50/50 split

**Left column** (50% width):
1. **Photo** — fills available height (min 140px), `border-radius: 16px 6px 6px 6px`, `object-fit: cover`, lazy loaded
2. **Carousel controls** — prev/next buttons (rounded, with Tabler chevron icons), center counter showing "X sur Y photos" (localized: "van" in NL, "of" in EN)

**Right column** (flex 1):
- Container with `border-radius: 6px 16px 16px 6px`, gray border `#d1d5db`, shadow
- **Property type** (16px weight 600)
- **Address** + **postal code** (14px weight 500, gray)
- **Specs rows** (each 36px height, icon + label):
  - Price (Tabler `IconCurrencyEuro`) — with "/mois" suffix for rentals
  - Surface (Tabler `IconDimensions`) — "X m²"
  - Bedrooms (Tabler `IconBed`) — "X Chambres" (hidden for studios with 0 bedrooms)

---

## Active property behavior

### Selecting a property

**From the list (clicking a card):**
1. The card gets the active state (turquoise border + tint + "Sélectionné" label)
2. The map zooms to level 16, positioning the marker at the bottom ~35% of the viewport so the popup has room above (`panToMarkerBottomCenter` calculates the offset: `markerPoint.y - containerHeight × 0.35`)
3. Zoom animation duration: 0.5s
4. After 600ms (for the zoom animation to settle), the popup opens above the marker
5. The "Search this area" button is suppressed for 2 seconds during this programmatic pan (`ignoreUntil = Date.now() + 2000`)

**From the map (clicking a marker):**
1. The marker icon is swapped to dark navy + pop animation
2. Current zoom is clamped to minimum 14 (`Math.max(map.getZoom(), 14)`)
3. The map smoothly pans to position the marker at the bottom-center of the viewport (300ms animation duration)
4. After 350ms, the popup opens above the marker
5. The list panel scrolls to the corresponding card (smooth, centered, 150ms delay)
6. The "Search this area" button is suppressed for 1.5 seconds (`ignoreUntil = Date.now() + 1500`)

### Deselecting a property

**Clicking an already-active card in the list:**
- Toggles the selection off — card returns to normal, map popup closes, marker returns to its price-colored state

**Clicking an already-active marker on the map:**
- Same toggle — marker and card both deselect, popup closes

**Clicking the map background:**
- Deselects any active property, closes the popup, resets the marker icon
- Works from any map click that doesn't hit a marker or popup (`useMapEvents({ click: () => onDeselect() })`)

**Clicking "Search this area":**
- Deselects the active property (if any) in addition to loading new results

### Active property + view switch

**Switching to a view that shows the map (list → hybrid, list → map):**
1. Map container regains its width
2. `invalidateSize()` fires after 150ms
3. If there is an active property: zoom is clamped to minimum 14, map pans to the property (bottom-center positioning, **no animation**)
4. Popup opens after 200ms
5. `ignoreUntil` suppresses the "Search this area" button for 1.5 seconds

**Switching to a view that shows the list (map → hybrid, map → list):**
1. The scroll-to-active effect fires after 150ms
2. The active card scrolls into the center of the visible list (`scrollIntoView({ behavior: "smooth", block: "center" })`)

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx          Root layout (Inter font via next/font/google, metadata)
│   ├── page.tsx            Main page — state management, API calls, layout
│   ├── globals.css         Global styles, animations, Leaflet overrides
│   └── tokens.css          We Invest design system CSS variables
│
├── components/
│   ├── Map.tsx             Leaflet map with markers, clustering, popups, geolocation
│   ├── PropertyCard.tsx    Property listing card with photo carousel
│   ├── SearchBar.tsx       Filter bar with dropdowns (buy/rent, type, budget, bedrooms)
│   └── Icons.tsx           Re-exports from @tabler/icons-react
│
├── data/
│   ├── properties.ts       1500 mock properties across Belgium (seeded random)
│   └── i18n.ts             Translations (FR/NL/EN, 45 keys each)
│
└── lib/
    ├── api.ts              Simulated API with 800ms delay, filtering, sorting
    └── format.ts           Price formatting (Intl.NumberFormat fr-BE) + short format
```

### Data flow

```
User action → page.tsx state update → fetchProperties(params) → 800ms delay
  → filter by bounds → filter by criteria → sort → setResults()
  → Map receives sorted results as props
  → PropertyCard list renders from same results
```

### Key patterns

- **Viewport-based loading**: Properties are filtered by map bounds. Initial load happens after geolocation resolves (or times out at 5–6s). Subsequent loads require an explicit "Search this area" click.
- **Two-way selection**: Click a card → map zooms to marker + opens popup. Click a marker → list scrolls to card. Both highlight the active property.
- **Stale request protection**: `fetchIdRef` counter ensures only the latest API response is applied — if multiple fetches overlap, earlier responses are silently discarded.
- **Programmatic move suppression**: `ignoreUntil` timestamp (in ms) prevents `moveend` events from programmatic `setView` calls from enabling the "Search this area" button. Suppression windows: 2000ms (list click), 1500ms (map click + view switch), geolocation init.
- **Map always mounted**: Switching to list mode hides the map's container div with `width: 0; overflow: hidden` instead of unmounting the Map component, preserving map position, zoom, and tile cache.
- **Marker icon swap**: When selection changes, `MapInternals` imperatively calls `marker.setIcon()` via refs stored in `markerRefs.current[id]`, since react-leaflet's `Marker` doesn't reliably re-apply the `icon` prop on update.
- **Map is SSR-disabled**: Loaded via `next/dynamic` with `{ ssr: false }` since Leaflet requires `window`.

---

## Mock data generation

**1500 properties** are generated at module load time using a seeded PRNG (seed `42`) for deterministic output.

### City distribution

Properties are distributed across 8 Belgian cities with weighted probability, plus a rural scatter:

| City | Weight | Postal prefix | Lat/Lng center |
|------|--------|--------------|----------------|
| Bruxelles | 25% | 1000 | 50.8503, 4.3517 |
| Antwerpen | 15% | 2000 | 51.2194, 4.4025 |
| Gent | 10% | 9000 | 51.0543, 3.7174 |
| Liège | 10% | 4000 | 50.6326, 5.5797 |
| Bruges | 7% | 8000 | 51.2093, 3.2247 |
| Namur | 7% | 5000 | 50.4674, 4.8712 |
| Charleroi | 7% | 6000 | 50.4108, 4.4446 |
| Leuven | 7% | 3000 | 50.8798, 4.7005 |
| **Rural scatter** | **12%** | random 1000–9000 | random within Belgium polygon |

- City properties are placed randomly within ±0.03 lat / ±0.04 lng of the city center
- Each city has 5–13 named streets for realistic addresses
- Rural properties use ray-casting against a 15-point Belgium boundary polygon (`isInBelgium`) to ensure placement within country borders

### Property attributes

| Attribute | Studio | Apartment | House |
|-----------|--------|-----------|-------|
| Bedrooms | 0 | 1–3 | 2–5 |
| Surface | 20–50 m² | 40–120 m² | 80–230 m² |
| Buy base price | 150k € | 200k € | 350k € |
| Rent base price | 500 € | 700 € | 1 200 € |

- **Buy price**: `round((base + surface × 1500 + random × 200000) / 1000) × 1000`
- **Rent price**: `round((base + surface × 5 + random × 500) / 50) × 50`
- **Transaction split**: 60% buy, 40% rent
- **Photos**: 4–6 per property, cycling through a type-specific Unsplash pool (12 house, 12 apartment, 10 studio images at 400×300)
- **Postal code**: `"{prefix + random(0-49)} {cityName}"` for city properties, `"{random(1000-9000)} Belgique"` for rural

### Price formatting

- **Full format** (`formatPrice`): `Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })` — e.g. "350 000 €"
- **Short format** (`formatShortPrice`): `≥ 1M → "X.XM €"` (1 decimal), otherwise `"Xk €"` (rounded to nearest 1k)

---

## Design system

This project uses the [We Invest Design System](https://github.com/we-invest-real-estate/design-system).

- `tokens.css` is imported globally — all colors, spacing, shadows, and radii are CSS variables
- Key colors: `--color-turquoise-600` (#1892A2) for interactive elements, `--color-turquoise-vivid` (#26E0E5) for marker accents, `--color-navy` (#172C40) for active markers and dark surfaces
- Icons: [@tabler/icons-react](https://tabler.io/icons) — mappings in `Icons.tsx`:

  | Export name | Tabler icon | Used for |
  |-------------|-------------|----------|
  | `EuroIcon` | `IconCurrencyEuro` | Property card price row |
  | `RulerIcon` | `IconDimensions` | Property card surface row |
  | `BedIcon` | `IconBed` | Property card bedrooms row |
  | `LocationIcon` | `IconMapPin` | Search bar location input |
  | `ChevronDownIcon` | `IconChevronDown` | Dropdown triggers |
  | `ChevronLeftIcon` / `ChevronRightIcon` | `IconChevronLeft` / `IconChevronRight` | Photo carousel buttons |
  | `CheckIcon` | `IconCheck` | Active card "Sélectionné" label |
  | `RefreshIcon` | `IconRefresh` | "Search this area" button |
  | `HomeIcon` | `IconHome` | Marker icon (house) |
  | `ApartmentIcon` | `IconBuildingSkyscraper` | Marker icon (apartment) |
  | `StudioIcon` | `IconDoor` | Marker icon (studio) |

  Note: marker type icons are rendered as raw SVG strings (not React components) since they are injected into Leaflet `divIcon` HTML.

- Font: Inter (loaded via `next/font/google`, weights 400, 500, 600, 700, 800)

---

## Accessibility

- **Keyboard navigation**: All dropdowns open with Enter/Space, close with Escape. Property cards are focusable with `role="button"` and `tabIndex={0}`, activated with Enter/Space.
- **ARIA attributes**: `aria-expanded`, `aria-haspopup="listbox"`, `aria-selected`, `aria-pressed`, `aria-live="polite"` on result count, `aria-label` on map region, cluster badges, and photo nav buttons
- **Focus indicators**: Global `:focus-visible` outline (2px `--color-turquoise-600`, offset 2px)
- **Screen readers**: All SVG icons have `aria-hidden="true"`, interactive elements have `aria-label`
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables marker pop animation, applies static `scale(1.1)`
- **Color-blind safe**: Active markers use shape (dark navy fill) + scale change, not just color. Price range colors span green→teal→blue→purple to be distinguishable across common color vision deficiencies.

---

## Known limitations

- `formatShortPrice` rounds all prices to "Xk €" — rent prices below 1000€ display as "1k €" instead of the exact amount
- Changing language remounts the Leaflet map, resetting position and zoom
- When switching to list view with an active property, the hidden map still receives a pan/popup open command (harmless but wasteful)
- The `drawnZone` location mode has translation strings and a prop branch in SearchBar, but is never activated from `page.tsx`
- `activeFilterCount` is computed in SearchBar but the badge that would display it is permanently hidden (`{false && ...}`)
- The fixed 600px list panel width in hybrid mode has no responsive breakpoint — may overflow on narrow screens
- Popup photo dots are capped at 6 even if the property has more images (though current data never exceeds 6)
- Rural postal codes always say "Belgique" regardless of the actual commune

---

## What's not implemented (out of scope for POC)

- Real API backend
- "All filters" advanced panel
- Drawing a custom zone on the map
- Province/commune search in the location input
- User authentication
- Property detail pages
- Mobile responsive layout
- Server-side rendering of property data
- URL-based state (shareable search links)

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Map | Leaflet + react-leaflet + react-leaflet-cluster |
| Tiles | Carto Voyager |
| Icons | @tabler/icons-react |
| Styling | CSS variables (design system tokens) + inline styles |
| Font | Inter (Google Fonts, via next/font/google) |
| Data | Client-side generated (seeded PRNG seed 42, 1500 properties) |
| API | Simulated with setTimeout (800ms) |
