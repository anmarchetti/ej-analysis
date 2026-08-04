### Imports

The script starts by importing various constants, types, hooks, components, and utilities from different modules. These include:

- Constants like `NEGATIVE_INDEX` and `TWO` from `code/commonNumbers`.
- Enums like `Tokens` from `code/tokens`.
- Custom hooks such as `useStore` from `frontend/hooks/useStore`.
- Store check function `isHolidayStore` from `frontend/store/holidays`.
- Types like `TStores` from `frontend/store/IStores`.
- Utility functions such as `getTotalPaidAmount`, `Tokenizer`, and `getTotalBookingRefund` from `frontend/utils`.
- Data models/interfaces like `IBookingRefund`, `IPaymentInfo`, and `ICancellationSummaryResponse` from `models/data`.
- Enums from `models/enum` such as `CreditType` and `GuestType`.
- Dictionary for sitecore from `models/enum/SitecoreDictionary`.
- Component-specific types like `IPriceBreakdownItem` from `frontend/components`.
- Local component types and styles from the same directory.

### Structure

The code defines several enums and types to manage the logic for handling refunds, particularly focusing on the steps involved in processing a refund and the various scenarios that can occur during the refund process:

- **Enums**:
  - `PriceBreakdownKeys` to identify different parts of the price breakdown.
  - `RefundStep` to define steps in the refund process.
  - `RefundPopups` to handle different popup messages based on the refund conditions.

- **Types**:
  - `TRefundStepState` to manage the state of each refund step.
  - `IPriceBreakdownItemWithFlag` extends `IPriceBreakdownItem` to optionally show zero amounts.

- **Functions**:
  - `generateInitialStateFromSteps` initializes the state for refund steps.
  - `filterPriceBreakdownItems` filters and processes price breakdown items based on certain conditions.
  - `getPriceBreakdownOldLogic` calculates the price breakdown using an older logic.
  - `usePriceBreakdown` is a custom hook that encapsulates the logic for generating the price breakdown based on the current state and selected options.
  - `getRefundPopupContentTrade` and `getRefundPopupContent` determine the type of popup to display based on various conditions.
  - `getRefundContentFlightAndHotel` specifically handles refund scenarios for flight plus hotel packages.

### Logic

The core of the script revolves around handling the logic for calculating refunds and displaying appropriate information based on the booking details, cancellation policies, and user selections:

- **Refund Calculation**:
  - Based on the type of booking (e.g., holiday, trade), different calculations are performed to determine the amount refundable, including handling of deposits, fees, and one-time use credits.
  - The refund calculation considers various factors such as whether the booking is part of a trade portal, the type of guest, and specific conditions like holidays or special cancellation rules.

- **State Management**:
  - The state for each step of the refund process is managed using a record structure, which tracks whether each step is checked, disabled, or opened.

- **Conditional Rendering**:
  - Different components (like popups) are rendered based on the state of the booking and the results of the refund calculation logic.
  - The script handles a range of scenarios to determine the appropriate messages or actions to display, including checks for payment amounts, days before departure, and specific rules applied to the booking.

This structured approach allows the code to handle a complex set of conditions and rules, ensuring that the user is presented with accurate and relevant information throughout the refund process.