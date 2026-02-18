# Seattle Use of Force Dashboard

**Live URL:** https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/

## Topic
This smart dashboard visualizes Seattle Police use-of-force incidents across police beats and summarizes patterns by subject race and year.

## Datasets
- Use of Force incidents (CSV) – includes beat, sector, subject race, and date/time.
- Seattle Police Department Beats (GeoJSON) – polygons used for mapping.

## Map Type Choice
I used a **choropleth map** because the data can be aggregated by **police beats (areas)**. Coloring each beat by incident count makes it easy to compare spatial differences across Seattle.

## Dashboard Components
- **Map (Mapbox choropleth):** beats colored by number of incidents (filtered by race/year)
- **Chart (C3 bar):** incidents by subject race
- **KPI cards:** total incidents, top beat, top race
- **Top 5 list:** beats with the most incidents
