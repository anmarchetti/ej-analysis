## Imports

The code snippet utilizes several imports:

- `useEffect` and `useState` from `react`: These hooks are essential for managing side effects and state within the React functional component.
- `useMap` from `@vis.gl/react-google-maps`: This hook is likely used to interact with the Google Maps instance within a React application.
- `BBox` from `geojson`: This is used to type the bounding box, which represents a rectangular geographical area.

## Structure

### Interfaces and Constants

- **`IUseMapViewportData` Interface**: This defines the shape of the data returned by the `useMapViewport` hook. It includes:
  - `bbox`: A `BBox` array representing the bounding box of the current map view.
  - `zoom`: A number that represents the current zoom level of the map, which can be undefined.

- **Constants (`D_180` and `D_90`)**: These constants are used to define the maximum and minimum values for latitude and longitude in the bounding box.

- **`DEFAULT_BBOX` Constant**: This sets the default bounding box to cover the entire world.

### `useMapViewport` Hook

This custom hook is designed to provide the current viewport data of a Google map. It utilizes the `useMap` hook to get the current map instance and then sets up state management for `bbox` and `zoom`. It returns an object containing the current `bbox` and `zoom` values.

## Logic

1. **Initialization**:
   - The `useMap` hook is called to obtain the current map instance.
   - State hooks (`useState`) are initialized with default values. The bounding box starts as the entire world, and the zoom level is initialized to the current zoom level of the map, if available.

2. **Effect Hook (`useEffect`)**:
   - The effect hook is used to set up a listener on the map instance that triggers on the 'idle' event, which indicates that the map has loaded or that panning/zooming has completed.
   - Inside the listener:
     - It checks if the map, its bounds, zoom, and projection are defined.
     - Retrieves the southwest (`sw`) and northeast (`ne`) corners of the map bounds.
     - Calculates a new bounding box (`bbox`) ensuring the values do not exceed predefined limits (`D_180` and `D_90`).
     - Updates the `bbox` and `zoom` state with the new values.

3. **Cleanup**:
   - The cleanup function returned by `useEffect` removes the event listener when the component unmounts or the map instance changes, preventing potential memory leaks.

4. **Return Value**:
   - The hook returns an object containing the current `bbox` and `zoom`, which can be used by other components to react to changes in the map's viewport.