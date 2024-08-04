import './App.css';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Box, Button, TextField, Paper, Typography } from '@mui/material';
import { useCreateOrUpdatePolygon } from './hooks/useCreateOrUpdatePolygon';
import { useDeletePolygon } from './hooks/useDeletePolygon';
import { useGetMapSession } from './hooks/useGetMapSession';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { isValidCenterArray, isValidZoom } from './utils';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const App = () => {
  const { createOrUpdatePolygon } = useCreateOrUpdatePolygon(); // custom hook to create or update polygon
  const { deletePolygon } = useDeletePolygon(); // custom hook to delete polygon
  const { getMapSession } = useGetMapSession(); // custom hook to get polygons from the server
  const mapContainerRef = useRef(); // ref for div DOM element where the Mapbox map will be rendered. The mapContainerRef.current is passed to the container property when initializing the Mapbox map to specify where the map should be rendered.
  const mapRef = useRef(); // ref to store mapbox instance. When the map is initialized, the mapRef.current is set to the newly created Mapbox map object
  const drawRef = useRef(); // ref to store the MapboxDraw instance (draw polygon, delete feature). We add
  const [selectedFeatures, setSelectedFeatures] = useState([]); // Hold all the features you have selected on the map
  const [nameInput, setNameInput] = useState(''); // Name of the polygon
  const [sessionId, setSessionId] = useState(null); // the user session for the map
  const [mapData, setMapData] = useState(null); // Just the polygons received from the server
  const [hasChanges, setHasChanges] = useState(false); // tracking changes to name and polygon to enable save button
  const sessionIdSetRef = useRef(false); // Ref to track if sessionId has been set

  // Update sessionId state if it's not already set. This would get run if you create your first polygon in a new session
  function updateSessionId(initialPolygonId) {
    if (!sessionIdSetRef.current) {
      setSessionId(initialPolygonId);
      sessionIdSetRef.current = true; // Mark sessionId as set
    }
  }

  // Fetch map session data when component mounts
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
    // Only running on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize and configure the map when mapData is available
  useEffect(() => {
    // get the zoom and center from the url params or use default
    const params = new URLSearchParams(window.location.search);
    const sessionZoom = params.get('zoom'); // fetch zoom from parameter.
    const sessionCenter = params.get('center'); // fetch center from parameters
    const sessionCenterArray = sessionCenter ? sessionCenter.split(',') : null;
    let defaultZoom = isValidZoom(sessionZoom) ? Number(sessionZoom) : 6; // default zoom. Checked and mapbox can accept things like -2, 42, and 20.192038091823. So just need to check it is a number (errors if you provide string)
    let defaultCenter = isValidCenterArray(sessionCenterArray)
      ? sessionCenterArray
      : [-122.3321, 47.6062]; // default center

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
        drawRef.current.add(geoJsonData);
      });
    }
    mapRef.current.on('draw.delete', (e) => {
      handleDelete(e);
    });
    drawRef.current = draw;
    mapRef.current.addControl(draw);
    mapRef.current.on('draw.create', updateArea);
    mapRef.current.on('draw.update', updateArea);
    mapRef.current.on('draw.selectionchange', (e) => {
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
      }
    }
    // Disabling because I am adding listeners to the mapref that are causing this error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData]);

  // TODO there should be a better way to overwrite the feature name for the polygon than a delete/add
  // Save the polygon - could be initial create or updating an existing polygon
  const handleSave = async () => {
    if (selectedFeatures) {
      selectedFeatures[0].properties.name = nameInput;
      selectedFeatures[0].properties.saved = true;
      const polygonId = selectedFeatures[0]?.properties?.polygonId
        ? selectedFeatures[0]?.properties?.polygonId // Previously saved and fetched so polygonId isn't recreated
        : selectedFeatures[0].id; // new polygon you created so we use mapbox id
      drawRef.current.delete(selectedFeatures[0].id); // delete old feature
      drawRef.current.add(selectedFeatures[0]); // add new feature with updated name
      const input = {
        sessionId: sessionId,
        polygonId: polygonId,
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

  // Could be deleting a single or multiple polygons
  const handleDelete = async (e) => {
    if (e) {
      // if being passed in from trashcan button
      const polygonId = e.features[0]?.properties?.polygonId
        ? e.features[0]?.properties?.polygonId // Previously saved and fetched
        : e.features[0].id; // new polygon you created
      const input = {
        sessionId,
        polygonId: polygonId,
      };
      await deletePolygon(input);
      drawRef.current.delete(e.features[0].id);
    }
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

  // When you click the copy link button, we create the link. This is to get the current zoom/center and not have to track it
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
      <div ref={mapContainerRef} id="map" style={{ height: '95vh' }}></div>
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyToClipboard}
          style={{ marginBottom: '10px' }}
        >
          Copy map link
        </Button>
        {selectedFeatures.length == 1 && (
          <Paper style={{ width: '350px', padding: '10px' }}>
            <Typography
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#333',
                textAlign: 'left',
              }}
            >
              Edit Polygon Point: When you hover over a point of the polygon,
              the cursor should change to a pointer (hand icon), indicating that
              the point is clickable. Click on the point to switch to editing
              the vertex, then click and drag it to a new location.
              <br />
              Move Polygon: Click inside the polygon or on its edge and drag the
              entire polygon to a new location. <br />
              Press &apos;Save&apos; when done.
            </Typography>
          </Paper>
        )}
      </div>

      {selectedFeatures.length > 1 && (
        <Paper
          elevation={3}
          style={{
            position: 'absolute',
            bottom: 70,
            left: 50,
            padding: 15,
            backgroundColor: 'white',
            width: 300,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleDelete(false)}
          >
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
            left: 60,
            padding: 15,
            backgroundColor: 'white',
            width: 300,
          }}
        >
          <br />
          <TextField
            value={nameInput}
            onChange={(e) => {
              setHasChanges(true);
              setNameInput(e.target.value);
            }}
            label="Polygon Name"
            style={{ marginBottom: '18px' }}
          />

          <Box display="flex" justifyContent="space-between">
            <Button variant="contained" onClick={() => handleDelete(false)}>
              Delete
            </Button>
            <Button
              variant="contained"
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
