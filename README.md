# CIP × EV charger synergy finder

Live URL: https://civilgrid-assessment-gowtham.netlify.app

```bash
npm i && npm run dev
```

How to use it
- Pick a project footprint on the map or in the list.
- Move the radius slider to change the search distance.
- Read the counts and the detail panel for the selected project.

The proximity decision is simple. At 0 m, only 9 of 773 projects (1.2%) have any charger inside; that is what I measured from the running app. At 500 m, it is 316 of 773 (40.9%), and at 1000 m it is 567 of 773 (73.4%). That is why the default radius is 500 m, and why both counts are shown.

Data findings
- All 414 charger records have null attributes besides OBJECTID.
- There are 763 Polygon features and 10 MultiPolygon features.
- Shape_Area and Shape_Length are US survey feet; I checked them against the Glendale-Hyperion Bridge's real length.
- The combined footprint is 14.8 km² across 773 projects, with a median of 726 m² and a few large programs up to 2.36 km².
- PROJECTID repeats across features (773 features, 216 unique PROJECTIDs), so OBJECTID is the real per-feature id.

What I cut
- No backend.
- No spatial index.
- No charger detail panel.
- No URL state.
- No filters.
- No mobile layout.
- No CI/E2E beyond the 15 unit tests.

What's next
- Get real charger attribute data, especially port count, power, and operator, so the app can rank chargers instead of only locating them.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the design notes.
