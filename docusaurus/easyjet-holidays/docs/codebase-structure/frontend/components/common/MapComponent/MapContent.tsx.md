## Imports

The `MapContent` component utilizes several imports from both third-party libraries and internal modules:

- **React Imports:**
  - `FC` (Function Component type), `useEffect`, `useRef`, and `useState` from `react` for creating functional components with hooks.
  
- **Third-Party Library Imports:**
  - `useMap` from `@vis.gl/react-google-maps` is used to interact with the Google Maps API.
  
- **Internal Module Imports:**
  - `useStore` from `frontend/hooks/useStore` for accessing the application's state management.
  - Data models such as `IOfferWithHotelData`, `IStop`, `TOnRouteChange`, `IGeoPoint`, `TRestoreState`, and `TSelectedMapCardData` from `models/data` to type-check the data used in the component.
  - Component and utility imports:
    - `CustomOverlay`, `MapCard`, and `ClusteredMarkers` are React components used for rendering parts of the map interface.
    - `Route` is a component for displaying routes on the map.
    - `getOverlayPosition` from `./Clusters/ClusteredMarkers.utils` is a utility function to determine the position of overlays on the map.

## Structure

The `MapContent` component is structured as follows:

- **Props:**
  - Defined by the `IMapContentProps` interface, props include data points like `hotels`, `hotel`, and `route`, as well as callback functions such as `onRouteChange`, `onSaveState`, and `onUnmount`.
  
- **State and Refs:**
  - `selected`: State to keep track of the currently selected map card data.
  - `cachedHotelData`: A `useRef` hook used to store a cache of hotel data for performance optimization.

- **Hooks:**
  - `useMap` to get the current map instance.
  - `useStore` to access the current pathname from the router store.
  - Two `useEffect` hooks:
    - The first for handling side effects when the `selected` state changes.
    - The second for cleanup activities when the component unmounts or the `pathname` changes.

- **Conditional Rendering:**
  - `ClusteredMarkers` component for handling clusters of markers.
  - `Route` component that is conditionally rendered if there are any stops in the `route`.
  - `CustomOverlay` and `MapCard` that are rendered when a map card is selected.

## Logic

The component handles several key functionalities:

- **Map State Management:**
  - Uses the `useMap` hook to interact with the Google Maps instance and `useState` to manage the selected state.
  - When the `selected` state changes, it triggers the `onSaveState` callback to save the current state, which includes the zoom level and selected map card data.

- **Data Caching:**
  - Uses a `useRef` to maintain a cache (`cachedHotelData`) of hotel data across renders without triggering re-renders.

- **Cleanup and URL Dependency:**
  - On component unmount or when the `pathname` changes, it triggers the `onUnmount` callback and clears the cached hotel data to prevent memory leaks and ensure data consistency.

- **Interaction Handling:**
  - The component allows interaction with different parts of the map, such as selecting different hotels or stops, and dynamically rendering routes and overlays based on user interactions and the provided props.