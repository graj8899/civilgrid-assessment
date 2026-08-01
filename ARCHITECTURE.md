# Architecture — CIP × EV charger synergy finder

A React + TypeScript map tool showing where Los Angeles' Capital Improvement Projects are scheduled and which EV chargers fall in those areas, so a city manager can fold charger upgrades into work that is already funded, permitted and about to break ground.

Static, entirely client-side, no backend. Timeboxed to 3 hours.

---

## 1. The decision that shapes everything

The prompt says "highlight EV chargers **within that area**." Read literally as point-in-polygon, the tool returns almost nothing. Measured against the real data:

| Measure | Value |
|---|---|
| Combined footprint, all 773 CIP projects | 14.8 km² |
| Median single footprint | 726 m² |
| Largest footprint | 2.36 km² |
| Footprint shape | a few large multi-site programs skew the distribution |
| **Chargers strictly inside at 0 m** | **9 of 773 projects (1.2%)** |
| Chargers within 500 m | 316 of 773 projects (40.9%) |
| Chargers within 1000 m | 567 of 773 projects (73.4%) |

CIP footprints are bridges and street segments, not neighbourhoods. Chargers sit in adjacent lots and kerbsides. Strict containment yields an empty result on essentially every project — which reads as a broken tool, not as a finding.

**So proximity is a first-class adjustable input, not a future enhancement.** A radius control with stops at 0 / 250 / 500 / 1000 m, defaulting to **500 m**. The detail panel always shows both numbers: *"2 inside footprint · 9 within 500 m."*

Three reasons this is the right call beyond the arithmetic:

- it makes the interpretation visible on screen instead of buried in a README
- 0 m remains available, so a reviewer who prefers the literal reading gets it in one click
- it turns an ambiguous prompt into a stated, defensible product decision, which is what the time constraint is testing

**How the numbers were derived**, since this is the first thing a sharp reviewer will poke at: these are measured from the running app, not inferred from uniform density. I summed `Shape_Area` across all 773 features, converted US survey feet to m², and checked the real count of projects with any charger inside at 0 / 500 / 1000 m. The figures are 9 of 773 (1.2%), 316 of 773 (40.9%), and 567 of 773 (73.4%).

The units assumption was verified independently: the Glendale-Hyperion Bridge feature has `Shape_Length` 3,265, and that bridge is about 425 m long, implying a footprint perimeter near 1,000 m. In feet, 3,265 → 995 m. Matches. In metres it would imply a 1.6 km bridge. So feet, and the figures hold.

## 2. What the data actually contains

Verified against both files. These four facts drove most of the design.

- **All 414 EV charger properties are null.** `slid`, `lat`, `lon`, `Date_Imported`, `TOOLTIP`, `NLA_URL` — every field, every feature. `OBJECTID` and the geometry are all there is, so a charger detail panel is impossible. The tooltip says so plainly rather than rendering blank rows.
- **Mixed geometry.** 763 `Polygon` + 10 `MultiPolygon` across 773 CIP features. A Polygon-only implementation silently drops chargers in the second lobe of several projects.
- **`Shape_Length` / `Shape_Area` are in a projected CRS in US survey feet**, carried over from upstream. Never treat them as degrees. They are usable for area comparison after conversion — that is how §1 was computed.
- **Dates are epoch milliseconds.** `StartDate`/`EndDate` duplicate `ConsStartDate`/`ConsEndDate`; `LastVisited` is an inconsistent `"MM/DD/YYYY"` string. Use one pair, ignore the rest.
- **PROJECTID is not unique per feature.** The 773 features share only 216 unique PROJECTIDs, so OBJECTID (verified unique across all 773) is used as the real per-feature identifier throughout the app, including in `spatial.ts` and the map selection logic.

Neither file has a `crs` member, so coordinates are WGS84 lon/lat. Both files are clean — no malformed features, no null geometries — which is why §4 has no validation layer.

**What to request from the data owner**, and the difference between a browsing tool and a decision tool: port count, connector type, power rating (L2 vs DCFC), operator, install date, utilisation. Without these you can locate a charger but not rank it as an upgrade candidate.

## 3. Principles

