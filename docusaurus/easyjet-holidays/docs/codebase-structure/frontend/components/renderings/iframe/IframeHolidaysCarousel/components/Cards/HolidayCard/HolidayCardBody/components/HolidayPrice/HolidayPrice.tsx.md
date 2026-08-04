## Imports

The `HolidayPrice` component imports several modules and components to function properly:

- **React and Classnames**: Standard imports for a React component. `React` for component functionality and `classNames` for conditional class assignment.
- **Custom Hooks and Utilities**: 
  - `useStore` is a custom hook for accessing the Redux store.
  - Several utility functions from `offer.utils` and `touristTax.utils` are used to calculate prices, discounts, and tax-related fields.
- **Type Definitions**:
  - `ICurrencyFormatOptions` from `code/currency` for typing the currency formatting options.
  - `IOffer` from `models/data` to type the `offer` prop.
- **Components**:
  - `PriceLabel`, `Tooltip`, `TooltipTrigger`, `TooltipContent` from common frontend components for displaying prices and tooltips.
  - `TouristTaxPriceLabel` and `TouristTaxPriceTooltip` for specific handling and display of tourist tax information.
- **Styling**:
  - `styles` from `HolidayPrice.module.scss` for CSS module styling.

## Structure

The `HolidayPrice` component is structured as follows:

- **Props**: It takes a single prop `offer` of type `IOffer`, which contains various pricing and tax information about a holiday package.
- **State Management**: Uses the `useStore` hook to extract `tooltipSettings` and `formatMoney` functions from the Redux store.
- **Conditional Rendering**:
  - A tooltip is conditionally rendered if there is a `tooltipMessage`.
  - The price and discount information are conditionally rendered based on whether there are any discounts and whether the price per person (`pricePP`) is defined.
- **JSX Structure**:
  - The main block (`priceBlock`) contains sub-components and elements for displaying the pre-discount price, the final price, and tourist tax information.
  - Each price-related display uses the `PriceLabel` component with customized prefixes and dictionary labels.
  - Tourist tax information is wrapped within `TouristTaxPriceTooltip` and displayed using `TouristTaxPriceLabel`.

## Logic

The component's logic revolves around the calculation and display of pricing information:

- **Price Calculation**:
  - Determines whether to show price per person or total price using `isPricePPShown`.
  - Calculates total discounts with and without infants using `getTotalDiscount` and `getTotalDiscountPPExcludingInfants`.
  - Extracts tourist tax fields using `getTouristTaxFieldsFromOffer`.
- **Currency Formatting**:
  - Defines currency options based on the offer's currency code.
  - Uses the `formatMoney` function to format prices for display.
- **Tooltip Handling**:
  - Generates a tooltip message using `getPricePill`.
  - Conditionally renders a `Tooltip` component if there is a message to display.
- **Discount Display Logic**:
  - Checks if there is any discount available.
  - Selects appropriate dictionary labels for the price display based on whether there is a discount and if the price is per person.
- **Tourist Tax Information**:
  - Conditionally renders tourist tax information using `TouristTaxPriceTooltip` and `TouristTaxPriceLabel` based on the presence of tourist tax in the offer.

The component effectively handles various scenarios related to pricing and discounts, ensuring that the displayed information is accurate and appropriately formatted.