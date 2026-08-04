## Imports

The `HotelBasket` component makes use of several imports:

- **React and Hooks:** 
  - `FunctionComponent` from `react` is used for typing the functional component.
  - `useStore` custom hook is imported for accessing the Redux store state.

- **Models and Enums:**
  - `IAmendHotelOffer` interface from `models/data/bookingAmendment/AmendHotel` is used to type the `amendOffer` prop.
  - `SitecoreDictionary` enum from `models/enum/SitecoreDictionary` provides access to dictionary keys for site-specific text.

- **Components:**
  - Various components such as `BoardDetails`, `DatesDetails`, `FlightDetails`, `HotelDetails`, `LuggageDetails`, `RatingsDetails`, `RoomDetails`, and `TransferDetails` are imported. These are used to display specific details related to the hotel booking.

- **Utils:**
  - `getHotelChangeInfo` from `frontend/components/renderings/AmendHotel/AmendHotel.utils` is a utility function that processes booking and amendment data.

- **Styles:**
  - `styles` from `./HotelBasket.module.scss` for applying CSS modules styling to the component.

## Structure

The `HotelBasket` component is structured as follows:

- **Props:** 
  - `amendOffer`: Optional. Contains information about the amended hotel offer.
  - `dataTid`: Optional. A string used for testing to identify the component.
  - `unchangedLabel`: Optional. A label displayed when no new hotel has been selected.

- **Component Function:**
  - Uses the `useStore` hook to extract `booking` and `getPhrase` from the store.
  - Uses `getHotelChangeInfo` to derive details from the booking and amendment offer.
  - Conditionally renders child components based on whether a new hotel has been selected.

- **Rendered Child Components:**
  - `HotelDetails`, `RatingsDetails`, `DatesDetails`, `RoomDetails`, `BoardDetails`, `TransferDetails` are always rendered.
  - `FlightDetails`, `LuggageDetails`, and an additional `DatesDetails` are conditionally rendered if a new hotel has been selected.

## Logic

The component's logic is primarily concerned with the conditional rendering based on the `amendOffer` and the state of the booking:

- **Initial Check:**
  - If no `booking` is present in the store, the component returns `null`, effectively rendering nothing.

- **Data Extraction:**
  - The `getHotelChangeInfo` function is called with the current booking and amend offer, extracting necessary details like start and end dates, room type, board type, hotel details, and whether a new hotel has been selected.

- **Conditional Rendering:**
  - The `hasSelectedNewHotel` boolean determines which set of details to display:
    - If `true`, additional details related to the new selection are shown, such as `FlightDetails` and a different setup for `DatesDetails`.
    - A section for `LuggageDetails` and a protective ATOL label is also shown if a new hotel has been selected.

- **Styling and Data Attributes:**
  - Each child component is passed a `className` for styling and a `dataTid` for test identification, constructed dynamically based on the component's base `dataTid`.

This structure and logic ensure that the component can dynamically display the correct information based on whether the hotel booking has been amended and what changes have been made.