1. **Spatial logic is pure and isolated.** Only `spatial.ts` imports Turf. It imports neither React nor Leaflet. It is the only tested module.
2. **One source of truth, everything else derived.** Five pieces of real state; matches, sort order and the highlighted charger set are `useMemo` derivations.
3. **Selection is an id, never a copied object.** Removes the stale-copy bug class, and means map and list cannot disagree.
4. **Dependencies point one way.** Components → state → `spatial.ts` → Turf. No component calls Turf; nothing outside components imports React.
5. **Every dependency must earn its place.** See what was rejected below.

## 4. Stack

| Concern | Choice | Why |
|---|---|---|
| Build | Vite + React 18 + TS (strict) | Fastest path to a deployable typed app |
| Map | **react-leaflet** | Declarative: `<GeoJSON>` and `<CircleMarker>` render from props. No style JSON, no imperative `setData`, no load-event ordering, no `setFeatureState` |
| Basemap | OSM raster tiles | Keyless. No env var, no deploy-time secret, no blank-map failure mode |
| Spatial | `@turf/boolean-point-in-polygon`, `@turf/buffer`, `@turf/bbox` | GeoJSON-aware, handles MultiPolygon, well-tested. Three focused packages, not the umbrella |
| State | `useState` + `useMemo` in `App.tsx` | 773 + 414 features, one screen, three-level tree |
| Styling | Plain CSS, one file, CSS custom properties | Removes `tailwind.config.js`, `postcss.config.js` and a build step. ~250 lines covers the whole layout |
| Tests | Vitest, `environment: 'node'` | No jsdom needed — `spatial.ts` is pure |
| Deploy | Netlify | `npm run build`, publish `dist`, connect on the first commit |

**Rejected, and why:**

- *MapLibre GL* — better vector renderer, but style JSON, a layer registry and feature-state highlighting cost roughly 45 minutes of a 180-minute budget on plumbing the reviewer never sees.
- *TanStack Query* — for two files that never change you would set `staleTime: Infinity` and disable refetch-on-focus, switching off every feature that justified installing it.
- *Zustand / Redux* — one `selectedProjectId` in a three-level tree.
- *Tailwind* — a config file, a PostCSS step and a class vocabulary to buy styling for one screen.
- *A source → domain normalisation layer* — mapping 39 source keys into a clean model is correct with two data sources. There is one, and it is a static file. `Project` **is** the GeoJSON feature; components read `properties.ProjectTitle` directly.
- *Env vars, CI, Playwright, skip-and-log validation* — nothing to configure, nothing malformed, one route.

## 5. Files

Two folders. Flat `src/` is deliberate — nine files do not need a taxonomy, and `hooks/` wrapping a single fetch reads as abstraction for its own sake.

```
civilgrid-cip-ev/
├── public/data/
│   ├── cip_projects.json          copied from the assessment repo
│   └── ev_chargers.json
├── src/
│   ├── main.tsx                   Vite entry
│   ├── App.tsx                    state, loading, layout, controls
│   ├── MapView.tsx                react-leaflet layers
│   ├── ProjectList.tsx            sortable list + detail panel + format helpers
│   ├── ProjectList.test.ts
│   ├── spatial.ts                 pure, the only tested module
│   ├── spatial.test.ts
│   ├── types.ts
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts                 includes the vitest block
├── .gitignore
├── ARCHITECTURE.md
└── README.md
```

Data lives in `public/data/` so it is fetched at runtime from `${import.meta.env.BASE_URL}data/*.json` rather than bundled into the JS. Using `BASE_URL` rather than a leading slash keeps it working if the deploy ever sits on a sub-path.

**Delete from the Vite scaffold:** `src/assets/`, `src/App.css`, `public/vite.svg`, and the counter boilerplate. Leaving the Vite logo in a submission reads as careless.

## 6. Data flow

```
public/data/*.json
   │ fetch once on mount
   ▼
App.tsx ── projects, chargers, selectedId, radiusMeters, sortKey
   │
   │ useMemo(projects, chargers, radiusMeters)      ← expensive, radius only
   ▼
spatial.ts → Map<projectId, ProjectMatch>
   │
   │ useMemo(projects, matches, sortKey)             ← cheap
   ▼
MapView.tsx        ProjectList.tsx
   │
   └── selection and radius flow back to App.tsx
```

Two `useMemo` boundaries, kept separate on purpose: **sorting and selection never re-run the spatial join.** That separation is the only reason the radius control feels instant, and it is the single most load-bearing performance decision in the app.

