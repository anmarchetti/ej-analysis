## Imports

The code begins by importing several modules and hooks from various locations:

- **React Essentials**: Imports `React`, `FC` (Function Component type from TypeScript), `useEffect`, and `useState` from the `react` package.
- **Custom Hooks**: Imports `useMoreThenMobileViewport` and `useMoreThenTabletViewport` from `frontend/hooks/useMediaQuery` to handle responsive design.
- **Store Hook**: Imports `useStore` from `frontend/hooks/useStore` for accessing the global state management.
- **Type Definitions**: Imports various TypeScript interfaces such as `IHolidaysStores`, `IBalanceHistoryFields`, `IBalanceHistoryItem`, and `TCreditTypeItem` from the `models/data/IBalanceHistory` to ensure type safety across the component.
- **Component and Constants**: Imports `BalanceOrderStatuses` from a nested component to handle status display, and other components for rendering different layouts based on the viewport size. Also imports `META_REASON` from constants for metadata handling.
- **Utility Functions**: Imports several utility functions like `getCreditStatus`, `getHistoryItemCurrency`, `getMetaDataValueByKey`, and `getRedemptionOrigin` from a utility file to process data.

## Structure

The component `BalanceHistoryItem` is defined as a functional component using TypeScript. It accepts props of type `TBalanceHistoryItemProps`, which includes several optional and required properties to control the behavior and display of the component.

### Props
- `creditItem`: Main data object for the component.
- `fields`: Additional configuration and fields necessary for rendering.
- `defaultCreditTypeContent`: Fallback content for credit types.
- `isDrawerExpanded`, `isInsideDrawer`, `isRecentCredit`: Boolean flags to control various UI aspects.
- `onItemClick`: Function to handle item click events.
- `withoutBorderTop`: Boolean to control the border rendering.

### State
- `isItemExpanded`: A state to manage the expansion state of the component, primarily used in mobile views to toggle more details.

### Effects
- An effect that resets `isItemExpanded` when the viewport changes beyond mobile size, ensuring that UI states are reset when resizing.

### Render Logic
- The component conditionally renders either `BalanceHistoryDesktopItem` or `BalanceHistoryMobileItem` based on the viewport size, passing along the necessary props to these components.

## Logic

### Responsive Handling
- Two custom hooks `useMoreThenMobileViewport` and `useMoreThenTabletViewport` are used to determine the current viewport size and render appropriate layouts.

### Expansion Logic
- Handles the expansion of the item details in a responsive manner. On larger screens, it toggles the expansion state, while on smaller screens, it triggers an optional click handler.

### Data Processing
- Extracts and computes necessary data from the `creditItem` and `fields` props to determine the status, currency, and other display-related data.
- Determines whether the item should be disabled based on its status (Expired or Used).
- Fetches and computes the display texts and images from the provided `fields` or from default content if necessary.

### Conditional Rendering
- Based on the viewport size, it decides which component (desktop or mobile) to render, passing all computed and necessary props to the chosen component. This includes passing flags like `isInsideDrawer` and `withoutBorderTop` to manage specific styling and behavior in different contexts.

This structure and logic ensure that `BalanceHistoryItem` is a responsive and versatile component suitable for displaying credit item details across different devices and conditions.