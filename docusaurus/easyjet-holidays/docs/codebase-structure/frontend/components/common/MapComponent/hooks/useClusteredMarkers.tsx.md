### Imports

The `useClusteredMarkers` hook imports several modules and utilities to facilitate its functionality:

- **React and Hooks**: Uses `useEffect` from `react` for handling lifecycle events.
- **Mapping and Clustering**: Imports `useMap` from `@vis.gl/react-google-maps` for interacting with Google Maps and `Supercluster` for handling clustering of points on the map.
- **Constants and Hooks**: Imports `TWO` from a constants module and `useStore` from a custom hook for accessing the application's store.
- **Type Definitions**: Several interfaces such as `IOfferWithHotelData` and types like `IGeoPoint` and `ICluster` are imported to ensure type safety and clarity in the data manipulation.
- **Utility Functions**: Imports functions like `centerMapCardVertically` and `fitBounds` from a utility module to manage map interactions.
- **Custom Hooks and Constants**: Uses `useSupercluster` custom hook for clustering logic and `DEFAULT_BBOX`, `SUPERCLUSTER_OPTIONS` from local constants for bounding box and clustering options respectively.

### Structure

The `useClusteredMarkers` hook is structured into two main parts:

1. **Interface Definitions**:
   - `IUseClusteredMarkersProps`: Defines the properties expected by the hook including the items to be clustered, selection management functions, and optional parameters like `autoFit` and `cache`.
   - `IUseClusteredMarkersData`: Defines the structure of the data returned by the hook, including the clusterer instance, clustered items, and utility functions.

2. **Hook Definition (`useClusteredMarkers`)**:
   - Initialization and state management using `useMap` to get the current Google Maps instance and `useStore` to access specific methods from the store.
   - Utilizes `useSupercluster` to compute clusters based on the provided items.
   - An `useEffect` hook to handle the map fitting and zoom functionalities based on the items, their changes, and optionally, a restored state.

### Logic

The core functionality of the `useClusteredMarkers` hook revolves around managing and displaying clusters of geographical points on a Google Map:

- **Cluster Management**: Utilizes the `Supercluster` library to create and manage clusters of geographical points (`items`). This is facilitated by the `useSupercluster` hook which abstracts the clustering logic.
- **Auto-Fitting Map**: If `autoFit` is enabled and there are changes in the data (`version` changes), the hook optionally clears the cache, resets selected items, and fits the map bounds to either a restored state or the newly computed clusters.
  - **Restored State**: If there is a saved state, the map zooms and centers based on this state, and the corresponding item is selected.
  - **Dynamic Fitting**: If no saved state is present, the hook calculates the optimal map bounds using the `fitBounds` utility to ensure all clusters are visible within the viewport with appropriate padding.
- **Event Tracking**: Tracks map-related events using the `trackMapEvent` method from the store, allowing for analytics or debugging.
- **Z-Index Management**: Maintains a `zIndexMap` to manage the stacking order of map elements, which is crucial for visual clarity when dealing with overlapping clusters.

This hook abstracts complex map and clustering interactions into a reusable and configurable component, enhancing maintainability and scalability of the map-related features within the application.