### Imports

The `AltBoardItem` component imports several modules and components to function properly:

- **React and FunctionComponent**: Used for defining the component using React's functional component pattern.
- **classNames**: A utility function for conditionally joining class names together.
- **observer**: From `mobx-react`, it makes the component reactive to observable changes in MobX store.
- **CurrencyCode and SignDisplay**: Enums for handling currency formats.
- **useStore**: A custom hook for accessing MobX stores.
- **TStores**: Type definition for the app's MobX stores.
- **isTradeStore**: A utility function to determine if the current store is a trade store.
- **getImageUrl**: A utility function to resolve image URLs.
- **IBoardType**: TypeScript interface for board type objects.
- **SitecoreDictionary**: An enum containing keys for Sitecore dictionary entries.
- **BlockSelected, Button, DiscountedBoardPercentagePill, FreeBoardUpgradePill, PriceLabel**: Reusable React components for various UI elements.
- **styles**: Object containing CSS modules for styling the component.

### Structure

The `AltBoardItem` component is structured as follows:

- **Props**: The component accepts `IAltBoardItemProps` which includes properties like `board`, `isPricePPShown`, `isSelected`, `selectedBoardPricePP`, `currency`, and `onSelect`.
  
- **MobX Store Usage**: The component uses the `useStore` hook to extract `isPriceVisible`, `formatMoney`, and `getPhrase` from the MobX stores.

- **Rendering Logic**:
  - The component calculates the price by subtracting `selectedBoardPricePP` from `board.pricePP`.
  - It conditionally displays an icon, title, and various pills (like `FreeBoardUpgradePill` and `DiscountedBoardPercentagePill`) based on the board's properties.
  - It handles selected and unselected states differently, displaying either a `BlockSelected` component or a `Button` for selection.
  - The content is displayed using `dangerouslySetInnerHTML` for rendering HTML content safely.

- **CSS Styling**: Uses CSS modules imported as `styles` for applying styles, and uses the `classNames` utility to conditionally apply styles based on component state.

### Logic

- **Price Calculation**: The price is adjusted based on the `selectedBoardPricePP`, ensuring that the displayed price is relative to the selected board.
  
- **Conditional Rendering**:
  - The component checks if the board's `iconUrl` is present to display the icon.
  - Displays different UI elements based on whether the board is selected or not.
  - Shows price labels or selection prompts based on whether prices are visible and if the board is selected.

- **Event Handling**:
  - An `onClick` handler is passed to the `Button` component to handle board selection.
  
- **Accessibility and Testing**:
  - Uses `data-tid` attributes for easier targeting in tests.
  - Uses ARIA attributes (`data-item-selection`) to enhance accessibility and indicate state.

- **Reactivity**:
  - Wrapped with `observer` from MobX to ensure the component re-renders in response to relevant changes in the MobX state stores.

This documentation outlines the key aspects of the `AltBoardItem` component, focusing on its dependencies, structure, and logic, providing a clear overview for developers working with or extending this component.