## 7. `spatial.ts` — the contract

```ts
chargersInGeometry(geometry: CipGeometry, chargers: Charger[]): number[]
bufferGeometry(geometry: CipGeometry, radiusMeters: number): CipGeometry | null
matchProject(project: Project, chargers: Charger[], radiusMeters: number): ProjectMatch
buildMatches(projects: Project[], chargers: Charger[], radiusMeters: number): Map<number, ProjectMatch>
boundsOf(geometry: CipGeometry): [number, number, number, number]
```

```ts
interface ProjectMatch {
  projectId: number; // sourced from OBJECTID, not PROJECTID, since PROJECTID repeats across features (see section 2)
  inside: number[];              // strictly inside the footprint
  nearby: number[];              // in the buffer, not in the footprint — disjoint from inside
  total: number;                 // inside.length + nearby.length, never double-counted
  bufferGeometry: CipGeometry | null;   // null at radius 0, for the dashed ring
}
```

`bufferGeometry` returns `null` at radius 0 **and** when Turf returns nothing for degenerate geometry, so callers degrade to strict containment instead of crashing the render.

**Cost.** 773 × 414 = 319,722 point-in-polygon tests, doubled when buffered. Single-digit milliseconds, so there is no bbox prefilter and no spatial index. The interface is index-agnostic — an rbush-backed `chargersInGeometry` drops in without touching a component.

**Accuracy caveat.** Turf 7 buffers via jsts on projected coordinates, so the radius is an approximation rather than exact ground metres. Adequate for a screening tool; anything regulatory needs a projected CRS and a real distance calculation. The practical consequence is in §11: test fixtures need wide distance margins.

## 8. State

All of it in `App.tsx`.

| State | Type | Notes |
|---|---|---|
| `projects` | `Project[]` | Loaded once, immutable after |
| `chargers` | `Charger[]` | Same |
| `status` | `'loading' \| 'ready' \| 'error'` | Top-level render branch |
| `selectedId` | `number \| null` | `OBJECTID`, not an object |
| `radiusIndex` | index into `[0, 250, 500, 1000]` | Default 500 m. Discrete, so no debounce or throttle is needed anywhere |
| `sortKey` | `'chargerCount' \| 'constructionStart' \| 'constructionCost'` | Default `chargerCount` — that ranking *is* the product's answer |

Camera position is deliberately not state. A `FitToSelection` child calls `map.fitBounds(boundsOf(geometry))` in an effect on selection change. Mirroring camera into React state fights user pan and zoom.

Storing the radius as an **index** rather than a value keeps the slider a plain `<input type="range">` with integer steps, no custom snapping.

## 9. Map layers

Bottom to top, all declarative:

1. OSM tile layer
2. All 773 CIP footprints — muted grey fill, 1px outline, click to select, tooltip on hover
3. Selected footprint — blue fill, 2px outline
4. Buffer ring for the selected project — dashed, non-interactive, only when radius > 0
5. All 414 chargers — grey, r=3
6. Matched chargers — r=6, green when inside the footprint, blue when only within the radius

The dashed ring exists so the match logic is **visible** rather than implied, and the green/blue split makes the dual count legible on the map as well as in the panel. Only the selected project is buffered; buffering all 773 for display is wasted work.

**Implementation gotcha worth knowing before you start.** react-leaflet's `<GeoJSON>` does not re-read its `style` prop when props change — it snapshots on mount. Force a remount with `key={`cip-${selectedId}`}`. Remounting 773 polygons is a fraction of a millisecond and is simpler than an imperative `setStyle` pass over layers. Without this, selection appears to do nothing on the map, which is the most likely hour-long debugging detour in this build.

Clicking a footprint and clicking a list row call the same setter, so the two views cannot diverge.

## 10. Three-hour plan

| Time | Deliverable | Cut first if behind |
|---|---|---|
| 0:00–0:20 | Scaffold, deps, map renders LA, **Netlify connected and deploying** | — |
| 0:20–0:40 | Both files loading and typed, footprints and chargers on the map | — |
| 0:40–1:20 | `spatial.ts` + per-project counts + selection highlight | Strict containment first, buffer next |
| 1:20–2:00 | Sidebar list, sort, detail panel, `fitBounds` | Drop sort, keep the list |
| 2:00–2:30 | Radius control, dashed ring, dual count | **Protect this** — cut sort and polish instead |
| 2:30–2:45 | Tests | Keep the MultiPolygon case at minimum |
| 2:45–3:00 | **README, final deploy verify** | Never |

