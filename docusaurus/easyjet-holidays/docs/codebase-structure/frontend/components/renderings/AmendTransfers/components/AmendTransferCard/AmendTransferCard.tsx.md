## Imports

The `AmendTransferCard` component imports various dependencies to function properly:

- **React and classNames**: Basic React import and a utility for conditionally joining class names.
- **Custom Types and Enums**: Imports like `CurrencyCode`, `SignDisplay`, `CalloutOrientation`, and `CalloutPosition` provide type safety and predefined constants.
- **Utility Functions and Hooks**: Functions like `getAmendmentRoundedPrice` and `getPricePostfix` from `amendBooking.utils`, and the `useStore` hook for accessing the Redux store state.
- **Components**: Reusable UI components such as `BlockSelected`, `Button`, `Callout`, `AmendErrataMessages`, and `TransferDuration` are imported to build the component structure.
- **Sitecore and Model Imports**: Enums from `SitecoreDictionary` for text keys and `ITransfer` interface for type definition of transfer data.
- **Styling**: SCSS module for CSS styling specific to this component.

## Structure

The `AmendTransferCard` component is structured as follows:

- **Props**: The component accepts a variety of props for configuration, such as `currency`, `transfer`, `amendCharge`, and flags like `isSelected` and `isAmendAppearance`.
- **Main Container**: The top-level `div` uses conditional class names and contains all other sub-components and elements.
- **Transfer Information**: Displays the transfer's name, content, and an optional icon. It also conditionally shows the transfer duration if available.
- **Price and Selection Area**: Depending on the `isPayment` prop, it either shows a price block or a selection button. The price block can optionally include a tooltip for additional information.
- **Errata Messages**: Conditionally rendered based on the presence of `errataMessages`.
- **Styling**: Uses both global class names and scoped module classes for styling.

## Logic

The component's logic is encapsulated in several key areas:

- **Store Hooks**: Uses `useStore` to retrieve methods `getPhrase` for text translations and `formatMoney` for currency formatting.
- **Conditional Rendering**: Several parts of the component, such as the price block and errata messages, are conditionally rendered based on the props.
- **Price Calculation**: The `amendCharge` is calculated using `getAmendmentRoundedPrice`, which potentially adjusts based on the `revertPrice` or `currentPrice`.
- **Event Handling**: The `onSelect` callback is triggered when the selection button is clicked, which is only rendered if `isSelected` is false.
- **Dynamic Class Names**: Uses `classNames` to dynamically apply CSS classes based on the component's state and props, enhancing the flexibility of styling based on conditions like `isSelected` or `isAmendAppearance`.

This structure and logic ensure that the `AmendTransferCard` component is both flexible and robust, suitable for displaying transfer options in a dynamic and interactive interface.