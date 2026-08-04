## Imports

The `AmendFlightCard` component relies on several imports which can be categorized into React-related, utility functions, hooks, models, components, icons, and styling:

- **React-related**:
  - `React`: Base React package for building React components.
  - `classNames`: A utility to conditionally join classNames together.

- **Utility Functions**:
  - `getAmendmentRoundedPrice`: A utility function to calculate the rounded price of an amendment.

- **Hooks**:
  - `useStore`: Custom hook for accessing the Redux store.

- **Models**:
  - `CurrencyCode`: Enum for currency codes.
  - `IRoute`: Interface representing route data.
  - `SitecoreDictionary`: Enum for Sitecore dictionary keys.

- **Components**:
  - `BlockSelected`: Component to indicate a block is selected.
  - `Card`: Generic card component.
  - `ErrorMessage`: Component to display error messages.
  - `FlightsDetails`: Component to display details of flights.
  - `AmendErrataMessages`: Component to display errata messages specific to flight amendments.
  - `AmendFlightCardActions`: Component to handle actions within the flight card.

- **Icons**:
  - `SvgWarningFilled`: Icon component for displaying a warning symbol.

- **Styling**:
  - `styles`: Module-specific styles imported from `AmendFlightCard.module.scss`.

## Structure

The `AmendFlightCard` is a functional React component utilizing `React.forwardRef` to provide a `ref` to its DOM element. The component accepts a variety of props defined in the `IAmendFlightCardProps` interface:

- **Props**:
  - `currency`: The currency code.
  - `onClickSelect`: Function to handle click events.
  - `routes`: Array of route data.
  - `cardClassName`: Optional className for styling.
  - `csMask`: Optional boolean for conditional styling.
  - `dataTid`: Optional data attribute for testing.
  - `errataFlightInfo`: Optional array of strings containing errata information.
  - `feeLabel`: Optional label for fees.
  - `isSelected`: Boolean indicating if the item is selected.
  - `notAvailable`: Boolean indicating if the flight option is available.
  - `priceDifference`: Optional number indicating the price difference.
  - `priceTooltipText`: Optional JSX element for displaying tooltip text.

The component structure includes nested conditional rendering to display different UI elements based on the props, such as error messages, selected blocks, and flight details.

## Logic

The logic within `AmendFlightCard` revolves around several key functionalities:

- **Store Hook Usage**:
  - `useStore` is used to access phrases from the store and to check if errata messages should be enabled.

- **Conditional Rendering**:
  - Based on the `notAvailable` prop, either an `ErrorMessage` or action components (`BlockSelected` or `AmendFlightCardActions`) are rendered.
  - `AmendErrataMessages` is conditionally rendered if `isErrataEnabled` is true and `errataFlightInfo` has content.

- **Data Handling**:
  - `priceDifference` is calculated using the `getAmendmentRoundedPrice` function, ensuring it displays correctly rounded values.

- **Key Generation**:
  - `expandMessagedUniqKey` is generated using the IDs of the first two routes, ensuring a unique key for expanding errata messages.

This component is designed to be robust, handling various states and conditions to display the appropriate UI elements based on the flight data and store settings.