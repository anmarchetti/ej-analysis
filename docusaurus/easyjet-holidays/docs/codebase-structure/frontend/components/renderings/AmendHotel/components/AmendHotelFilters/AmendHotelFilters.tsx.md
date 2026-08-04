## Imports

The `AmendHotelFilters` component uses several imports to function properly:

- **React and Hooks**: Utilizes `React` and the `useEffect` hook for lifecycle management and `FC` (Function Component) for typing.
- **classnames**: A utility to conditionally join classNames together.
- **MobX**: Imports `observer` from `mobx-react` to make the component reactive to state changes.
- **Custom Hooks**:
  - `useMobileViewport`: A custom hook to check if the viewport is mobile-sized.
  - `useStore`: A custom hook for accessing MobX stores.
- **Type Definitions**:
  - `IHolidaysStores`: Interface for the holiday stores, used for typing the store structure in `useStore`.
- **Enums**:
  - `FilterGroupCodes`: Enum used to define constants representing filter group codes.
- **Components**:
  - `ClearAllPanel`, `FilterContentElement`, `FiltersHeader`: React components used within the main component to structure the filter UI.
- **CSS Module**:
  - `styles`: Styles module imported as `styles` from `AmendHotelFilters.module.scss` for scoped CSS.

## Structure

The `AmendHotelFilters` component is structured as follows:

- **Main Component Definition**: It is defined as a functional component `AmendHotelFilters` using React's Function Component (FC).
- **State and Store Interaction**:
  - Utilizes the `useStore` hook to destructure and extract necessary states from the MobX store related to hotel amendments such as available filters, filter loading state, and others.
- **Effect Hook**:
  - `useEffect` is used to call the `hideAllFilter` function when the `isFiltersLoaded` or `isMobileDrawerOpen` states change.
- **JSX Structure**:
  - The component returns a `div` element with a conditional rendering of the `FiltersHeader` based on the viewport size.
  - Filters are mapped and rendered using `FilterContentElement` for each filter group that matches the predefined `filtersToShow`.
  - A `ClearAllPanel` is always rendered at the bottom of the component.

## Logic

- **Mobile Detection**:
  - The `useMobileViewport` hook is used to determine if the device is mobile, which influences both the UI and logic, particularly in how filters are hidden.
- **Filter Management**:
  - Filters are managed based on their presence in the `filtersToShow` array. Only filters with codes present in this array are displayed.
- **Conditional Rendering**:
  - The header component `FiltersHeader` is only rendered if the device is not mobile, optimizing the UI for smaller screens.
- **Dynamic Class Application**:
  - Uses `classNames` to dynamically apply classes to the main `div` wrapper, integrating both custom styles and a generic 'search-filter' class.
- **Reactivity**:
  - Wrapped with `observer` from MobX to ensure that the component re-renders in response to relevant changes in the state within the MobX stores.