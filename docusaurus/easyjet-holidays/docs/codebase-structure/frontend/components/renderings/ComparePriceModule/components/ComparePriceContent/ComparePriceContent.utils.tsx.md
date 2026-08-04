### Imports

The code imports various React and application-specific dependencies:

- **React Hooks**: `useEffect` and `useState` from React for managing side effects and component state.
- **Utility and Helper Functions**: 
  - `cmsUrls` from `code/endpoints` for accessing CMS-related URLs.
  - `Tokens` from `code/tokens` for managing token replacements in strings.
  - `getDate` from `frontend/utils/date.utils` for date manipulation.
  - `Tokenizer` from `frontend/utils/tokenizer` for string tokenization.
- **Custom Hooks**:
  - `useStore` from `frontend/hooks/useStore` to access the application's state management.
- **Store Actions and Types**:
  - Various actions and types from `frontend/store` related to price comparison and calendar functionalities.
- **Models and Interfaces**:
  - Multiple interfaces from `models/data` and `models/sitecore/generic` for type definitions of offers, units, and Sitecore components.
  - Enums from `models/enum` for predefined constants used in the module.
- **Components**:
  - Various React components and utilities specific to the booking and price comparison features of the application.

### Structure

The code is structured around several key TypeScript interfaces and a main React hook:

- **Interfaces**:
  - `IComparePriceModuleFields`: Defines the structure for the fields expected from the Sitecore component specific to the compare price module.
  - `IComparePriceContentProps`: Extends a generic Sitecore component interface to include additional props specific to the compare price content.
  - `IPopupProps` and `ITabsProps`: Define props for popup and tabs components used within the module.
  - `IUseComparePriceContentData`: Defines the return type of the main hook, encapsulating all data needed by the consuming components.

- **Main Hook** `useComparePriceContent`:
  - Accepts props conforming to `IComparePriceContentProps`.
  - Utilizes custom hooks for accessing global state and dispatching actions.
  - Handles logic for determining active tabs, handling date changes, and managing the state of review popups.
  - Returns an object containing all necessary data and state handlers required by the frontend components to render and function properly.

### Logic

The primary logic is encapsulated within the `useComparePriceContent` hook:

- **Initialization and Cleanup**:
  - Sets the initial state based on the selected date and variant.
  - Cleans up by resetting state when the component unmounts.

- **Data Handling**:
  - Fetches necessary data from the store using `useStore`.
  - Computes derived state such as the active tab based on the variant and the cheapest price option.

- **Event Handlers**:
  - Handles changes to the active date and tab.
  - Implements the logic to apply a new offer based on the selected date and current state.

- **Conditional Rendering and State Management**:
  - Determines the tabs to display based on the variant.
  - Manages visibility and interactivity of elements such as the review popup based on the current state and selected options.

- **Utilities and Helpers**:
  - Uses utility functions to fetch and manipulate date and price data.
  - Utilizes tokenization for dynamic text replacement in UI labels.

This structured approach allows the hook to manage complex state and logic efficiently, providing a clean and maintainable interface to the components that rely on this data.