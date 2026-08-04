## Imports

The `CalloutPrice` component uses several imports categorized as follows:

- **External Libraries:**
  - `classnames`: A utility to conditionally join class names together.
  
- **Custom Hooks:**
  - `useStore`: A custom hook for accessing the Redux store state, specifically used here to retrieve the `marketStore` from `IHolidaysStores`.
  
- **Components and Models:**
  - `TrailingZeroDisplay`: An enumeration from `code/currency` used to specify how trailing zeros in currency should be displayed.
  - `IHolidaysStores`: Interface representing the shape of the holidays-related part of the store.
  - `ISitecoreField`: Interface from `models/sitecore/generic` defining the structure of a Sitecore field.
  - `Callout` and `ICalloutProps`: A component and its associated props interface for displaying a callout UI element.
  - `RichTextWithLinks`: A component for rendering rich text that might contain links.
  - `IconInfoCircle`: A component that renders an information circle icon.
  
- **Styles:**
  - `styles`: Specific module CSS for the `CalloutPrice` component, imported from `./CalloutPrice.module.scss`.

## Structure

The `CalloutPrice` component is defined as a functional component in React and utilizes TypeScript for type safety. It extends some properties from the `ICalloutProps` while omitting 'content' and 'isShownOnHover' properties through TypeScript's `Omit` utility. The component accepts the following props:

- `price`: A numeric value representing the price.
- `className`: An optional string for additional CSS class names.
- `priceTooltipContent`: An optional `ISitecoreField<string>` that holds content for a tooltip.
- `tooltipDataTid`: An optional string for a data attribute, defaulted to 'price-tooltip'.

These props are used to control the display and behavior of the `CalloutPrice` component.

## Logic

1. **Store Hook Usage:**
   - The `useStore` hook is used to extract the `formatMoney` function from the `marketStore`. This function is used to format the price according to specific rules.

2. **Price Formatting:**
   - The `price` prop is formatted using `formatMoney` with the configuration to strip trailing zeros if the price is an integer and to limit the display to zero fractional digits.

3. **Conditional Rendering:**
   - The component conditionally renders a `Callout` component if `priceTooltipContent` is provided. This `Callout` includes:
     - `RichTextWithLinks` to render the content of the tooltip.
     - An icon (`IconInfoCircle`) to indicate more information is available.
     - The tooltip is set to show on hover by default.
  
4. **Styling:**
   - The `classnames` utility is used to dynamically assign classes to elements based on the `className` prop and predefined styles from `styles`.

5. **Accessibility and Testing:**
   - Data attributes (`data-tid`) are used for targeting the components during testing.

By combining these elements, the `CalloutPrice` component provides a flexible way to display price information with an optional tooltip in a styled and accessible manner.