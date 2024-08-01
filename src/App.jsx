import './App.css';
import { useQuery } from '@apollo/client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Box, Button, TextField, Paper, Typography } from '@mui/material';
// import {
//   CREATE_SESSION_SETTINGS,
//   EDIT_SESSION_SETTINGS,
//   CREATE_POLYGON,
//   EDIT_POLYGON,
//   DELETE_POLYGON,
// } from './graphql/mutations';

import { GET_MAP_SESSION } from './graphql/queries';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const App = () => {
  // TODO check for params in url for sessionID and fetch data from server
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const drawRef = useRef();
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [originalFeature, setOriginalFeature] = useState(null);
  const [history, setHistory] = useState({}); // story history of each polygons changes

  // const [createSessionSettings] = useMutation(CREATE_SESSION_SETTINGS);
  // const [editSessionSettings] = useMutation(EDIT_SESSION_SETTINGS);
  // const [createPolygon] = useMutation(CREATE_POLYGON);
  // const [editPolygon] = useMutation(EDIT_POLYGON);
  // const [deletePolygon] = useMutation(DELETE_POLYGON);
  console.log(GET_MAP_SESSION);
  // const [getMapSession] = useQuery(GET_MAP_SESSION);
  // console.log(getMapSession);

  // const { data: mapSessionData, refetch: refetchMapSession } = useQuery(
  //   GET_MAP_SESSION,
  //   {
  //     skip: true, // Skip the query initially
  //   }
  // );

  useEffect(() => {
    if (selectedFeature) {
      setOriginalFeature({ ...selectedFeature });
    }
  }, [selectedFeature]);

  useEffect(() => {
    // const urlParams = new URLSearchParams(window.location.search);
    // const sessionId = urlParams.get('sessionID');
    let defaultZoom = 6; // default zoom
    let defaultCenter = [-122.3321, 47.6062]; // default center

    // if (sessionId) {
    //   // Fetch session data if sessionID is present in the URL
    //   refetchMapSession({ sessionId }).then(({ data }) => {
    //     if (data && data.getMapSession) {
    //       const { center, zoom, features } = mapSessionData.getMapSession;
    //       console.log(features);
    //       defaultZoom = zoom;
    //       defaultCenter = center;
    //       // initializeMap(center, zoom, features);
    //     }
    //   });
    // }
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = '';
    }

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: defaultCenter, // this will be saved with the session
      zoom: defaultZoom, // this will be saved with the session
    });

    // zoom control
    const navControl = new mapboxgl.NavigationControl();
    mapRef.current.addControl(navControl, 'bottom-right');

    // polygon draw tool
    // TODO
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'draw_polygon',
    });
    drawRef.current = draw;
    mapRef.current.addControl(draw);

    mapRef.current.on('draw.create', updateArea);
    // mapRef.current.on('draw.delete', updateArea);
    mapRef.current.on('draw.update', updateArea);

    mapRef.current.on('draw.selectionchange', (e) => {
      if (e.features.length > 0) {
        setSelectedFeature(e.features[0]);
        setNameInput(e.features[0].properties?.name || '');
      } else {
        setSelectedFeature(null);
        setNameInput('');
      }
    });

    function updateArea(e) {
      // this could be new or old polygon
      const data = draw.getAll();
      if (data.features.length > 0) {
        // setSelectedFeature(e.features[0]);
        const feature = e.features[0];
        if (e.features[0].properties?.name) {
          setNameInput(e.features[0].properties?.name);
        }

        //TODO need to ignore the initial create here
        setHistory((prevHistory) => {
          const newHistory = { ...prevHistory };
          if (!newHistory[feature.id]) {
            newHistory[feature.id] = [];
          }
          newHistory[feature.id].push({ ...feature });
          return newHistory;
        });
      }
    }
  }, []);

  // TODO there should be a better way to overwrite the feature name for the polygon than a delete/add
  const handleSaveName = () => {
    if (selectedFeature) {
      selectedFeature.properties.name = nameInput;
      drawRef.current.delete(selectedFeature.id); // delete old feature and put in new one with updated name
      drawRef.current.add(selectedFeature); // add new feature with updated name
      console.log(selectedFeature);
    }
  };

  const handleDelete = () => {
    if (selectedFeature) {
      setHistory((prevHistory) => {
        const newHistory = { ...prevHistory };
        if (!newHistory[selectedFeature.id]) {
          newHistory[selectedFeature.id] = [];
        }
        newHistory[selectedFeature.id].push({ ...selectedFeature });
        return newHistory;
      });
      drawRef.current.delete(selectedFeature.id);
      setSelectedFeature(null);
      setNameInput('');
    }
  };

  // true will enable save button
  const hasChanges = () => {
    if (!selectedFeature || !originalFeature) return false;
    return (
      nameInput !== originalFeature.properties.name ||
      JSON.stringify(selectedFeature.geometry.coordinates) !==
        JSON.stringify(originalFeature.geometry.coordinates)
    );
  };

  // undo last change to currently selected polygon
  const handleUndo = () => {
    if (
      selectedFeature &&
      history[selectedFeature.id] &&
      history[selectedFeature.id].length > 0
    ) {
      const previousState = history[selectedFeature.id].pop();
      setHistory((prevHistory) => ({
        ...prevHistory,
        [selectedFeature.id]: [...prevHistory[selectedFeature.id]],
      }));
      setHistory([...history]);
      drawRef.current.delete(selectedFeature.id);
      drawRef.current.add(previousState);
      setSelectedFeature(previousState);
      setNameInput(previousState.properties.name || '');
    }
  };

  return (
    <>
      <div ref={mapContainerRef} id="map" style={{ height: '90vh' }}></div>
      {selectedFeature && (
        <Paper
          elevation={3}
          style={{
            position: 'absolute',
            bottom: 70,
            left: 70,
            padding: 15,
            backgroundColor: 'white',
            width: 300,
          }}
        >
          {selectedFeature && (
            <Typography variant="body2">
              Coordinates Length:{' '}
              {selectedFeature.geometry.coordinates[0].length - 1}
            </Typography>
          )}
          <br />
          <TextField
            fullWidth
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            label="Polygon Name"
            variant="outlined"
            size="small"
            style={{ marginBottom: 15 }}
          />

          <Box display="flex" justifyContent="space-between">
            <Button
              variant="contained"
              color="primary"
              onClick={handleUndo}
              disabled={history.length === 0}
            >
              Undo
            </Button>
            <Button variant="contained" color="primary" onClick={handleDelete}>
              Delete
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveName}
              disabled={!hasChanges() || nameInput === ''}
            >
              Save
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default App;
