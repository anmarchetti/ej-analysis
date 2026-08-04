## Imports

The `FeesPopup` component utilizes a variety of imports from both internal modules and external libraries:

- **React and Sitecore JSS**: The base React library is imported along with the `Text` component from Sitecore's JavaScript Services (JSS) for Next.js, which is used for rendering text fields managed in Sitecore.
  
- **Utility and Model Imports**:
  - Various utility functions and constants like `ICurrencyFormatOptions` for formatting currency options, and `DATE_FORMATS` for managing date formats.
  - Hooks such as `useStore` to access the application's state management.
  - Data models like `IOffer`, `IPaymentInfo`, and `IPriceBreakdownItem` to type-check the data passed into components.

- **Component and Style Imports**:
  - The `Popup` component from a common frontend components directory for displaying modal content.
  - SCSS module for styling specific to the `FeesPopup` component.

- **Utility Function**:
  - `getTouristTaxInfo` from `FeesPopup.utils`, a utility specific to this component for calculating tourist tax information.

## Structure

The `FeesPopup` component is structured as follows:

- **Props**: The component accepts several props including `fields` containing various Sitecore fields, `onClose` callback function, payment and pricing breakdown information, and optional extras. These props help configure the popup based on the booking and payment context.

- **State and Store Usage**:
  - Uses the `useStore` hook to fetch necessary state from the Redux store, such as formatting functions, selected offers, and flags indicating whether certain taxes are enabled or if the context is post-booking.

- **Conditional Rendering**:
  - Early return of `null` if essential props like `paymentInfo` and `fields` are not provided, ensuring that the component does not proceed to render without necessary data.

- **Dynamic Content Rendering**:
  - Various checks and conditional renderings based on the data provided, such as displaying different pricing information and taxes applicable.

- **Styling**:
  - Uses both global and module-specific SCSS for styling individual elements within the popup.

## Logic

The component's logic primarily revolves around formatting and presenting various fees and taxes associated with a booking:

- **Currency Formatting**:
  - Utilizes `formatMoney` from the store, configured with options like currency type and how to display trailing zeros, to format monetary values for display.

- **Price Breakdown**:
  - Extracts specific pricing details from `tradeAgentPriceBreakdown` and `priceBreakdown` arrays using `.find()` based on predefined codes.

- **Tax Information**:
  - Calculates and optionally displays tourist tax information based on the selected offer and configuration flags from the store.

- **Date Formatting**:
  - Uses `formatDateL10n` for displaying formatted dates such as deposit and balance due dates.

- **Component Composition**:
  - Leverages the `Popup` component for the modal structure, passing in props like title and close handler.
  - Inside the popup, various pricing and tax information are listed, each conditionally rendered based on the presence of data.

This component is a typical example of a complex React component that integrates tightly with both the application state and backend-managed content, illustrating advanced patterns typical in commercial web applications, especially those using Sitecore as a CMS.