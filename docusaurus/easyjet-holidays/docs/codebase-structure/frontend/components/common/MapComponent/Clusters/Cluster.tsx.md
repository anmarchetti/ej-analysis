## Imports

The `Cluster` component imports various modules and components, which are categorized as follows:

- **External Libraries:**
  - `@vis.gl/react-google-maps`: Specifically imports `AdvancedMarker` for rendering custom markers on Google Maps.
  - `mobx-react`: Imports `observer` to make the component reactive to MobX state changes.

- **Hooks and Utilities:**
  - `useStore`: A custom hook from `frontend/hooks/useStore` for accessing MobX stores.
  - `getFormattedPrice`, `getLatLng`, `onMouseEnter`, `onMouseLeave`: Utility functions from `./ClusteredMarkers.utils` to handle marker operations and data formatting.

- **Store Check:**
  - `isTradeStore`: A function from `frontend/store/tradePortal` to determine if the current store is a trade store.

- **Models and Enums:**
  - `ICluster`: An interface from `models/data/map/IMap` defining the structure of a cluster object.
  - `SitecoreDictionary`: Enum from `models/enum/SitecoreDictionary` providing access to dictionary values.

- **Components:**
  - `IconBed`: A component from `frontend/components/icons/Bed` representing a bed icon.
  - `RoundedPointer`: A component from `frontend/components/icons-new/RoundedPointer` used to display a rounded pointer icon in the UI.

- **Styling:**
  - `styles`: Module CSS imported from `./Cluster.module.scss` for styling the component.

## Structure

The `Cluster` component is defined as a functional component in React using TypeScript. It accepts props of type `IClusterProps`, which include:

- `item`: An object of type `ICluster` representing the cluster data.
- `onClick`: A function to handle click events on the cluster marker.
- `zIndex`: A number indicating the stack order of the marker.

Inside the component:

- **State Management and Computation:**
  - It utilizes the `useStore` hook to derive values such as phrases from the layout store, money formatting function from the market store, and flags indicating if prices are hidden and if the price per person filter is applied.

- **Marker Rendering:**
  - Uses the `AdvancedMarker` component to render a marker on the map with properties such as position, event handlers (`onClick`, `onMouseEnter`, `onMouseLeave`), and a custom `zIndex`.

- **Conditional Rendering:**
  - Inside the marker, it conditionally renders price information and the cluster count based on the presence of `anyPrice` and the `pricesHidden` flag.

- **UI Composition:**
  - The main UI consists of a wrapper `div` with nested `div` elements for displaying the price and the pin, which includes the cluster count, a bed icon, and a rounded pointer.

## Logic

- **Price Determination:**
  - The component decides which price to display (`price` or `pricePP`) based on whether the price per person (`isPricePerPerson`) is true.

- **Phrase and Money Formatting:**
  - Retrieves localized phrases using `getPhrase` and formats the price using `formatMoney`, both derived from MobX stores.

- **Event Handling:**
  - Handles mouse interactions (enter and leave) with utility functions `onMouseEnter` and `onMouseLeave` to possibly alter UI states or perform actions on these events.

- **Styling and Attributes:**
  - Applies CSS modules for styling and uses `data-tid` attributes for potential testing hooks.

This component effectively demonstrates the integration of various technologies including React, TypeScript, MobX, and CSS modules, encapsulating complex logic within a user-friendly interactive map marker.