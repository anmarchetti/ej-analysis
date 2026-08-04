## Imports

The `AmendmentSortMobile` component utilizes several imports from both internal modules and third-party libraries:

- **React Essentials**: Imports `FC` (Functional Component), `useEffect`, and `useState` from the `react` library for component lifecycle management and state handling.
- **Classnames Utility**: Uses `classnames` for conditional and dynamic classname assignments.
- **Internal Hooks and Models**:
  - `useStore` from `frontend/hooks/useStore` to access the application store.
  - `ISelectOption` from `models/data/ISelectOption` defines the interface for select options.
  - Enums `AlternativeFlightsSortBy` and `AlternativeHotelsSortingOptions` from `models/enum` to define sorting options.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing dictionary values for labels and buttons.
- **UI Components**:
  - `Button` and `Drawer` from `frontend/components/common` for rendering buttons and a drawer modal.
  - `SvgSortBy` and `SvgTick` from `frontend/components/icons` and `icons-new` respectively, for rendering SVG icons.
- **Styles**: Imports SCSS styles from `./AmendmentSort.module.scss` for styling the component.

## Structure

The `AmendmentSortMobile` component is structured as follows:

- **Type Definitions**:
  - `TSortBy`: A union type derived from `AlternativeFlightsSortBy` and `AlternativeHotelsSortingOptions`.
  - `IAmendmentSortMobileProps`: An interface defining the props for the component.
  
- **Component Definition**:
  - A functional component `AmendmentSortMobile` that takes `IAmendmentSortMobileProps` as props.
  - Internal state management with `useState` for tracking the drawer's open state and the currently selected option.
  - Utilizes `useEffect` to update the selected option when the drawer opens or the sort by value changes.

- **JSX Layout**:
  - A button to trigger the opening of the drawer.
  - A `Drawer` component that contains:
    - A list of options that can be selected.
    - Action buttons (`Cancel` and `Apply`) at the bottom of the drawer.

## Logic

- **State and Store Usage**:
  - `isDrawerOpen`: A boolean state to manage the visibility of the drawer.
  - `selectedOption`: State to keep track of the currently selected sorting option.
  - `getPhrase`: A function fetched from the store to retrieve localized phrases for labels and buttons.

- **Event Handlers**:
  - `onApplyClick`: Checks if the selected option has changed compared to the current `sortBy` and calls `onApplySortBy` with the new sort value, then closes the drawer.
  - `onCancelClick`: Simply closes the drawer without applying any changes.

- **Effect Hook**:
  - Ensures that when the drawer opens, the option that matches the current `sortBy` value is pre-selected.
  - Reacts to changes in `isDrawerOpen`, `sortBy`, and `options`.

- **Conditional Rendering**:
  - Conditional classes and text are applied based on whether the sorting is for hotels or flights, using `isHotelChangeFlow`.
  - The `isSelectedOption` function checks if an option is the currently selected one to highlight it in the UI.

This documentation outlines how the `AmendmentSortMobile` component is structured, its dependencies, and its internal logic, focusing on state management, conditional rendering, and interaction handling.