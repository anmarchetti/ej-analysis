## Imports

The `AmendPaymentSummary` component imports several modules and components:

- **React and MobX**: Uses `FC` from `react` for typing the functional component and `observer` from `mobx-react` for making the component reactive to state changes from MobX stores.
- **Hooks and Utilities**:
  - `useStore` custom hook to access MobX stores.
  - `isTradeStore` utility function to check if the current store is related to the trade portal.
- **Type Definitions**:
  - `TStores` which likely defines the types for the stores used in the application.
  - `ISitecoreComponent` and `IPaymentPageFields` for typing the props according to the Sitecore integration.
- **Components**:
  - `AmendPaymentTotalBlock`, `OverlaySpinner`, `PriceBreakdown`, `AmendmentViewBookingCost`, and `ComponentWrapper` are imported from their respective paths, indicating these are reusable UI components.
  - `AmendPaymentSummaryDetailsWrapper` is a component specific to this module, indicating a structured approach to handling the amendment summary.
- **Styles**:
  - `styles` from `./AmendPaymentSummary.module.scss` for scoped CSS modules.

## Structure

The `AmendPaymentSummary` component is structured as follows:

- **Props**: The component accepts `TAmendPaymentSummaryProps` which extends `ISitecoreComponent` with `IPaymentPageFields` indicating it uses specific fields from a Sitecore component.
- **Store Data Extraction**: Inside the component, `useStore` is used to extract data from various stores:
  - `amountToPay`, `newSeatsSelection`, `isPaying`, `getPhrase`, `currency`, and conditionally `redirectToTradePortalFindBookingPage` depending on whether it's in a trade store context.
- **Redirect Logic**: There is a conditional redirect if the `redirectToTradePortalFindBookingPage` function is available and `newSeatsSelection` is not present.
- **Rendering Logic**:
  - If `fields` is not present, the component returns `null`.
  - Constructs a `priceBreakdown` array with data from the `fields`.
- **JSX Structure**:
  - The component is wrapped in a `ComponentWrapper`.
  - Divided into two main columns (`leftColumn` and `rightColumn`):
    - `leftColumn` contains the `AmendPaymentSummaryDetailsWrapper` and a summary section with `AmendPaymentTotalBlock` and `AmendmentViewBookingCost`.
    - `rightColumn` contains the `PriceBreakdown` component.
  - An `OverlaySpinner` is conditionally rendered based on `isPaying`.

## Logic

- **Conditional Redirect**: If the component is used within a trade portal and no new seat selection has been made, it triggers a redirect.
- **Null Check**: The component immediately returns `null` if `fields` prop is undefined, preventing any further rendering or logic execution.
- **Data Mapping for Price Breakdown**: Constructs an array `priceBreakdown` using data from `fields` which is passed to the `PriceBreakdown` component.
- **Conditional Rendering**: An `OverlaySpinner` is displayed when the `isPaying` flag is true, indicating a loading state during payment processing.
- **Localization**: Utilizes `getPhrase` function to retrieve localized strings for the spinner, demonstrating integration with a localization or dictionary management system, likely managed by Sitecore or a similar CMS.

This component is designed to handle user interactions and state management related to payment amendments in a trade portal scenario, with clear separation of concerns and modular design for maintainability and scalability.