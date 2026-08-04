## Imports

The Route component imports several JavaScript and CSS modules to function correctly:

- `AdvancedMarker` from `@vis.gl/react-google-maps` is used for rendering custom map markers.
- `onMouseEnter` and `onMouseLeave` are event handlers imported from `frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils` for mouse interactions with the markers.
- `useRoute` is a custom hook from `frontend/components/common/MapComponent/hooks/useRoute` that presumably provides utilities related to route handling.
- `createInfoWindow`, `getOnStopClick`, and `IUseRouteProps` are imported from `./Route.utils`. These utilities manage the information window interactions and provide TypeScript interfaces for type checking.
- `styles` imports specific SCSS module styles from `./Route.module.scss` for styling components within the Route component.

## Structure

The Route component is defined as a functional component using React's functional component syntax. It accepts props of type `IUseRouteProps`. The structure includes:

- **useRoute Hook**: This custom hook is used to get helper functions and objects related to the map, which are destructured from the hook's return value.
- **Props Destructuring**: The component destructs `route`, `selectedStop`, and `setSelected` from its props to handle the list of stops, the currently selected stop, and a setter function for updating the selected stop.
- **Return JSX**: The component returns a React fragment (`<>...</>`). Inside the fragment, it maps over the `stops` array to generate an `AdvancedMarker` for each stop. Each marker is configured with properties and event handlers to manage marker behavior and interactions.

## Logic

The logic of the Route component revolves around rendering and managing a list of interactive map markers:

- **Marker Configuration**: Each stop in the `stops` array is used to create an `AdvancedMarker`. The `key` for each marker is the stop's `id`, and its `position` comes directly from the stop data.
- **Z-Index Increment**: The `zIndex` of each marker is set to its index in the array plus one, ensuring that markers are layered in the order they appear in the array.
- **Click Event**: On clicking a marker, it closes any open info window (`helper.current.info?.close()`) and executes `getOnStopClick`, which is responsible for handling the logic when a stop is clicked (likely updating the selected stop and showing new information).
- **Mouse Enter and Leave Events**: These events manage the display of the info window when a user hovers over a marker, but only if the marker is not currently selected. `onMouseEnter` and `onMouseLeave` from the imported utilities are called to handle additional mouse enter and leave behaviors.
- **Conditional Rendering**: Inside each marker, a `div` is rendered with an ID set to the stop's `id` and styled using the imported `styles.wrapper`. The index of the stop is displayed inside this div.

This setup allows for a dynamic and interactive map interface where users can click and hover over markers to receive more information about each stop in a visually coherent manner, with styles managed through SCSS for consistency and maintainability.