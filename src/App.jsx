import './App.css';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Box, Button, TextField, Paper, Typography } from '@mui/material';
import { useCreateOrUpdatePolygon } from './hooks/useCreateOrUpdatePolygon';
import { useDeletePolygon } from './hooks/useDeletePolygon';
import { useGetMapSession } from './hooks/useGetMapSession';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const App = () => {
  const { createOrUpdatePolygon } = useCreateOrUpdatePolygon();
  const { deletePolygon } = useDeletePolygon();
  const { getMapSession } = useGetMapSession();
  // TODO check for params in url for sessionID and fetch data from server
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const drawRef = useRef();
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [originalFeature, setOriginalFeature] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

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
    setSessionId(sessionIdFromUrl);

    const fetchMapSession = async () => {
      const input = { sessionId: sessionIdFromUrl };
      const response = await getMapSession(input);
      setMapData(response.data);
    };
    if (sessionIdFromUrl) {
      fetchMapSession();
    }
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    if (selectedFeatures) {
      setOriginalFeature({ ...selectedFeatures[0] });
    }
  }, [selectedFeatures]);

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
    if (mapData && mapData.getMapSession) {
      const { polygons } = mapData.getMapSession;
      if (polygons.length > 0) {
        geoJsonData = {
          type: 'FeatureCollection',
          features: polygons.map((polygon) => ({
            type: 'Feature',
            properties: {
              polygonId: polygon.polygonId,
              name: polygon.name,
              saved: true,
            },
            geometry: {
              type: 'Polygon',
              coordinates: [polygon.coordinates],
            },
          })),
        };
      }
    }

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
    mapRef.current.on('draw.update', updateArea);

    mapRef.current.on('draw.selectionchange', (e) => {
      const allFeatures = drawRef.current.getAll().features;
      if (e.features.length > 0) {
        setSelectedFeatures(e.features);
        setNameInput(e.features[0].properties?.name || '');
      } else {
        setSelectedFeatures([]);
        setNameInput('');
      }
    });

    function updateArea(e) {
      // this could be new or old polygon
      setHasChanges(true); // enable save button
      const data = draw.getAll();
      if (data.features.length > 0) {
        setSelectedFeatures(e.features);
        if (!sessionId) {
          updateSessionId(e.features[0].id);
        }
        if (e.features[0].properties?.name && selectedFeatures.length === 1) {
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
  }, [mapData]);

  // TODO there should be a better way to overwrite the feature name for the polygon than a delete/add
  const handleSave = async () => {
    if (selectedFeatures) {
      selectedFeatures[0].properties.name = nameInput;
      selectedFeatures[0].properties.saved = true;
      drawRef.current.delete(selectedFeatures[0].id); // delete old feature and put in new one with updated name
      drawRef.current.add(selectedFeatures[0]); // add new feature with updated name
      const input = {
        sessionId: sessionId,
        polygonId: selectedFeatures[0].id,
        name: nameInput,
        coordinates: selectedFeatures[0].geometry.coordinates[0],
      };
      const result = await createOrUpdatePolygon(input);
      // gives alert with the error message if the polygon didn't save in the backend
      if (result.data?.createOrUpdatePolygon?.startsWith('ERROR')) {
        alert(result.data.createOrUpdatePolygon);
        return;
      }
      setHasChanges(false); // disable save button
    }
  };

  const handleDelete = async () => {
    if (selectedFeatures.length > 0) {
      selectedFeatures.forEach(async (feature) => {
        const polygonId = feature.properties.polygonId
          ? feature.properties.polygonId // Previously saved and fetched
          : feature.id; // new polygon you created
        const input = {
          sessionId,
          polygonId: polygonId,
        };
        await deletePolygon(input);
        drawRef.current.delete(feature.id);
      });

      const updatedData = drawRef.current.getAll();

      // Update the source data of the map to remove the visual remnants
      if (mapRef.current.getSource('polygons')) {
        mapRef.current.getSource('polygons').setData(updatedData);
      }
      setSelectedFeatures([]);
      setNameInput('');
    }
  };

  // true will enable save button
  // const hasChanges = () => {
  //   if (!selectedFeature || !originalFeature) return false;
  //   return (
  //     nameInput !== originalFeature.properties.name ||
  //     JSON.stringify(selectedFeature.geometry.coordinates) !==
  //       JSON.stringify(originalFeature.geometry.coordinates)
  //   );
  // };

  // undo last change to currently selected polygon
  // const handleUndo = () => {
  //   if (
  //     selectedFeatures &&
  //     history[selectedFeatures[0].id] &&
  //     history[selectedFeatures[0].id].length > 0
  //   ) {
  //     const previousState = history[selectedFeatures[0].id].pop();
  //     // setHistory((prevHistory) => ({
  //     //   ...prevHistory,
  //     //   [selectedFeature.id]: [...prevHistory[selectedFeature.id]],
  //     // }));
  //     // setHistory([...history]);
  //     drawRef.current.delete(selectedFeatures[0].id);
  //     drawRef.current.add(previousState);
  //     setSelectedFeatures(previousState);
  //     setNameInput(previousState.properties.name || '');
  //   }
  // };

  const handleCopyToClipboard = () => {
    if (!sessionId) {
      // I could also make sure that you have at least one feature
      alert('Please save to the map before copying the link');
      return;
    }
    const zoom = mapRef.current ? mapRef.current.getZoom() : 6; // Default zoom if mapRef is not initialized
    const center = mapRef.current
      ? mapRef.current.getCenter().toArray()
      : [-122.3321, 47.6062]; // Default center if mapRef is not initialized
    const shareLink = `${window.location.origin}${
      window.location.pathname
    }?sessionId=${sessionId}&zoom=${zoom}&center=${center.join(',')}`;
    navigator.clipboard.writeText(shareLink);
  };

  return (
    <>
      <div ref={mapContainerRef} id="map" style={{ height: '90vh' }}></div>
      <div style={{ position: 'absolute', top: 50, left: 60 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyToClipboard}
        >
          Copy map link
        </Button>
      </div>

      {selectedFeatures.length > 1 && (
        <Paper
          elevation={3}
          style={{
            position: 'absolute',
            bottom: 70,
            left: 60,
            padding: 15,
            backgroundColor: 'white',
            width: 300,
          }}
        >
          <Button variant="contained" color="primary" onClick={handleDelete}>
            Delete Multiple
          </Button>
        </Paper>
      )}

      {selectedFeatures.length === 1 && (
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
              onClick={() => console.log('undo')}
              disabled={!hasChanges}
            >
              Undo
            </Button>
            <Button variant="contained" color="primary" onClick={handleDelete}>
              Delete
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={!hasChanges || nameInput === ''}
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
