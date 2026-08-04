### Imports

The `useBreadcrumbs` hook imports several modules and hooks from React and other local files:

- **React Hooks**: `useCallback`, `useMemo`, and `useState` are imported from 'react' for managing state and memoizing values and functions.
- **Local Imports**:
  - `Tokens` from 'code/tokens' for handling token replacements in strings.
  - `useStore` from 'frontend/hooks/useStore' is a custom hook for accessing the Redux store.
  - `TStores` from 'frontend/store/IStores' provides TypeScript interfaces for type checking the store.
  - `Tokenizer` from 'frontend/utils/tokenizer' for replacing tokens in strings dynamically.
  - Enums from 'models/enum' for structured constants like `BreadcrumbsPage`, `SitecoreDictionary`, and `SitePath`.
  
### Structure

The `useBreadcrumbs` hook is structured to provide breadcrumb navigation logic for a web application, particularly handling scenarios in a flight and hotel booking system. It defines two TypeScript interfaces, `IPopupData` and `IBreadItem`, to structure the breadcrumb and popup data:

- **IPopupData**: Contains labels and text content for popup dialogs.
- **IBreadItem**: Represents a single breadcrumb item, including properties for the link, title, optional popup data, and conditions for showing the popup.

The main function, `useBreadcrumbs`, accepts `activePage` as a parameter and returns an object of type `IUseBreadcrumbsResult` containing breadcrumb data and handlers:

- **State and Selectors**: Uses the `useStore` custom hook to derive state and functions from the global store.
- **Computed Values**: Uses `useMemo` to compute breadcrumb items based on the current application state and page.
- **Event Handlers**: `handleBreadcrumbClick`, `handlePopupClose`, and `handlePopupContinue` to manage breadcrumb interactions and popup dialogs.
- **State Management**: Uses `useState` to manage the state of the currently selected breadcrumb item for popup interactions.

### Logic

The hook encapsulates the logic required for managing breadcrumb navigation:

- **Dynamic Breadcrumb Generation**: Depending on whether the user is in a flight plus hotel funnel, it generates a different set of breadcrumb items using conditions checked during the memoization process.
- **Popup Data Creation**: Uses `createPopupData` function to dynamically create popup data for breadcrumbs that might require warnings or additional actions from the user.
- **Breadcrumb Selection**: Allows the user to select a breadcrumb, potentially triggering a popup if conditions such as having selected seats or extra luggage are met.
- **Navigation**: On continuing from a popup, the hook redirects the user to the appropriate page based on the selected breadcrumb's link.

This hook is essential for managing complex navigation flows in the booking process, ensuring that users are aware of any important information before navigating away from their current task.