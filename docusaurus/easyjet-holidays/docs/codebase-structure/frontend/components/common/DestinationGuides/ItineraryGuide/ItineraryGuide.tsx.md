## Imports

The ItineraryGuide component imports various libraries and modules:

- **React and Hooks**: Uses `React`, `useEffect`, `useMemo`, and `useState` from the `react` package for managing component lifecycle and memoization of values.
- **ControlPosition**: Imported from `@vis.gl/react-google-maps` to manage the positioning of controls on the map.
- **Local Utilities and Services**:
  - `cmsUrls` from `code/endpoints` for managing URL endpoints.
  - `useXSMobileViewport` from `frontend/hooks/useMediaQuery` to check if the viewport size is extra small.
  - `useStore` from `frontend/hooks/useStore` for accessing the application's store.
  - `HotelsService` from `frontend/services/hotels.service` for fetching hotel data.
- **Data Models**:
  - `IImage`, `IStop`, `ITour`, `TOnRouteChange` from `models/data` and `models/data/map` for type definitions related to hotels, stops, tours, and route changes.
  - `IGeoPoint` from `models/data/map/IMap` for geographical point data type.
- **Utility Functions**:
  - `removeDuplicates` from `frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils` to handle duplicate data removal.
- **Components and Styles**:
  - `MapComponent` from `frontend/components/common/MapComponent/MapComponent` for rendering the map.
  - `styles` from `./ItineraryGuide.module.scss` for specific styling of the component.

## Structure

The `ItineraryGuide` component is defined as a functional component using React's Functional Component (FC) type, with props specified by the `IItineraryGuideProps` interface. This interface includes:
- `onRouteChange`: A function to handle changes in the route.
- `tour`: An object representing the tour data.
- `selectedStop`: An optional object representing the selected stop in the tour.

The component utilizes React hooks for state management and side effects:
- `useState` to manage the state of hotels (`hotels`).
- `useEffect` to fetch hotel data when the `destinationCode` changes.
- `useMemo` to compute the `route` based on the `tour` data.

## Logic

1. **State Management**:
   - `hotels` state is initialized as an empty array and updated with fetched hotel data.

2. **Fetching Hotel Data**:
   - The `useEffect` hook triggers the fetching of hotel data from `HotelsService` based on the `destinationCode`. If `destinationCode` is not available, the fetching process is skipped.
   - Fetched hotel data is processed to remove duplicates before setting the `hotels` state.

3. **Route Computation**:
   - The `route` is computed using `useMemo` to ensure that it is recalculated only when `tour` data changes.
   - The computation maps over `tour.children`, extracting and transforming necessary fields to conform to the `IStop` model, including handling of nested `Images`.

4. **Rendering**:
   - The `MapComponent` is rendered with properties bound to the state and computed values (`hotels`, `route`, `selectedStop`, `onRouteChange`).
   - The `zoomControlPosition` is conditionally set based on the screen size using `isScreenExtraSmall`.

This component integrates tightly with the `MapComponent`, providing it with necessary data and configurations to display an interactive map tailored to the tour's itinerary.