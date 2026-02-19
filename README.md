US COVID Smart Dashboard
Project Overview

For this lab, I built a smart dashboard that shows COVID trends across all 50 U.S. states. The purpose of this project is to make the data easier to understand by combining a map and charts into one interactive page.

Instead of reading numbers in a spreadsheet, users can quickly see which states had higher increases in COVID cases or deaths over the last 7 days.

Why I Used a Choropleth Map

I used a choropleth map because it clearly shows differences between states using color. Each state is shaded based on the number of new cases or deaths in the last 7 days. Darker colors represent higher numbers, while lighter colors represent lower numbers.

Since the data is organized by state totals, a choropleth map is the most appropriate thematic map for this project.

Dashboard Features

The dashboard includes:

A choropleth map built with Mapbox

A Top 10 states bar chart built with C3.js

KPI summary cards that display:

Total U.S. new cases (7 days)

The state with the highest increase

The most recent reporting date

When the user switches between cases and deaths, the map, chart, and summary numbers update automatically.

Data Sources

This project uses:

State-level COVID case and death data

A U.S. state boundary GeoJSON file

Technologies Used

Mapbox GL JS

D3.js

C3.js

GitHub Pages
