## Imports

The `BookingCardInfo` component uses several imports from various libraries and local modules:

- **React and Libraries**:
  - `FC` from `react`: Importing the Functional Component type from React for type-checking.
  - `classNames` from `classnames`: Utility function to conditionally join class names together.
  - `observer` from `mobx-react`: Enhancer that applies the observer pattern to React components to automatically re-render when observable data changes.

- **Hooks and Stores**:
  - `useStore` from `frontend/hooks/useStore`: Custom hook for accessing MobX stores.
  - `IHolidaysStores` from `frontend/store/holidays`: Interface representing the structure of the holiday-related stores.

- **Utilities**:
  - `goPayRemainingBalance` from `frontend/utils/payment.utils`: Function to handle the logic for paying the remaining balance of a booking.

- **Models**:
  - `IBookingInfo` from `models/data/IBookingInfo`: Interface representing the structure of booking information.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary`: Enum containing key-value pairs for various string literals used in the application.

- **Components**:
  - Several components are imported for displaying different parts of the booking card such as `BookingCanceledStatusInfo`, `BookingPriceBox`, `RemainingBalanceReminder`, and `Button`.

- **Utils and Styles**:
  - `usePreparedBookingInfoData` from `./BookingCardInfo.utils`: Hook to prepare data related to the booking info display logic.
  - `styles` from `./BookingCardInfo.module.scss`: Module CSS for styling the component.

## Structure

The `BookingCardInfo` component is structured as follows:

- **Props**:
  - `IBookingCardInfoProps`: Interface for the component props which includes `booking` (data about the booking) and `isUpcoming` (boolean indicating if the booking is upcoming).

- **Component Definition**:
  - `BookingCardInfo`: A functional component that utilizes destructured props and hooks to manage state and side effects.

- **Render Logic**:
  - The component conditionally renders various sub-components based on the state derived from hooks and props:
    - `BookingCanceledStatusInfo`: Displayed if the booking is canceled.
    - `RemainingBalanceReminder`: Shown if a payment reminder is needed.
    - `BookingPriceBox`: Displayed if no payment reminder is visible.
    - Buttons for actions like check-in, pay remaining balance, and view booking, conditionally displayed based on various conditions.

## Logic

- **Store Hooks**:
  - `useStore`: This hook is used to extract necessary data and functions from the MobX stores such as user data, phrases for localization, base path for URLs, visibility of payment reminders, and booking display settings.

- **Data Preparation**:
  - `usePreparedBookingInfoData`: Processes the booking data to determine if the booking is canceled, if check-in is available, and the URL for the check-in.

- **Conditional Rendering**:
  - The component makes decisions on what to render based on several conditions:
    - Whether the booking is canceled.
    - Whether a reminder for payment is necessary.
    - Whether the check-in button should be displayed based on the booking being upcoming and other conditions.

- **Event Handlers**:
  - Handlers for actions like paying the remaining balance and viewing the booking details are implemented. These utilize utility functions and data from the stores to perform their actions.

This component efficiently integrates user interface, state management, and actions, making it a functional part of the application dealing with bookings.