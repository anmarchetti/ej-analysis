### Imports

The `MapControls` component imports various libraries and hooks necessary for its functionality:

- React related imports:
  - `FC`, `memo`, `useEffect`, `useRef`, `useState` from `react` for functional component creation, lifecycle management, and state handling.
  - `createPortal` from `react-dom` to render children into a DOM node that exists outside the DOM hierarchy of the parent component.

- Third-party libraries and hooks:
  - `ControlPosition`, `useMap` from `@vis.gl/react-google-maps` to interact with Google Maps.
  - `classNames` from `classnames` to conditionally join classNames together.

- Custom hooks and utilities:
  - `useStore` from `frontend/hooks/useStore` to access the application's state management.
  - Enums from `models/enum/tracking/GenericEventParams` for tracking actions.

- Component-specific utilities:
  - `changeZoom`, `onZoomChangedCallback` from `./MapControls.utils` to handle zoom functionality.

- Styles:
  - `styles` from `./MapControls.module.scss` to apply CSS modules styling.

### Structure

The `MapControls` component is defined as a functional component using React's Functional Component (`FC`) type, with properties defined in the `IMapControlsProps` interface. These properties include:
- `maxZoom`: Maximum zoom level.
- `minZoom`: Minimum zoom level.
- `zoomPosition`: Position of the zoom controls on the map.
- `closePosition`: Optional position of the close button on the map.

The component utilizes two `useRef` hooks to create references for the containers of the zoom and close controls, which are initially set to newly created div elements.

### Logic

1. **Map Interaction Initialization**:
   - The `useMap` hook is used to get the current Google Map instance.
   - `useStore` custom hook is used to retrieve methods from the store for closing the map and tracking map-related events.

2. **State Management**:
   - A state `zoomStatus` is maintained using `useState` to track the current zoom status, initialized to `0`.

3. **Effect for Map Controls Setup**:
   - An `useEffect` hook is used to set up and clean up map controls:
     - Adds a `zoom_changed` event listener to the map to handle zoom changes.
     - Inserts the zoom controls into the map at the specified `zoomPosition`.
     - Optionally, if `closePosition` is provided, inserts the close control into the map at the specified position.
     - Cleans up by removing the event listener and controls from the map upon component unmount or changes in dependencies.

4. **Rendering**:
   - Uses `createPortal` to render the zoom and close buttons into the respective containers.
   - Conditionally renders the close button if `closePosition` is provided.
   - Buttons have attached click handlers that invoke methods to change the zoom level or close the map, and are disabled based on the current `zoomStatus`.

This component effectively abstracts the functionality for map controls into a reusable interface, managing both the display and state logic associated with interacting with a Google Map instance.