## Imports

The JavaScript module begins by importing various utilities, components, and types necessary for the component to function:

- `FC` from `react`: Importing the `FC` type (Functional Component) from React for typing our component.
- `CurrencyCode` from `'code/currency'`: Imports the `CurrencyCode` type which likely enumerates available currency codes.
- `Tokens` from `'code/tokens'`: Imports `Tokens`, possibly an enumeration or object containing token identifiers used in the application.
- `useStore` from `'frontend/hooks/useStore'`: A custom React hook for accessing the application's store (state management).
- `Tokenizer` from `'frontend/utils/tokenizer'`: A utility for replacing tokens in strings, probably used for localization or dynamic text content.
- `SitecoreDictionary` from `'models/enum/SitecoreDictionary'`: Enum for dictionary keys specific to Sitecore implementations.
- `SiteSettings` from `'models/enum/SiteSettings'`: Enum for site settings, potentially used for feature toggling or configuration checks.
- `PricePill` from `'frontend/components/common/Pills/PricePill/PricePill'`: A React component for displaying price-related information in a styled "pill" format.

## Structure

The file defines a single React functional component named `HotelDiscountPill` which accepts props of the type `IHotelDiscountPillProps`:

### `IHotelDiscountPillProps` Interface

This interface describes the props that the `HotelDiscountPill` component expects:

- `amount`: A number or undefined, representing the discount amount.
- `countryCode`: A string representing the country code.
- `currency`: A `CurrencyCode` or undefined, representing the currency of the amount.
- `className`: An optional string for CSS class names.
- `isSmall`: An optional boolean that specifies whether the pill should be displayed in a smaller format.
- `tooltipMessage`: An optional string for a tooltip message.

### Component Definition

`HotelDiscountPill` is a functional component utilizing destructuring to extract methods from the `useStore` hook and conditional rendering based on the component's props and store values.

## Logic

The component's logic primarily revolves around conditional rendering and data formatting:

1. **Store Hook Utilization**: The component uses the `useStore` custom hook to extract three methods:
   - `getPhrase`: Fetches a phrase from the layout store using a dictionary key.
   - `isPillVisible`: Determines visibility of the pill based on site settings and the country code.
   - `formatMoney`: Formats the amount of money according to specified options.

2. **Visibility Check**: Before rendering, the component checks if the `amount` prop is present and if the pill is meant to be visible for the given `countryCode` by calling `isPillVisible`.

3. **Conditional Rendering**: If the conditions are not met (no amount or the pill is not visible), the component returns `null`, effectively rendering nothing.

4. **Token Replacement and Formatting**: If rendering proceeds, the component uses `Tokenizer.replaceTokens` to replace placeholders in the localized text fetched by `getPhrase`. The `formatMoney` function is used to format the `amount` prop with the specified `currency` and no decimal places.

5. **Component Composition**: Finally, the formatted text is wrapped in a `PricePill` component, which is styled conditionally (red color, optional small size) and may include additional props like `className` and `tooltipMessage`.