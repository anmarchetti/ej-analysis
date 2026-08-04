## Imports

The `AmendHotelDetails` component imports several resources and dependencies:

- **React and Libraries**:
  - `FunctionComponent` from `react` for defining the component type.
  - `classNames` from `classnames` for conditionally joining class names together.

- **Hooks**:
  - `useStore` from `frontend/hooks/useStore` for accessing the Redux store state.

- **Types and Interfaces**:
  - `IHolidaysStores` from `frontend/store/holidays` to type the store state specific to holidays.
  - `IPaymentPageFields` from `frontend/components/renderings/AmendPayment/interfaces` for typing the fields prop specific to payment page components.

- **Utility Functions**:
  - `getAccommodationGuestsCount` from `frontend/utils/accommodation.utils` to compute the number of guests.
  - `getHotelChangeInfo` from `frontend/components/renderings/AmendHotel/AmendHotel.utils` to derive new hotel information based on the booking and selected offer.

- **Components**:
  - `DatesDetails`, `LuggageDetails`, `HolidaySummaryPlainOptions`, `HolidaySummaryRoomAndBoard`, and `HolidaySummaryTransfer` from various paths within `frontend/components/common/` for displaying specific parts of the hotel details.

- **Styles**:
  - `styles` from `./AmendHotelDetails.module.scss` for component-specific styling.

## Structure

The `AmendHotelDetails` component is structured as follows:

- **Props**:
  - `IAmendHotelDetailsProps`: An interface for the component props, which includes:
    - `fields`: An object of type `IPaymentPageFields` containing fields related to the payment page.

- **Component Definition**:
  - `AmendHotelDetails` is a functional component that uses destructuring to extract `fields` from its props.

- **State and Store**:
  - Utilizes the `useStore` hook to extract `newlySelectedHotelOffer` and `booking` from the Redux store.

- **Conditional Rendering**:
  - If either `booking` or `newlySelectedHotelOffer` is not available, the component returns `null`.

- **Data Processing**:
  - Extracts and processes hotel change information using `getHotelChangeInfo`.

- **Render**:
  - The main JSX structure includes div elements organized into rows, each containing specific components like `HolidaySummaryRoomAndBoard`, `LuggageDetails`, `HolidaySummaryTransfer`, and `HolidaySummaryPlainOptions`.

## Logic

- **Data Extraction**:
  - The component begins by extracting necessary data from the store regarding the current booking and the newly selected hotel offer.

- **Data Validation**:
  - Checks if essential data (`booking` and `newlySelectedHotelOffer`) is present. If not, the component does not render further.

- **Information Derivation**:
  - Uses `getHotelChangeInfo` to derive dates, transfer details, and hotel metadata from the booking and hotel offer.

- **Dynamic Styling**:
  - Uses `classNames` to conditionally apply styles to the `extrasRow`.

- **Nested Components**:
  - Components like `HolidaySummaryRoomAndBoard` and `LuggageDetails` are nested within the structure, and they receive specific props related to the booking details and UI identifiers (`dataTid`).

- **Utility Usage**:
  - Utilizes `getAccommodationGuestsCount` to determine the number of guests for the `HolidaySummaryPlainOptions` component.

This technical documentation outlines the key aspects of the `AmendHotelDetails` component, focusing on its imports, structure, and the logic it implements to render details about an amended hotel booking.