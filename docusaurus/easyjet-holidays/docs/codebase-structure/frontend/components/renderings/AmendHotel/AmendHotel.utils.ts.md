### Imports

The code imports several interfaces from different modules within the `models/data` directory. These interfaces represent various aspects of a booking system, including hotel offers, booking information, and specific travel-related data such as hotels, routes, and transfers. Here's a breakdown of each import:

- `IAmendHotelOffer`: Interface representing an amendment to a hotel offer.
- `IBookingInfo`, `IBookingPackage`: Interfaces representing general booking information and the booking package details.
- `IBoardType`, `IHotel`, `IRoomType`: Interfaces representing details about the hotel, such as board type and room type.
- `IOffer`: Interface representing an offer in a booking system.
- `IRoute`: Interface for route information.
- `ITransfer`: Interface for transfer information.

### Structure

The code consists of two main functions:

1. **getHotelOffer**
   - **Parameters**:
     - `offer`: An object conforming to the `IAmendHotelOffer` interface.
     - `booking`: An object conforming to the `IBookingInfo` interface.
   - **Returns**: An object conforming to the `IOffer` interface or `null` if certain conditions are not met.

2. **getHotelChangeInfo**
   - **Parameters**:
     - `booking`: An object conforming to the `IBookingInfo` interface.
     - `amendOffer`: An optional object conforming to the `IAmendHotelOffer` interface.
   - **Returns**: An object containing detailed information about the hotel change, including board type, dates, hotel details, location, room type, routes, and transfer data.

### Logic

#### `getHotelOffer` Function

This function is designed to construct and return an offer based on the amendment charges and other details provided:

- **Early Exit Conditions**:
  - Returns `null` if `fullAmendmentCharges` from `offer.amendmentChargesInfo` is `undefined`.
  - Returns `null` if `transport` from `booking.package` is not present.
  - Returns `null` if `startDate` from `booking.package.accom` is not present.
  - Returns `null` if `id` from `offer.accom` is not present.

- **Offer Construction**:
  - Constructs an `IOffer` object using both `offer` and `booking` details.
  - Overrides and sets specific fields such as `altBoards`, `hasDistressedFlights`, `touristTax`, and others to predefined values or calculations.
  - Excludes `taxesAndFees` by setting it to `undefined`.

#### `getHotelChangeInfo` Function

This function aggregates information about a potential hotel change, considering both current booking data and any amendments:

- **Data Gathering**:
  - Determines the `transfer` information by preferring `amendOffer.transfers` over `booking.transfers`.
  - Extracts `startDate` and `endDate` directly from `bookingPackage.accom`.
  - Chooses room and board types based on the presence of `amendOffer`.
  - Decides the `hotel` and `location` based on whether an amendment offer is provided and valid.
  - Directly uses `routes` from `bookingPackage.transport`.

- **Return Structure**:
  - Returns an object containing all the necessary details for understanding the changes or selections related to the hotel in the context of the booking system.
  - Indicates whether a new hotel has been selected (`hasSelectedNewHotel`) based on the presence of an amendment offer.

This technical documentation outlines the structure and logic embedded in the JavaScript code, providing clarity on how hotel offers and changes are handled within the system.