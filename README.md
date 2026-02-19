# US COVID Smart Dashboard

## Project Overview

For this lab, I created a smart dashboard that shows COVID data across all 50 U.S. states. The goal is to make COVID trends easier to understand by combining a map and charts into one interactive page.

Instead of reading numbers in a spreadsheet, users can quickly see which states had higher increases in cases or deaths over the last 7 days.

## Why I Used a Choropleth Map

I used a choropleth map because it clearly shows differences between states using color. Each state is shaded based on the number of new cases or deaths in the last 7 days. Darker colors mean higher numbers. Lighter colors mean lower numbers.

Since the data is organized by state totals, a choropleth map is the best thematic map for this project.

## Dashboard Features

The dashboard includes:

- A choropleth map built with Mapbox  
- A Top 10 states bar chart built with C3.js  
- Summary cards that show:
  - Total U.S. new cases (7 days)
  - The state with the highest increase
  - The most recent reporting date  

When the user switches between cases and deaths, everything updates automatically.

## Data Sources

This project uses:

- State-level COVID data  
- U.S. state boundary GeoJSON file  

## Technologies Used

- Mapbox GL JS  
- D3.js  
- C3.js  
- GitHub Pages  

## Live Website

[https://girum134.github.io/use-of-force-dashboard/](https://giruml34.github.io/use-of-force-dashboard/)

