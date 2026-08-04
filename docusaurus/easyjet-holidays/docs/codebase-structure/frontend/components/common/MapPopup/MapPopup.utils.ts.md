## Imports

The module imports several hooks and components from React and other libraries:

- `useEffect`, `useState` from `react`: Standard React hooks for managing side effects and component state.
- `ControlPosition` from `@vis.gl/react-google-maps`: Enum from the Google Maps library to control the position of UI elements on the map.
- Custom hooks:
  - `useMobileViewport` from `frontend/hooks/useMediaQuery`: Determines if the viewport is mobile-sized.
  - `useStore` from `frontend/hooks/useStore`: Custom hook for accessing the application's store.
- Constants and types:
  - `MIN_TOTAL_ITEMS` from `frontend/store/base/search/BaseSearchFilterStore`: A constant specifying the minimum number of items required for some operations.
  - `TStores` from `frontend/store/IStores`: Type definition for the app store.
  - `IGeoPoint`, `TRestoreState`, `TSelectedMapCardData` from `models/data/map/IMap`: Data models related to map functionalities.
  - `isLoadingStatus` from `models/enum/DataStatus`: Utility function to determine if the current data status indicates loading.

## Structure

The code defines several TypeScript interfaces to type-check the component props and internal state management:

- `IMapPopupProps`: Defines the types for the props accepted by the `useMapPopup` hook, which includes a function `onCloseMapPopup`.
- `IMapPopupData`: Describes the structure of the data object returned by the `useMapPopup` hook, including methods and properties related to map handling, mobile responsiveness, and UI state.
- `IMapPopupState`: Specifies the internal state used in the map popup, such as `accomId` and `zoomLevel`.

The `MAP_PARAMS` constant provides default parameters for map settings, such as minimum zoom level and control position.

## Logic

The `useMapPopup` hook encapsulates the logic for managing a map popup's state and interactions:

1. **State Initialization**: Utilizes `useState` to manage visibility of the popup (`isShown`).

2. **Store Integration**:
   - Uses `useStore` to bind relevant parts of the global store to local variables. This includes hotel data, localization phrases, and various state update functions.
   - An effect hook (`useEffect`) is used to set a store value when the component mounts.

3. **Event Handlers and State Management**:
   - `onSaveState`: Handles saving the current state of the map (zoom level and selected hotel) to the URL query parameters.
   - `restoreState`: Attempts to restore the map state from the URL query parameters, finding the corresponding hotel and setting the zoom level.
   - `resetSelectedFilterGroups`: Resets selected filters when the map popup is opened or closed.

4. **Responsive and Conditional Rendering**:
   - The hook checks if the viewport is mobile-sized using `useMobileViewport`.
   - Adjusts UI components and behavior based on mobile state and the number of hotels available.

5. **Return Value**: Constructs and returns an object containing all necessary data and handlers required by a component to render and manage the map popup, including methods for opening and closing the popup, handling mobile-specific UI, and responding to loading states.

This hook abstracts complex logic and state management away from the UI component, promoting cleaner and more maintainable component code.