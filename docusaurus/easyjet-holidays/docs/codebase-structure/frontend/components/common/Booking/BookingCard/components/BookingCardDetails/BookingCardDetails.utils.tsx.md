### Imports

The code imports several hooks, utility functions, types, and constants from various modules:

- **Hooks:**
  - `useLuxuryInternalFlight`: A custom hook presumably determining if the flight is a luxury internal flight.
  - `useStore`: A custom hook for accessing the global state store.

- **Utility Functions:**
  - `getDaysDifference`: A utility to calculate the difference in days between two dates.
  - `getGuestsAmountByType`: A utility to calculate the number of guests by type (adults, children, infants) based on booking data.

- **Types and Interfaces:**
  - `TStores`: A type representing the structure of the stores used in the application.
  - `IBookingInfo`, `IRoute`, `ITransfer`: Interfaces representing the structure of booking information, route, and transfer data respectively.
  - `IHolidayFlightDetailsProps`: Interface for the props of the HolidayFlightDetails component, with some properties omitted in `TBookingDetails`.

- **Constants:**
  - `NUMBER_OF_ROUTES`: A constant likely representing the number of routes in a transport package.

- **Other Utilities:**
  - `getCommonData`: A function imported from a component's utility file, possibly extracting common data required for booking.

### Structure

The code defines a TypeScript type `TBookingDetails` and an interface `IPreparedBookingData`. Here's an outline of their structure:

- **`TBookingDetails`:** This type is derived from `IHolidayFlightDetailsProps` by omitting certain properties. It is used to structure the flight details in the returned object of the hook.

- **`IPreparedBookingData`:** This interface describes the structure of the data object returned by the `usePreparedBookingDetailsData` hook. It includes:
  - `details`: An object of type `TBookingDetails` containing detailed information about the booking.
  - `isCanceled`: A boolean indicating whether the booking has been canceled.
  - `isFlightDetailsDisplayed`: A boolean indicating whether the flight details should be displayed.

### Logic

The `usePreparedBookingDetailsData` function is a custom hook that processes booking information to prepare data for presentation:

1. **Store Access:**
   - Retrieves `largeCabinBagCode` from the `layoutStore` using the `useStore` hook.

2. **Flight Type Check:**
   - Determines if the flight is a luxury internal flight using the `useLuxuryInternalFlight` hook.

3. **Data Extraction:**
   - Extracts various pieces of data from the `booking` object, such as package details, transfer information, and common data like offer details and cancellation status.

4. **Luggage Calculation:**
   - Calculates the total number of hold luggage items excluding items identified by `largeCabinBagCode`.
   - Adjusts the luggage count based on whether it is a luxury internal flight or not. For luxury flights, it includes all guests; otherwise, it calculates based on the number of routes and includes infants.

5. **Return Object:**
   - Constructs and returns an object containing the cancellation status, a flag indicating whether flight details should be displayed, and detailed booking information including nights, routes, luggage count, transfer details, and package icons.

This hook centralizes and simplifies the preparation of booking data for components that need to display detailed flight and booking information.