Connect Netlify on the *first* commit, not the last. A broken deploy discovered at 2:55 is the most common way these submissions fail.

## 11. Tests

One file, `spatial.test.ts`. Hand-built geometry, no fixtures lifted from the real data. **12 tests, no DOM.**

| Group | Covers |
|---|---|
| `chargersInGeometry` | inside · outside · returns ids not indices · empty input · **point in the second polygon of a MultiPolygon** |
| `bufferGeometry` | null at radius 0 · null at negative radius · point ~100 m out falls inside a 250 m buffer · point ~900 m out does not · bbox grows in all four directions |
| `matchProject` | strict containment at radius 0 · ~100 m point lands in `nearby` not `inside` · buckets disjoint · `total` is the sum · 900 m excluded at 250 m · remote charger never matches · buffer present when radius > 0 · monotonic in radius · `projectId` is `OBJECTID` |
| `buildMatches` | keyed by `OBJECTID` · includes zero-match projects so the list still renders them · each project scoped to its own chargers · empty project list |
| `boundsOf` | `[minLon, minLat, maxLon, maxLat]` order · spans every polygon of a MultiPolygon |

Two fixture decisions worth preserving if these get rewritten:

- **Wide distance margins**, because of the projection caveat in §7. The near charger sits ~100 m outside the footprint and the far one ~900 m, both well clear of the 250 m threshold in either direction. A point 240 m from the edge tested against a 250 m buffer passes or fails by Turf minor version.
- **The MultiPolygon case earns its keep** even though it passes trivially with `booleanPointInPolygon`. It catches the hand-rolled ring walk, which is the tempting optimisation and would silently break several of the 773 real projects.

## 12. Not built, and when it would matter

| Omission | Reason | Revisit when |
|---|---|---|
| Backend / API | ~130 KB of static data | Live CIP feed, auth, saved views |
| Spatial index (rbush) | 320k checks, milliseconds | County-wide, thousands of footprints |
| Web worker | Discrete radius stops remove the jank case | Continuous slider over much larger data |
| Charger detail panel | All 414 records have null attributes | Port, power and operator data arrive |
| URL / shareable state | ~20 min of a 180 min budget | Immediately — a manager will want to send a colleague a link |
| Filters (program, district, date range) | Not asked for; sorting by charger count already answers the question | A second screen, or many more projects |
| Mobile layout | Desk-bound planning workflow | Field inspection use case |
| Validation / skip-and-log | Both source files are clean | Data starts arriving from a live feed |
| CI, E2E | One route, one tested module | More than one contributor |

## 13. Talking points

| Question | Answer |
|---|---|
| How do you define "within that area"? | Adjustable radius, 500 m default, both counts always shown. Measured from the running app, 9 of 773 projects (1.2%) have any charger inside at 0 m, 316 of 773 (40.9%) at 500 m, and 567 of 773 (73.4%) at 1000 m. A literal reading ships an empty tool. |
| Why react-leaflet over MapLibre? | Declarative rendering from props. MapLibre is the better renderer, but its style JSON and imperative source updates cost ~45 minutes I would rather spend on the spatial logic and the product decision. |
| Why no state library? | One selection id and a radius index, three levels deep. Query would need `staleTime: Infinity` on files that never change, disabling the reason to install it. |
| Why Turf over hand-rolled geometry? | MultiPolygon and ring-winding edge cases. Several of the 773 features are MultiPolygon and a hand-rolled version drops them silently — there is a test for exactly that. |
| How would it scale? | Bbox prefilter → rbush → worker → PostGIS. `chargersInGeometry` is index-agnostic, so the first two are drop-in. |
| What is wrong with the data? | All 414 charger records have null attributes, so the tool can locate chargers but not rank them. `Shape_Area` is in a projected CRS and misleads if read as degrees. `StartDate` duplicates `ConsStartDate`. I would request port count, power rating and operator. |
| What did you cut? | Filters, URL state, mobile, charger details, CI — §12, each with the trigger that brings it back. |
| Where is the risk in this code? | The proximity radius is approximate because Turf buffers on projected coordinates. Fine for screening, wrong for anything regulatory, and the reason the tests use wide distance margins. |

