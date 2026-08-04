## Imports

The `FilterPills` component utilizes several imports from both internal modules and third-party libraries:

- **React and MobX**: The component imports `FC` (Function Component) from `react` for typing and `observer` from `mobx-react` for reactive state management.
- **Classnames**: A utility to conditionally join classNames together, imported as `classNames`.
- **Custom Hooks and Stores**:
  - `useStore`: A custom hook for accessing MobX stores.
  - `SearchFilterStore` and `TradePortalSearchFilterStore`: Specific store modules for managing state related to search filters in different contexts.
- **Utility Functions**:
  - `getFilterOptionByCode`: A utility function to retrieve filter options based on a specific code.
- **Models and Enums**:
  - `IFilterOption`: Interface for filter option objects.
  - `FilterGroupCodes` and `RADIO_FILTER_CODES`: Enums to manage and check filter group codes.
- **Components**:
  - `Checkbox`: A reusable checkbox component for rendering individual filter options.
- **Styles**:
  - `styles`: Module-specific styles imported from `FilterPills.module.scss`.

## Structure

The `FilterPills` component is defined as a functional component using TypeScript. It takes a props object of type `IFilterPillsProps`, which includes:

- `code`: An enum value indicating the type of filter group (`RecentlyUsed` or `Recommended`).
- `getLabel`: A function to generate display labels for filter options.
- `storeInstance`: An instance of either `SearchFilterStore` or `TradePortalSearchFilterStore`, depending on the context where the component is used.

The component structure includes:

- **State and Store Interaction**:
  - Utilizes `useStore` to bind the component to the necessary MobX store actions and states.
- **Rendering Logic**:
  - Maps over content retrieved from `getPreparedGroupContent` based on the provided `code`.
  - Conditionally processes filter options based on the `code` and checks if options are disabled.
  - Returns `Checkbox` components for each active filter option.

## Logic

The core functionality of the `FilterPills` component revolves around handling user interactions and rendering UI elements based on the state:

- **Filter Option Handling**:
  - `handleChange`: A function that handles changes to the checkbox state. It checks if the filter option belongs to a radio group and if it's currently selected, in which case it clears the group. Otherwise, it triggers an update via `onChange`.
- **Conditional Rendering and Processing**:
  - Depending on the `code`, filter options are either fetched directly from the backend (`Recommended`) or filtered from existing filters (`RecentlyUsed`) using `getFilterOptionByCode`.
- **UI Feedback**:
  - Disables the checkbox if the option is not available or applicable, using the `isOptionDisabled` method.
  - Applies specific styling classes based on the state of the checkbox, such as disabled or checked states.
- **Tracking**:
  - Uses `trackSearchFiltersUpdate` from the store to track changes in filter selections, which is crucial for analytics and state management across the application.

This component is wrapped with `observer` from MobX, making it reactive to changes in the state of the stores it interacts with, ensuring the UI updates efficiently in response to state changes.