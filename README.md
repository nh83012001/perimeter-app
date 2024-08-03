# React + Vite

### Tools

React / Vite
Serverless to deploy
Material for some light styling
Apollo Client for server connection and running query/mutation hooks
Prettier
Eslint

### API Docs

- [Mapbox GL Draw tools](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md) - where controls come from

### Feature Explanation

Since mapbox lets you select multiple features and I didn't really want to overwrite it, I gave you the ability to delete multiple polygons at the same time. You select one feature, then press shift, and select additional features. This could be improved by just sending the delete once with an array of polygons to be deleted.

The trashcan control lets you delete as you are drawing lines, but also lets you delete features. I went ahead and let you delete from either place.

### Next Ideas

- Disable the share link whenever you don't have any polygons saved
- Work on making the controls more clear
- [Snackbars](https://mui.com/material-ui/react-snackbar/) when you get successful save, update, delete. Plus either a snackbar or animation when you copy to clipboard
