## Imports

The `RefundSuccessPopup` component utilizes several imports from various libraries and local files:

- **React Essentials**: Imports `useEffect` and `useMemo` from the `react` package for managing side-effects and memoizing values respectively.
- **MobX**: Uses `observer` from `mobx-react` to make the component reactive to state changes in MobX stores.
- **Local Utilities and Components**:
  - `TrailingZeroDisplay` from `code/currency` for formatting currency display.
  - `Tokens` from `code/tokens` for handling dynamic text tokens.
  - `useStore` custom hook from `frontend/hooks/useStore` for accessing MobX stores.
  - `IHolidaysStores` interface from `frontend/store/holidays` for type definition of the stores.
  - `Tokenizer` utility from `frontend/utils/tokenizer` for replacing tokens in strings.
  - `ViewBookingTrackingEvents` from `frontend/utils/tracking/viewBooking.utils` and `getBookingPayload` from `frontend/utils/viewBooking.utils` for tracking and payload preparation.
  - `SitecoreDictionary` for localized string keys from `models/enum/SitecoreDictionary`.
  - `Button` and `Popup` components from `frontend/components/common` for UI elements.
  
## Structure

The `RefundSuccessPopup` is a functional React component decorated with the `observer` function from MobX, making it responsive to relevant observable changes in the state.

- **State and Actions Binding**: Utilizes the `useStore` hook to bind state and actions from various stores to local constants for easy access within the component.
- **Event Handlers**:
  - `onClose`: Closes the popup.
  - `onViewBookingClick`: Handles logic to view booking details and closes the popup.
  - `handleOnCloseClick`: Similar to `onClose` but also fires a tracking event.
- **Rendering Logic**:
  - `renderFooterButtons`: Returns JSX for the footer buttons in the popup.
  - `description`: A memoized value that constructs the popup's description based on the booking and refund details.
- **Effect Hook**: An `useEffect` hook that runs once on component mount to track the cancelled booking event.

## Logic

- **Popup Visibility**: The component renders `null` if `isPopupShown` is false, meaning the popup will not appear unless specified by the store state.
- **Dynamic Content Generation**:
  - The `description` uses `useMemo` for efficient re-rendering, only recalculating when `booking` or `creditRefund` changes. It constructs a message string based on whether cash or credit was refunded, using dynamic tokens replaced in the localized string fetched via `getPhrase`.
- **Event Tracking**: On component mount and during specific user interactions (`onViewBookingClick` and `handleOnCloseClick`), the component fires tracking events with relevant data.
- **User Interaction**:
  - The popup provides two buttons managed by `renderFooterButtons` allowing the user to either see the holiday credit or view the booking details, both of which will close the popup upon interaction.
- **Safety Measures**: Utilizes `dangerouslySetInnerHTML` for rendering HTML content, which is carefully constructed to avoid XSS vulnerabilities by controlling the input variables and sanitizing through the `formatMoney` function.