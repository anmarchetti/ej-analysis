## Imports

The `BalanceHistory` component imports several libraries and components to facilitate its functionality:

- **React Hooks and Utilities**: `useEffect`, `useMemo`, and `useState` from React are used for managing state and side effects.
- **Sitecore JSS**: `Text` from `@sitecore-jss/sitecore-jss-nextjs` is used for rendering text fields from Sitecore items.
- **MobX**: `observer` from `mobx-react` is used to make the component reactive to changes in MobX stores.
- **Custom Hooks and Components**:
  - `useMoreThenMobileViewport` is a custom hook for responsive design decisions.
  - `useStore` is a custom hook for accessing MobX stores.
  - `Link` and `Spinner` are custom reusable UI components.
- **Data Models and Enums**: Includes models like `IHolidaysStores`, `IBalanceHistoryFields`, `IBalanceHistoryItem`, and enums like `CurrencyCode`, `SitePath`.
- **Local Components**: 
  - `BalanceHistoryChip`, `BalanceHistoryItem`, and `BalanceHistoryItemDrawer` are components used within the `BalanceHistory` component for rendering specific parts of the UI.
- **Utility Functions**: Functions like `getCreditStatus`, `getOriginalVoucherCode`, and `getRedemptionBookingRef` are used for data manipulation and retrieval.
- **Styles**: SCSS module for styling the component.

## Structure

The `BalanceHistory` component is structured as follows:

- **Props**: The component accepts `IBalanceHistoryProps`, which extends `ISitecoreComponent` with additional properties like `activeCurrency`.
- **State Management**:
  - `selectedCreditItem`: State to keep track of the currently selected credit item.
- **MobX Store Usage**: Uses the `useStore` hook to extract data from various stores related to holiday credits, layout configurations, voucher redemptions, and market-specific settings.
- **Responsive Handling**: Uses `useMoreThenMobileViewport` to handle different layouts or functionalities based on the viewport size.
- **Sorting Logic**: Implements a memoized sorting mechanism for credit items based on their status and expiration date, influenced by the `orderedStatusKeys` array.
- **UI Components**:
  - Renders a title section which might include a link to redeem a voucher.
  - Displays a spinner when data is loading.
  - Shows a table of credit items, each represented by `BalanceHistoryItem`.
  - Conditionally renders a drawer (`BalanceHistoryItemDrawer`) for mobile viewports when an item is selected.

## Logic

- **Component Initialization**: On component mount, the `selectedCreditItem` is reset if the viewport changes (detected by `useMoreThenMobileViewport`).
- **Data Handling**:
  - Extracts and computes necessary data from the MobX store using `useStore`.
  - Filters and sorts the balance history based on currency and predefined status order.
- **Conditional Rendering**:
  - The component returns `null` if there are no items to display and the redeem voucher button is not supposed to show.
  - Handles the visibility of the redeem voucher link based on whether gift card redemption is enabled and if the active currency matches the market currency.
- **Event Handlers**:
  - `onCloseDrawer` and `onCreditItemClick` manage interactions with the credit items, particularly in mobile view where a drawer UI is used.
- **Recent Item Detection**: Uses utility functions to determine if a credit item is recent based on booking references and voucher codes.

This component is designed to be reactive and responsive, adapting its behavior and layout based on the data from the stores and the client's viewport.