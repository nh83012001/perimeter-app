# Perimeter frontend

[Cloudfront distro URL](https://dgkpkp27prv85.cloudfront.net/)

## Getting Started

Add .env file
VITE_GRAPHQL_ENDPOINT=https://qsb51itvz4.execute-api.us-east-1.amazonaws.com/dev/graphql
VITE_MAPBOX_TOKEN=yourMapboxToken

```
npm install
npm run dev
```

will run locally at [localhost:5173](http://localhost:5173/)

## Tools

React / Vite
Mapbox
Serverless to deploy
Material for some light styling
Apollo Client for server connection and running query/mutation hooks
Prettier
Eslint

## API Docs

- [Mapbox GL Draw tools](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md) - where controls come from

## Feature Explanation

### Drawing Polygons

To draw a polygon, use the control on the top right corner of the map that is a square. It is selected if the background is orange and deselected (normal select/move capabilities) if the background is grey.

### Select Multiple

Since mapbox lets you select multiple features and I didn't really want to overwrite it, I gave you the ability to delete multiple polygons at the same time. You select one feature, then press shift, and select additional features. This could be improved by just sending the delete once with an array of polygons to be deleted.

### Trashcan control

The trashcan control lets you delete as you are drawing lines, but also lets you delete features. I went ahead and let you delete from either place.

## Deploying

Build creates a dist folder. Deploy dev uses serverless and my AWS credentials to deploy.

```
npm run build
npm run deploy:dev
```

## Next Ideas

- Code maintainability: Break out into separate components like map container, link button, edit/create form popup
- Code maintainability: circleCI and an analysis tool (like Code Climate)
- Feature: Default apollo caching is in there. I would consider doing a write to cache for getMapSession query on update/delete. Then I could just always be reading from that query on load.
- Feature: Disable the share link whenever you don't have any polygons saved
- Feature: Work on making the controls more clear
- Feature: [Snackbars](https://mui.com/material-ui/react-snackbar/) when you get successful save, update, delete. Plus either a snackbar or animation when you copy to clipboard

## Undo Functionality

I had a `feature/undo` branch where I was implementing what I thought would be a good experience for the undo in the screenshot for at the end of the code challenge. The way this was working is that the undo would track all the updates you make to the name and selected feature.

If I was implementing for a production app, I would turn this into a control below the trashcan and only be tracking for the state of all of the polygons. It becomes a little bit tricky though, because you are making undo changes, but not having a save popup. So you would end up getting out of sync pretty quickly from what you have saved in the server.
