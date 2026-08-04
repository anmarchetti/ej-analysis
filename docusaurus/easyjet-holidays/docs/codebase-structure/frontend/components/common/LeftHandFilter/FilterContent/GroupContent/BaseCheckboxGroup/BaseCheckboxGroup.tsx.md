## Imports

The `BaseCheckboxGroup` component imports various modules and functionalities from external and internal sources:

- `FC` from `react`: Importing `FC` (FunctionComponent) type from React to define the functional component type.
- `classNames` from `classnames`: Utility function to conditionally join class names together.
- `observer` from `mobx-react`: A higher-order component for making the React component reactive and automatically re-render when observables change.
- `useStore` from `frontend/hooks/useStore`: A custom hook for accessing MobX stores.
- `IHolidaysStores` from `frontend/store/holidays`: Interface representing the structure of the holidays-related stores.
- `isLabelHidden` from `frontend/utils/filter.utils`: A utility function to determine if a label should be hidden.
- `IFilterOption` from `models/data/IFilters`: Interface representing the structure of filter options.
- `FilterGroupCodes` from `models/enum/FilterGroupCodes`: Enumeration of filter group codes.
- `styles` from SCSS module: Imports specific SCSS module for styling components.
- `TLeftHandFilterStoreInstance` from `frontend/components/common/LeftHandFilter/FilterContent/models`: Type representing an instance of the left-hand filter store.
- `FilterCheckControl` from the same directory: A component to render individual checkbox or radio button controls.

## Structure

The `BaseCheckboxGroup` component is defined as a functional component using TypeScript. It takes `IBaseCheckboxGroup` as props, which includes:

- `code`: A value from `FilterGroupCodes` enum that identifies the group of filters.
- `storeInstance`: An instance of the left-hand filter store.

Inside the component:

- The `useStore` custom hook is used to extract the `getSetting` method from the layout store.
- Several methods and properties are destructured from `storeInstance` to manage the filter options and their states.
- The `getPreparedGroupContent` method is called with the `code` to retrieve the content to be displayed.
- A check is performed to decide if the count labels should be hidden using `isCountHiddenByStore` and `isLabelHidden`.

The returned JSX contains a `div` element that conditionally applies CSS classes and maps over the `content` array to render `FilterCheckControl` components for each filter option.

## Logic

The component's logic revolves around rendering a group of filters (either checkboxes or radio buttons) based on the provided `code`. The key functionalities include:

- **Dynamic Styling**: Uses `classNames` to apply the `checkboxGroup` class universally and `duration-filter` class conditionally if the `code` matches `FilterGroupCodes.Duration`.
- **Rendering Filters**: Iterates over the `content` array, which contains filter options, rendering a `FilterCheckControl` for each option. The properties passed to each `FilterCheckControl` determine its appearance and behavior:
  - `key`: Unique key for React's rendering performance.
  - `option`: The current filter option data.
  - `checked`: Boolean indicating if the filter is currently selected.
  - `onChange`: Event handler to change the filter state.
  - `disabled`: Boolean indicating if the filter should be disabled based on its count, code, and additional criteria.
  - `isRadioButton`: Boolean that converts the control into a radio button if the `code` is `FilterGroupCodes.Duration`.
  - `hideLabelCount`: Boolean to determine if the option count label should be hidden.
- **Reactivity**: Wrapped with `observer` from MobX to ensure the component re-renders in response to relevant observable changes in the MobX state tree.