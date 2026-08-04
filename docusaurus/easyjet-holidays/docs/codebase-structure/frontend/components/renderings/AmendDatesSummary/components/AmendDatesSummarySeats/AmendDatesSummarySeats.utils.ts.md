### Imports

The code imports several utility functions and TypeScript interfaces from various modules within the project. These are organized under different namespaces and files that suggest their usage context:

- **Utility Functions:**
  - `getRouteByDirection` from `'frontend/utils/airports.utils'` helps in categorizing routes by direction (inbound or outbound).
  - `extractPassengerSeats` from `'frontend/utils/passenger.utils'` processes passengers' seat selections.
  - `getFlightDigitalNumber` from `'frontend/utils/route.utils'` retrieves a numerical identifier for a flight based on the route.
  - `getSeatMapInfoFromSelectedSeats` from `'frontend/utils/seatAndBags.utils'` compiles seat map information based on selected seats and flight numbers.

- **Interfaces:**
  - `IGuestPassenger` from `'models/data/ILeadPassenger'` likely represents the structure for guest passenger data.
  - `IRoute` from `'models/data/IRoute'` defines the structure for flight routes.
  - `IPassengerSeats` and `ISelectedSeat` from `'models/data/ISeatMapStore'` define the structures for managing seat selections and the resultant seat assignments.

### Structure

The code defines a single exported function `getSelectedSeats` which takes three parameters:
- `routes`: An array of `IRoute` objects representing flight routes.
- `guests`: An array of `IGuestPassenger` objects representing passengers.
- `seatSelection`: An array of `ISelectedSeat` objects representing seat selections.

The function returns an object of type `IPassengerSeats`, which includes details about seats selected for inbound and outbound routes.

### Logic

1. **Route Direction Splitting:**
   - The function begins by calling `getRouteByDirection` to split the provided `routes` array into inbound and outbound routes. This helps in handling the logic separately for each direction.

2. **Flight Number Extraction:**
   - For both inbound and outbound routes, the digital flight numbers are extracted using `getFlightDigitalNumber`. These numbers are crucial for subsequent operations involving seat selections.

3. **Compiling Seat Map Information:**
   - Using `getSeatMapInfoFromSelectedSeats`, the function compiles detailed seat map information. This function utilizes the guest list, seat selections, and the extracted flight numbers for both directions to form a comprehensive mapping.

4. **Extracting Passenger Seats:**
   - The function then extracts detailed seat information for both inbound and outbound flights using `extractPassengerSeats`. This step processes the compiled seat map information to segregate and organize seat data as per the flight direction.

5. **Return Structure:**
   - Finally, the function returns an object containing organized seat data for both outbound and inbound flights, structured as per the `IPassengerSeats` interface.

This function effectively serves as a bridge between raw data (routes, passengers, and seat selections) and a structured representation of seat assignments for inbound and outbound flights, thereby facilitating easier management and access to seat selection data in the context of a flight booking system.