### Imports

The `AlternativeFlightsFilters` component imports several modules and components to function properly:

- **React**: The base library for building the component.
- **observer**: A function from `mobx-react` used to make the component reactive to MobX state changes.
- **useStore**: A custom hook defined in `frontend/hooks/useStore` to access the MobX store.
- **DataStatus**: An enumeration from `models/enum/DataStatus` to manage data loading statuses.
- **AmendmentSort**: A component from `frontend/components/common/Amend/AmendmentSort/AmendmentSort` for handling sorting functionalities.
- **FiltersContainer**: A component from `frontend/components/common/SearchFilters/FiltersContainer` used for managing and displaying filters.

### Structure

The `AlternativeFlightsFilters` component is structured as follows:

- **Functional Component**: It is a React functional component utilizing hooks for state management.
- **useStore Hook**: This hook extracts data and functions from the MobX store relevant to the alternative flights and related functionalities such as price graph and price calendar.
- **JSX Structure**:
  - A main `div` with the class `alternative-flights__filters-bar` contains all the UI elements.
  - Inside this `div`, there is a conditional rendering of the `FiltersContainer` if there are any filters available.
  - The `AmendmentSort` component is rendered for sorting functionalities.

### Logic

The logic of the `AlternativeFlightsFilters` component revolves around managing and interacting with filters and sorting options for alternative flights:

- **Store Integration**: The component integrates with the MobX store using the `useStore` hook to manage state like active filters, selected filters, sorting options, and actions like selecting or removing filters.
- **Conditional Rendering**: The `FiltersContainer` is only rendered if there are filters available (`filters.length > 0`).
- **Filter Management**:
  - The `FiltersContainer` handles user interactions related to filter selection, filter removal, and applying filters.
  - It also handles the disabling of filter groups based on certain conditions provided by the `isFilterGroupDisabled` function.
  - When filters are changed, the component triggers clearing of related data in other components/stores, specifically the price graph and price calendar, to ensure data consistency.
- **Sorting Management**:
  - The `AmendmentSort` component allows the user to change the sorting of the displayed data based on predefined options.
  - It receives its configuration from the MobX store, including the current sorting option and the function to update it.

This component effectively serves as a user interface for managing filters and sorting options for alternative flights, ensuring a dynamic and responsive experience by reacting to state changes in the MobX store.