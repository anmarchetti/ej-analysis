## Imports

The code begins with several import statements which bring in utilities and type definitions necessary for the operation of the `getBookingData` function:

- `getRoute` from `'frontend/utils/route.utils'`: A utility function likely used to retrieve route information based on a specific offer.
- `getBookingRoute` from `'frontend/utils/viewBooking.utils'`: A utility function for obtaining routing information from a booking object.
- `IBookingInfo` from `'models/data/IBookingInfo'`: An interface representing the structure of booking information.
- `IOffer` from `'models/data/IOffer'`: An interface representing the structure of an offer related to the booking.
- `RouteDirection` from `'models/enum/RouteDirection'`: An enumeration that specifies route direction, such as Outbound or Inbound.

## Structure

The `getBookingData` function is structured as follows:

- **Parameters**:
  - `amendDatesOffer`: Nullable of type `IOffer`, which can be `null` or an instance of `IOffer`.
  - `booking`: An instance of `IBookingInfo` representing the booking information.
  - `isFromChangeDate`: An optional boolean parameter indicating if the function call is due to a date change.

- **Return Type**:
  The function returns an object with the following properties:
  - `bookingStartDate`: A string representing the start date of the booking.
  - `arrAirportName`: An optional string representing the name of the arrival airport.
  - `depAirportName`: An optional string representing the name of the departure airport.

## Logic

The function `getBookingData` operates based on the following logic:

1. **Conditional Check on `isFromChangeDate` and `amendDatesOffer`**:
   - If `isFromChangeDate` is `true` and `amendDatesOffer` is not null, the function proceeds to extract route information specifically from the `amendDatesOffer` using the `getRoute` utility function with `RouteDirection.Outbound`.
   - It destructures `depName` and `arrName` from the result of `getRoute` (or defaults to an empty object if `getRoute` returns `null`), and uses `amendDatesOffer.accom.date` as the `bookingStartDate`.

2. **Default Case**:
   - If the condition above is not met, the function defaults to extracting route information from the `booking` object using the `getBookingRoute` utility function with `RouteDirection.Outbound`.
   - Similar to the conditional branch, it destructures `depName` and `arrName` from the result (or an empty object if the result is `null`), but uses `booking.package?.accom?.startDate` as the `bookingStartDate`.

This structure allows the function to handle two scenarios: one where the booking dates are being amended (and thus might have different route details), and the default scenario where route details are pulled directly from the booking object.