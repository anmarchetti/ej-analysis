## Imports

The `HolidayCredit` component utilizes several imports to facilitate its functionality:

- **React Essentials**: `React`, `useEffect`, and `useState` for managing component state and lifecycle.
- **Sitecore JSS**: `Placeholder` from `@sitecore-jss/sitecore-jss-nextjs` for rendering dynamic content areas defined in Sitecore.
- **Styling and Utilities**:
  - `classNames` for conditionally joining classNames together.
  - `observer` from `mobx-react` to make the component reactive to MobX state changes.
- **Custom Hooks and Components**:
  - `useStore` custom hook for accessing MobX stores.
  - `OverlaySpinner` and `RefundSuccessPopup` for UI feedback elements.
  - `BalanceCard` a custom component for displaying credit balances.
- **Utility Functions**:
  - `getCreditTabs` function to calculate tabs based on market credits and balances.
- **Models and Enums**:
  - Various interfaces and enums such as `IHolidaysStores`, `IHolidayCreditFields`, `IMarketTab`, `PlaceholderNames`, and `CurrencyCode` to enforce type safety and code clarity.
- **Styles**:
  - SCSS module for component-specific styles.

## Structure

The `HolidayCredit` component is structured as follows:

- **Functional Component Definition**: `HolidayCredit` is defined as a React functional component using TypeScript for props type definition (`THolidayCreditProps`).
- **State Management**:
  - Local state is managed using `useState` for `activeWallet` and `availableTabs`.
  - External state (from MobX stores) is accessed via the `useStore` hook.
- **Effect Hooks**:
  - An `useEffect` for component initialization and cleanup.
  - Another `useEffect` to update tabs when `creditBalance` or `currency` changes.
- **Conditional Rendering**: Based on login status and whether certain data is available.
- **Dynamic Class and Style Management**: Using `classNames` and imported SCSS modules.
- **Sitecore Integration**: Utilizing `Placeholder` components to integrate with Sitecore's dynamic placeholders.

## Logic

The component encapsulates several key functionalities:

- **Initialization and Cleanup**:
  - On component mount, it initializes the holiday credit data.
  - On unmount, it performs cleanup by clearing recent refunds and resetting the latest redeemed voucher code.
- **Tabs Management**:
  - Computes which tabs to display based on the market credits and current credit balances.
  - Allows switching between different currency tabs within the credit balance UI.
- **Conditional UI Elements**:
  - Displays an `OverlaySpinner` when the user is not logged in.
  - Shows a `RefundSuccessPopup` when a refund has been successfully processed.
- **Dynamic Content Rendering**:
  - Uses Sitecore's `Placeholder` component to render dynamic content areas which can be configured in Sitecore, ensuring flexibility and scalability of the component within different market contexts.
- **User Interaction**:
  - Handles user interactions such as changing the active wallet tab which triggers UI updates.

This component is designed to be highly reusable and maintainable, adhering to modern React development practices with integration into Sitecore's content management capabilities.