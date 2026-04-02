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
- **Leaflet map** with Carto Voyager tiles, constrained to Belgium (max bounds + min zoom 7)
- **Price pill markers** showing a property type icon (house / apartment / studio) and short price (e.g. "210k €")
- **Color-coded by price range**: green (affordable), teal (mid), blue (upper), purple (premium)
- **Marker clustering** for dense areas — shows a map icon + "X biens" count in a white pill badge
- **Active marker** turns dark navy (`#172C40`) with white text + subtle pop animation (scale to 1.1x)
- **Geolocation** on first load (best-effort) — centers the map on the user's position if granted, otherwise defaults to Belgium center `[50.5, 4.5]` at zoom 8

### Search & filters
- **Buy / Rent** toggle — switches property set and resets price range sliders
- **Property type** multi-select (Appartement, Maison, Studio) — shows selected names for 1–2 selections, "Tous les types" when all selected
- **Budget** range sliders (min/max) — step adjusts to buy (25k) or rent (50€) ranges
- **Bedrooms** filter (0+ to 5+)
- **"Search this area" button** — always visible as a pill at the top center of the map. Disabled (dimmed) by default. Becomes enabled when the user manually pans or zooms. Shows a loading spinner during fetch. Clicking it loads properties in the new viewport and deselects any active property.
- **Location input** shows "Zone recherchée" once the initial viewport search is active
- **"All filters" button** — present but disabled with "(pas dans cette version)" label. Not functional in this POC.

### Sort
- **Relevance** (default) — weighted score: price proximity to area median (40%) + data completeness (30%) + recency (30%)
- **Price** ascending / descending
- **Surface** largest first
- Sort affects both list card order and map marker z-index (higher-ranked results render above overlapping markers)

### Internationalization
- **3 languages**: French (default), Dutch, English
- Language switcher in the search bar
- All UI labels, filter options, sort options, loading states, and error messages are translated
- **Note**: changing language remounts the Leaflet map, resetting map position and zoom to defaults

---

## View modes

The app has three view modes, toggled via the List / Hybrid / Map buttons in the search bar.

### Hybrid (default)
- **Left panel**: 600px fixed-width scrollable property card list
- **Right panel**: interactive map with rounded corners (`8px 32px 32px 8px`)
- Both panels show the same filtered/sorted results
- Clicking a card in the list zooms the map to the property and opens its popup. Clicking a marker on the map scrolls the list to the corresponding card.

### List
- Full-width responsive grid of property cards (`repeat(auto-fill, minmax(480px, 1fr))`)
- The map is **not unmounted** — it is hidden with `width: 0; overflow: hidden` to preserve its state (position, zoom, tiles)
- The "Search this area" button is hidden in list mode
- If there is an active property, the list scrolls to it when entering list mode

### Map
- Full-screen map with no padding and no border-radius — fills the entire content area
- The left panel is removed
- `map.invalidateSize()` is called when entering/leaving map mode so Leaflet recalculates tile coverage
- If there is an active property, the map re-centers on it when entering map mode

### Preserved across all view switches
- Active property selection (highlighted card + marker)
- All filter state (transaction type, property type, price range, bedrooms)
- Sort order
- Fetched results
- Active/pending bounds
- "Search this area" enabled state (`hasMoved` is not cleared on view switch)

---

## Active property behavior

### Selecting a property

**From the list (clicking a card):**
1. The card gets a turquoise border (`#1892A2`) + subtle turquoise tint + "Sélectionné" checkmark label
2. The map zooms to level 16, positioning the marker at the bottom ~35% of the viewport so the popup has room above
3. After 600ms (for the zoom animation to settle), the popup card opens above the marker
4. The "Search this area" button is suppressed for 2 seconds during this programmatic pan

**From the map (clicking a marker):**
1. The marker turns dark navy with white text + pop animation
2. The map smoothly pans to position the marker at the bottom-center of the viewport (300ms animation)
3. After 350ms, the popup opens above the marker
4. The list panel scrolls to the corresponding card (if visible)
5. The "Search this area" button is suppressed for 1.5 seconds

### Deselecting a property

**Clicking an already-active card in the list:**
- Toggles the selection off — card returns to normal, map popup closes, marker returns to its price-colored state

**Clicking an already-active marker on the map:**
- Same toggle — marker and card both deselect, popup closes

