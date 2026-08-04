## Imports

The code imports several utilities and types from different modules which are essential for its functionality:

- `getFlightsReferences` from `'frontend/utils/route.utils'`: This function is likely used to fetch references for flights based on provided routes.
- `getCheckInLink` from `'frontend/utils/viewBooking.utils'`: This utility function probably generates a check-in link for a given booking.
- `IBookingInfo` from `'models/data/IBookingInfo'`: This is an interface that defines the structure of booking information.
- `SiteSettings` from `'models/enum/SiteSettings'`: Enum used for managing site-specific settings.
- `getCommonData` from `'frontend/components/common/Booking/BookingCard/BookingCard.utils'`: A function to extract common data elements from booking information.

## Structure

The code defines an interface `IPreparedBookingData` and a function `usePreparedBookingInfoData`. The interface `IPreparedBookingData` outlines the structure for the prepared booking data:

- `checkInLink`: A nullable string that holds the URL for check-in.
- `isCanceled`: A boolean indicating whether the booking has been canceled.
- `isCheckInButtonDisplayed`: A boolean that determines if the check-in button should be shown.

The function `usePreparedBookingInfoData` is an exported function that takes two parameters:
1. `booking`: An object conforming to the `IBookingInfo` interface.
2. `getSetting`: A function that retrieves settings based on the `SiteSettings` enum.

## Logic

The function `usePreparedBookingInfoData` processes the provided booking data to prepare and return an object of type `IPreparedBookingData`:

1. Extracts the `isCanceled` status using `getCommonData` function.
2. Destructures `bookingPackage` from the `booking` object.
3. Retrieves flight references using `getFlightsReferences` by passing the transport routes from `bookingPackage`. If no routes are available, an empty array is passed.
4. Determines if there are multiple flight references by checking the length of the `flightReferences` array.
5. Generates a `checkInLink` using the `getCheckInLink` function, which utilizes the booking data and the `getSetting` function.
6. Finally, constructs the return object:
   - `isCanceled` is directly used from the extracted data.
   - `checkInLink` is assigned from the generated link.
   - `isCheckInButtonDisplayed` is determined based on several conditions: the booking should not be canceled, there should not be multiple flight references, and a check-in link should exist (`checkInLink` should be truthy).