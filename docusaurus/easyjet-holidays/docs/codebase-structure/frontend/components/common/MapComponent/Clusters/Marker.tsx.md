## Imports
The Marker component uses several imports from various libraries and local modules:

- **@vis.gl/react-google-maps**: Imports `AdvancedMarker` which is likely a custom or extended component for Google Maps markers.
- **classnames**: Utility function to conditionally join classNames together.
- **mobx-react**: Imports `observer` to make the component reactive to MobX state changes.
- **useStore**: A custom hook from `frontend/hooks/useStore` used for accessing MobX stores.
- **isTradeStore**: A utility function from `frontend/store/tradePortal` to determine if the current store is a trade store.
- **IGeoPoint**: An interface from `models/data/map/IMap` representing a geographical point.
- **IconBed, RoundedPointer**: Custom React components representing specific icons, imported from `frontend/components/icons` and `frontend/components/icons-new`.
- **ClusteredMarkers.utils**: Imports utility functions like `getFormattedPrice`, `getLatLng`, `onMouseEnter`, and `onMouseLeave`, as well as a constant `SELECTED_Z_INDEX`.
- **styles**: SCSS module for styling, imported from `./Marker.module.scss`.

## Structure
The Marker component is structured as follows:

- **Props**: Defined by the `IMarkerProps` interface, which includes:
  - `item`: An object of type `IGeoPoint`.
  - `onClick`: A function to handle click events.
  - `zIndex`: Numerical value to control stacking order of markers.
  - `selected`: Optional boolean to indicate if the marker is selected.

- **React Functional Component**: `Marker` uses React functional component syntax and utilizes the `observer` from MobX to make it reactive.

- **Hooks**: Uses the `useStore` custom hook to derive values like phrases, money formatting functions, and visibility conditions from MobX stores.

- **Conditional Rendering**: Inside the return statement, the component conditionally renders different parts of the UI based on the `selected` state and whether certain properties like `name` or `price` are present.

## Logic
The component's logic primarily revolves around handling the display and interaction of a marker:

- **Store Data Extraction**: Extracts necessary data from stores using `useStore`, which includes phrases for localization, functions for formatting money, and flags for UI conditions like hiding prices or determining if the price should be per person.

- **Price Handling**: Determines the correct price to display based on whether the price should be per person or total price. It also handles the conditional rendering of the price or the default icon if no price is provided.

- **Marker Positioning**: Calculates the geographic position of the marker using `getLatLng` utility function.

- **Event Handling**: Attaches `onMouseEnter` and `onMouseLeave` handlers to the marker for potential hover effects.

- **Dynamic Classes and Styles**: Uses the `classnames` library to dynamically apply CSS classes based on the `selected` state. Additionally, uses SCSS modules for styling.

- **Z-Index Management**: Adjusts the `zIndex` of the marker dynamically based on whether it is selected, using a predefined `SELECTED_Z_INDEX` for selected markers to ensure they appear above others.

- **Content Rendering**: Conditionally renders the marker's name or formatted price inside the marker, using custom icon components when no text is available.

This technical documentation outlines the key aspects of the Marker component, focusing on its imports, structural setup, and logical flow.