**Clicking the map background:**
- Deselects any active property, closes the popup, resets the marker icon
- Works from any map click that doesn't hit a marker or popup

**Clicking "Search this area":**
- Deselects the active property (if any) in addition to loading new results

### Active property + view switch

**Switching to a view that shows the map (list → hybrid, list → map):**
1. Map container regains its width
2. `invalidateSize()` fires after 150ms
3. Map pans to the active property (bottom-center positioning, no animation)
4. Popup opens after 200ms
5. `ignoreUntil` suppresses the "Search this area" button for 1.5 seconds

**Switching to a view that shows the list (map → hybrid, map → list):**
1. The scroll-to-active effect fires after 150ms
2. The active card scrolls into the center of the visible list

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx          Root layout (Inter font, metadata)
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
│   └── i18n.ts             Translations (FR/NL/EN)
│
└── lib/
    ├── api.ts              Simulated API with 800ms delay, filtering, sorting
    └── format.ts           Price formatting (Intl.NumberFormat) + short format
```

### Data flow

```
User action → page.tsx state update → fetchProperties(params) → 800ms delay
  → filter by bounds → filter by criteria → sort → setResults()
  → Map receives sorted results as props
  → PropertyCard list renders from same results
```

### Key patterns

- **Viewport-based loading**: Properties are filtered by map bounds. Initial load happens after geolocation resolves (or times out at 5s). Subsequent loads require an explicit "Search this area" click.
- **Two-way selection**: Click a card → map zooms to marker + opens popup. Click a marker → list scrolls to card. Both highlight the active property.
- **Stale request protection**: `fetchIdRef` counter ensures only the latest API response is applied.
- **Programmatic move suppression**: `ignoreUntil` timestamp prevents `moveend` events from programmatic `setView` calls from enabling the "Search this area" button.
- **Map always mounted**: Switching to list mode hides the map's container div with `width: 0; overflow: hidden` instead of unmounting the Map component, preserving map position, zoom, and tile cache.
- **Marker icon swap**: When selection changes, `MapInternals` imperatively calls `marker.setIcon()` via refs, since react-leaflet's `Marker` doesn't reliably re-apply the `icon` prop on update.

---

## Design system

This project uses the [We Invest Design System](https://github.com/we-invest-real-estate/design-system).

- `tokens.css` is imported globally — all colors, spacing, shadows, and radii are CSS variables
- Key colors: `--color-turquoise-600` (#1892A2) for interactive elements, `--color-turquoise-vivid` (#26E0E5) for marker accents, `--color-navy` (#172C40) for active markers and dark surfaces
- Icons: [@tabler/icons-react](https://tabler.io/icons) — home, building-skyscraper, door, currency-euro, dimensions, bed, map-pin, chevrons, check, refresh
- Font: Inter (400, 500, 600, 800)

---

## Accessibility

- **Keyboard navigation**: All dropdowns open with Enter/Space, close with Escape. Property cards are focusable with `role="button"` and `tabIndex={0}`.
- **ARIA attributes**: `aria-expanded`, `aria-haspopup`, `aria-selected`, `aria-pressed`, `aria-live` on result count
- **Focus indicators**: Global `:focus-visible` outline (2px turquoise-600)
- **Screen readers**: All SVG icons have `aria-hidden="true"`, buttons have `aria-label`
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables marker animations
- **Daltonism**: Active markers use shape (dark navy fill) + scale change, not just color. Price range colors span green→teal→blue→purple to be distinguishable across common color vision deficiencies.

---

## Known limitations

- `formatShortPrice` rounds all prices to "Xk €" — rent prices below 1000€ display as "1k €" instead of the exact amount
- Changing language remounts the Leaflet map, resetting position and zoom
- When switching to list view with an active property, the hidden map still receives a pan/popup open command (harmless but wasteful)
- The `drawnZone` location mode has translation strings and a prop branch in SearchBar, but is never activated from page.tsx
- `activeFilterCount` is computed in SearchBar but the badge that would display it is disabled
- The fixed 600px list panel width in hybrid mode has no responsive breakpoint — may overflow on narrow screens

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
| Font | Inter (Google Fonts) |
| Data | Client-side generated (seeded random, 1500 properties) |
| API | Simulated with setTimeout (800ms) |
