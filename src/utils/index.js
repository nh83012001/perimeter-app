export const isValidCoordinate = (coord) =>
  !isNaN(parseFloat(coord)) && isFinite(coord);

export const isValidCenterArray = (array) =>
  Array.isArray(array) &&
  array.length === 2 &&
  isValidCoordinate(array[0]) &&
  isValidCoordinate(array[1]);

export const isValidZoom = (zoom) => {
  const zoomNumber = Number(zoom);
  return !isNaN(zoomNumber) && zoomNumber !== 0;
};
