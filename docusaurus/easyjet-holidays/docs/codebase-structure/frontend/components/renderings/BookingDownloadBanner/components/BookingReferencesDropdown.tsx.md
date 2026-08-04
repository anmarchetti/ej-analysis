## Imports

The `BookingReferencesDropdown` component utilizes several imports from various sources to incorporate functionality, styling, and data management:

- **React and Hooks**: Imports `FunctionComponent` and `useState` from `react` to define the component type and manage state.
- **Classnames**: Utilizes the `classnames` library to conditionally apply CSS classes.
- **MobX**: Uses `observer` from `mobx-react` for state management within the component, making it reactive to changes in the state.
- **Custom Hooks and Store**: `useStore` is imported from `frontend/hooks/useStore` to access application state, and `isHolidayStore` is from `frontend/store/holidays/create-stores` to determine if the current store is a holiday store.
- **Utilities**: `getFlightsReferences` from `frontend/utils/route.utils` is used to process flight information.
- **Models**: Imports `IRoute` from `models/data/IRoute` and `SitecoreDictionary` from `models/enum/SitecoreDictionary` for typing and enum values.
- **Components**: `AccordionButton` from `frontend/components/common/AccordionButton` and `BookingReferencesDropdownItem` from the same directory structure are used to build parts of the UI.
- **Local Components**: `BookingRefDropdownContent` is a local component used for displaying content conditionally.
- **Styles**: CSS module `styles` from `./BookingReferencesDropdown.module.scss` to apply component-specific styles.

## Structure

The `BookingReferencesDropdown` component is structured as follows:

- **Type Definitions**: Defines `TBookingReferencesDropdownProps` to type-check the component props.
- **Component Definition**: The component is defined as a functional component using React's `FunctionComponent`.
- **State Management**: Uses the `useState` hook to manage the `isExpanded` state, which tracks if the dropdown is open.
- **Store Integration**: Uses `useStore` to determine if the booking is part of a flight and hotel package.
- **Conditional Rendering**: Depending on the number of flights, it conditionally renders either `BookingRefDropdownContent` or a list of `BookingReferencesDropdownItem` components.
- **Props and Data Handling**: The component handles various props like `bookingReference`, `bookingRoutes`, and other UI-related flags and data.

## Logic

The component's logic revolves around managing and displaying booking references based on the given data:

- **State Initialization**: The `isExpanded` state is initialized to `false`, indicating that the dropdown is not expanded by default.
- **Store Computation**: Computes whether the current booking includes a hotel package by checking the store's state.
- **Event Handlers**: The `onClick` handler for the `AccordionButton` toggles the `isExpanded` state, controlling the visibility of the dropdown content.
- **Conditional Styling**: Applies dynamic class names based on whether the dropdown is expanded and if there are multiple flights, using the `classnames` library.
- **Data Transformation**: Transforms the `bookingRoutes` into a list of flight references using the `getFlightsReferences` utility.
- **Conditional Content Rendering**: Depending on the number of flights, it either displays a single or multiple booking references. For a single flight, individual dropdown items are shown for holiday and flight references, while for multiple flights, a more complex content structure is rendered using `BookingRefDropdownContent`.
- **MobX Integration**: The component is wrapped with `observer` from `mobx-react`, making it responsive to changes in MobX-managed state, ensuring the UI updates appropriately when underlying state changes.