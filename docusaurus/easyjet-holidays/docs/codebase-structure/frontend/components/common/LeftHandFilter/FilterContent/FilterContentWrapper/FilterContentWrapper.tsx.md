## Imports

The component imports several dependencies and resources:

- `React` and `useEffect` from the `react` package for creating the component and handling side effects.
- `classNames` from the `classnames` package to conditionally join class names together.
- `observer` from `mobx-react` to make the component reactive to MobX state changes.
- Custom hooks `useMobileViewport` and `useStore` from `frontend/hooks` to handle responsive behavior and state management, respectively.
- Type `IHolidaysStores` from `frontend/store/holidays/create-stores` which defines the shape of the stores used.
- SCSS module styles from `FilterContent.module.scss` for styling the component.
- `FiltersHeader` and `FilterContentElement` components for displaying the header and individual filter elements of the filter content.

## Structure

The `FilterContentWrapper` component is structured as follows:

- **Props**: It accepts an optional `isCollapsed` boolean prop to determine if the filter content should be collapsed or not.
- **State Management**: Utilizes the `useStore` custom hook to extract necessary state and actions from MobX stores:
  - `filterGroups` and `availableFilters` from `searchFiltersStore`.
  - `totalOffers` from `hotelsStore`.
  - `hideAllFilter` action and `store` instance from `searchFiltersStore`.
- **Responsive Handling**: Uses the `useMobileViewport` hook to determine if the current viewport is mobile-sized.
- **Effects**: A `useEffect` hook to call `hideAllFilter` when `isCollapsed`, `availableFilters`, or `totalOffers` changes.
- **Rendering**:
  - Conditional rendering of `FiltersHeader` based on whether the device is not mobile.
  - Maps through `filterGroups` to render `FilterContentElement` for each group, passing `group` and `storeInstance` as props.

## Logic

- **Collapse Logic**: The component uses the `isCollapsed` prop to control the visibility of filters based on the viewport size or external conditions.
- **Responsive Design**: The display of the `FiltersHeader` is dependent on the `isMobile` state, optimizing the layout for mobile devices.
- **Reactivity**: Wrapped by `observer` from MobX, making the component reactive to changes in the MobX store state. This ensures that the component re-renders when relevant parts of the store change.
- **Side Effects**: The `useEffect` hook is used to perform side effects based on changes to `isCollapsed`, `availableFilters`, or `totalOffers`. This includes calling `hideAllFilter`, which presumably controls the visibility of filters based on certain conditions.
- **Dynamic Class Assignment**: Uses `classNames` to dynamically assign CSS classes for styling based on the component's state or props.