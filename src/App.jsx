import './App.css';
import { useQuery } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Box, Button, TextField, Paper, Typography } from '@mui/material';
import { useCreatePolygon } from './hooks/useCreatePolygon';
import { GET_MAP_SESSION } from './graphql/queries';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const App = () => {
  const { createPolygon } = useCreatePolygon();
  // TODO check for params in url for sessionID and fetch data from server
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const drawRef = useRef();
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [originalFeature, setOriginalFeature] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [urlSessionId, setUrlSessionId] = useState(null);
  // const [history, setHistory] = useState({}); // story history of each polygons changes
  const sessionIdSetRef = useRef(false); // Ref to track if sessionId has been set

  function updateSessionId(initialPolygonId) {
    if (!sessionIdSetRef.current) {
      setSessionId(initialPolygonId);
      sessionIdSetRef.current = true; // Mark sessionId as set
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = params.get('sessionId');
    console.log(sessionIdFromUrl);
    setUrlSessionId(sessionIdFromUrl);
  }, []); // Empty dependency array ensures this runs only once

  //TODO display the results of this query
  const { data, loading, error } = useQuery(GET_MAP_SESSION, {
    variables: { input: { sessionId: urlSessionId } },
    skip: !urlSessionId, // Skip the query if sessionId is not available
  });

  console.log(data);

  useEffect(() => {
    if (selectedFeature) {
      setOriginalFeature({ ...selectedFeature });
    }
  }, [selectedFeature]);

  useEffect(() => {
    // get the zoom and center from the url params or use default
    const params = new URLSearchParams(window.location.search);
    const sessionZoom = params.get('zoom');
    const sessionCenter = params.get('center');
    const sessionCenterArray = sessionCenter ? sessionCenter.split(',') : null;
    let defaultZoom = sessionZoom || 6; // default zoom
    let defaultCenter = sessionCenterArray || [-122.3321, 47.6062]; // default center

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = '';
    }
    let geoJsonData = null;
    if (data && data.getMapSession) {
      const { polygons } = data.getMapSession;
      console.log('polygons', polygons);
      if (polygons.length > 0) {
        geoJsonData = {
          type: 'FeatureCollection',
          features: polygons.map((polygon) => ({
            type: 'Feature',
            properties: {
              polygonId: polygon.polygonId,
              name: polygon.name,
            },
            geometry: {
              type: 'Polygon',
              coordinates: [polygon.coordinates],
            },
          })),
        };
        console.log('geoJsonData', geoJsonData);
      }
    }
    console.log('geoJsonData', geoJsonData);

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: defaultCenter,
      zoom: defaultZoom,
    });

    // zoom control
    const navControl = new mapboxgl.NavigationControl();
    mapRef.current.addControl(navControl, 'bottom-right');

    // polygon draw tool
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'draw_polygon',
    });

    if (geoJsonData) {
      mapRef.current.on('load', () => {
        // if (!mapRef.current.getSource('polygons')) {
        console.log('inside the load');
        console.log(geoJsonData);
        mapRef.current.addSource('polygons', {
          type: 'geojson',
          data: geoJsonData,
        });

        mapRef.current.addLayer({
          id: 'polygons-layer',
          type: 'fill',
          source: 'polygons',
          layout: {},
          paint: {
            'fill-color': '#888888',
            'fill-opacity': 0.4,
          },
        });
        // }

        drawRef.current.add(geoJsonData);
      });
    }

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

        if (!sessionId) {
          updateSessionId(e.features[0].id);
        }
        if (e.features[0].properties?.name) {
          setNameInput(e.features[0].properties?.name);
        }

        // const feature = e.features[0];
        //TODO need to ignore the initial create here
        // setHistory((prevHistory) => {
        //   const newHistory = { ...prevHistory };
        //   if (!newHistory[feature.id]) {
        //     newHistory[feature.id] = [];
        //   }
        //   newHistory[feature.id].push({ ...feature });
        //   return newHistory;
        // });
      }
    }
  }, [sessionId, data]);

  // TODO there should be a better way to overwrite the feature name for the polygon than a delete/add
  const handleSaveName = async () => {
    if (selectedFeature) {
      selectedFeature.properties.name = nameInput;
      drawRef.current.delete(selectedFeature.id); // delete old feature and put in new one with updated name
      drawRef.current.add(selectedFeature); // add new feature with updated name
      const input = {
        sessionId: sessionId,
        polygonId: selectedFeature.id,
        name: nameInput,
        coordinates: selectedFeature.geometry.coordinates[0],
      };

      await createPolygon(input);
    }
  };

  const handleDelete = () => {
    if (selectedFeature) {
      // setHistory((prevHistory) => {
      //   const newHistory = { ...prevHistory };
      //   if (!newHistory[selectedFeature.id]) {
      //     newHistory[selectedFeature.id] = [];
      //   }
      //   newHistory[selectedFeature.id].push({ ...selectedFeature });
      //   return newHistory;
      // });
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
      // setHistory((prevHistory) => ({
      //   ...prevHistory,
      //   [selectedFeature.id]: [...prevHistory[selectedFeature.id]],
      // }));
      // setHistory([...history]);
      drawRef.current.delete(selectedFeature.id);
      drawRef.current.add(previousState);
      setSelectedFeature(previousState);
      setNameInput(previousState.properties.name || '');
    }
  };

  const generateShareLink = () => {
    const zoom = mapRef.current ? mapRef.current.getZoom() : 6; // Default zoom if mapRef is not initialized
    const center = mapRef.current
      ? mapRef.current.getCenter().toArray()
      : [-122.3321, 47.6062]; // Default center if mapRef is not initialized
    const shareLink = `${window.location.origin}${
      window.location.pathname
    }?sessionId=${sessionId}&zoom=${zoom}&center=${center.join(',')}`;
    return shareLink;
  };

  return (
    <>
      <div ref={mapContainerRef} id="map" style={{ height: '90vh' }}></div>
      <div style={{ position: 'absolute', bottom: 20, left: 70 }}>
        <Typography variant="body2">
          Share this map:{' '}
          <a target="_blank" href={generateShareLink()}>
            Link
          </a>
        </Typography>
      </div>
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
