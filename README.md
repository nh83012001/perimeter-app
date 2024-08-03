# Perimeter frontend

[Cloudfront distro URL](https://dgkpkp27prv85.cloudfront.net/)

# Perimeter Frontend Application

This project is a React web application with mapping functionality using Mapbox, focusing on the creation and manipulation of polygons.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Features](#features)
4. [Deployment](#deployment)
5. [Tools and Technologies](#tools-and-technologies)
6. [API Documentation](#api-documentation)
7. [Feature Explanation](#feature-explanation)
8. [Next Ideas](#next-ideas)
9. [Undo Functionality](#undo-functionality)

## Introduction

The goal of this project is to create a web application that allows users to create, manipulate, and manage polygons on a map. Users can save polygons with names, edit them, and view all created polygons.

## Getting Started

### Prerequisites

- Node.js and npm
- Mapbox account for the token
- AWS account for deployment (optional)

### Installation

1. Clone the repository:

   ```sh
   git clone git@github.com:nh83012001/perimeter-app.git
   cd perimeter-app
   ```

2. Create an .env file:

   ```sh
   touch .env
   ```

   And add the following commands

   ```
   VITE_GRAPHQL_ENDPOINT=https://qsb51itvz4.execute-api.us-east-1.amazonaws.com/dev/graphql
   VITE_MAPBOX_TOKEN=yourMapboxToken
   ```

3. Install dependencies and run the development server:

   ```
   npm install
   npm run dev
   ```

The application will run locally at [localhost:5173](http://localhost:5173/)

## Features

- View and navigate the map
- Create polygons by adding a minimum of 3 points
- Save polygons with a name
- Clear all points during creation/editing (trashcan)
- Edit previously created polygons
- Delete multiple polygons

## Deployment

Build creates a dist folder. Deploy dev uses serverless and my AWS credentials to deploy.

```
npm run build
npm run deploy:dev
```

## Tools and Technologies

- React / Vite
- Mapbox
- Serverless to deploy
- Material for some light styling
- Apollo Client for server connection and running query/mutation hooks
- Prettier
- Eslint

## API Documentation

- [Backend Service](https://github.com/nh83012001/perimeter-service)
- [Mapbox GL Draw tools](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md) - where controls come from

## Feature Explanation

### Drawing Polygons

To draw a polygon, use the control on the top right corner of the map that is a square. It is selected if the background is orange and deselected (normal select/move capabilities) if the background is grey.

### Select Multiple

Since mapbox lets you select multiple features and I didn't really want to overwrite it, I gave you the ability to delete multiple polygons at the same time. You select one feature, then press shift, and select additional features. This could be improved by just sending the delete once with an array of polygons to be deleted.

### Trashcan control

The trashcan control lets you delete as you are drawing lines, but also lets you delete features. I went ahead and let you delete from either place.

## Next Ideas

- **Code maintainability:** Break out into separate components like map container, link button, edit/create form popup
- **Code maintainability:** circleCI and an analysis tool (like Code Climate)
- **Feature:** Default apollo caching is in there. I would consider doing a write to cache for getMapSession query on update/delete. Then I could just always be reading from that query on load.
- **Feature:** Disable the share link whenever you don't have any polygons saved
- **Feature:** Work on making the controls more clear
- **Feature:** [Snackbars](https://mui.com/material-ui/react-snackbar/) when you get successful save, update, delete. Plus either a snackbar or animation when you copy to clipboard

## Undo Functionality

I had a `feature/undo` branch where I was implementing what I thought would be a good experience for the undo in the screenshot for at the end of the code challenge. The way this was working is that the undo would track all the updates you make to the name and selected feature.

If I was implementing for a production app, I would turn this into a control below the trashcan and only be tracking for the state of all of the polygons. It becomes a little bit tricky though, because you are making undo changes, but not having a save popup. So you would end up getting out of sync pretty quickly from what you have saved in the server.
