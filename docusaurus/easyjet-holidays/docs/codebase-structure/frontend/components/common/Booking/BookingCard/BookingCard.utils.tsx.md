### Imports

The code imports several TypeScript interfaces and enumerations to define the shape of data and constants used within the functions:

- **IBookingAccom**, **IBookingInfo**: Interfaces imported from `'models/data/IBookingInfo'` that likely describe the structure of booking accommodations and booking information respectively.
- **IImage**: Interface from `'models/data/IHotel'` which probably defines the structure of image data related to hotels.
- **IRoute**: Interface from `'models/data/IRoute'` that specifies the structure of routing information.
- **BookingStatus**: Enumeration from `'models/enum/BookingStatus'` which provides predefined constants for booking statuses (e.g., Canceled).

### Structure

The code defines two main interfaces and two functions:

#### Interfaces

1. **ICommonData**:
   - **isCanceled**: A boolean indicating if the booking is canceled.
   - **offer**: An instance of `IBookingAccom`, representing the accommodation offer in the booking.
   - **routeDep**: A nullable `IRoute` type, possibly representing the departure route of the booking's transport.

2. **IPreparedBookingData**:
   - **images**: A nullable array of `IImage` objects, representing images associated with the booking.

#### Functions

1. **getCommonData**:
   - A function that accepts a `IBookingInfo` object and returns an `ICommonData` object.
   - It extracts and organizes common data elements from the booking information.

2. **usePreparedBookingData**:
   - A function that takes a `IBookingInfo` object and returns an `IPreparedBookingData` object.
   - It utilizes `getCommonData` to help prepare data specifically related to images in the booking.

### Logic

#### Function: `getCommonData`

- **Input**: `booking` of type `IBookingInfo`.
- **Process**:
  - Extracts the accommodation (`accom`) from `booking.package`.
  - Determines if the booking has been canceled by comparing `booking.bookingStatus` with `BookingStatus.Canceled`.
  - Attempts to access the first route from `booking.package.transport.routes` if `transport` and `routes` exist.
- **Output**: Returns an object of type `ICommonData` containing the extracted `offer`, `isCanceled` status, and `routeDep`.

#### Function: `usePreparedBookingData`

- **Input**: `booking` of type `IBookingInfo`.
- **Process**:
  - Calls `getCommonData` to extract the `offer`.
  - Tries to set `images` by first attempting to use `booking.hotel.images` and if not available, then `offer.hotel.images`.
- **Output**: Returns an object of type `IPreparedBookingData` with possibly null `images`.

The code effectively modularizes the data extraction and preparation process, allowing for reusability and clearer maintenance paths by separating concerns into distinct functions and interfaces.