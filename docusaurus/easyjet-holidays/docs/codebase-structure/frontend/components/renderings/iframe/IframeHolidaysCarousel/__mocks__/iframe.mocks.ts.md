### Imports

The code begins by importing dependencies and mock data to be used within the module:

- `luggageInfoMock` from `'frontend/__mocks__/extraLuggage'`: This import likely contains mock data related to additional luggage options or details.
- `mockTouristTax` from `'frontend/__mocks__/touristTax'`: This import probably provides mock data for tourist tax applicable to the offer.
- `IOffer` from `'models/data/IOffer'`: This is an interface import that defines the structure of an offer object, ensuring the data structure adheres to a predefined format.

### Structure

The `mockIframeOffer` object is structured as follows:

- **Basic Offer Information**: Includes fields like `id`, `date`, `stay`, `price`, `pricePP` (price per person), and `deposit`.
- **Accommodation (`accom`)**: Details about the accommodation including dates, stay duration, unique identifiers, and package details. It also includes:
  - **Unit**: Details about the unit type, price, discounts, room type, board type, and occupation details.
  - **Theme**: Contains visual identifiers such as icons.
- **Transport**: Contains an array of routes detailing departure and arrival points, times, and names for both outbound and inbound journeys.
- **Transfers**: Details about the type of transfers provided (e.g., shared transfer).
- **Hotel**: Information about the hotel such as name, star rating, number of reviews, associated airports, and geographical details (country, location, and resort).
- **Additional Information**:
  - `hasDistressedFlights`: A boolean indicating the presence of distressed flights.
  - `extraLuggageInfo`: Imported mock data about extra luggage.
  - Spread of `mockTouristTax`: Additional tourist tax information spread into the main object.

### Logic

The logic of this module primarily involves constructing a mock offer object with structured data. This mock object can be used for testing or development purposes where interaction with real API data isn't possible or practical. The structure follows the `IOffer` interface, ensuring all necessary fields are included and correctly typed.

- **Mock Data Usage**: By using mock data for luggage and tourist tax, the module simulates scenarios that can be expected in a production environment, allowing for thorough testing of components that consume this data.
- **Data Integration**: The object combines static data defined within the module with imported mock data, showcasing how multiple data sources can be integrated to form a comprehensive data model.
- **Type Assertion**: The entire object is cast to `IOffer` using TypeScript's `as unknown as IOffer`, ensuring that it matches the expected interface structure, which is crucial for type safety and integrity in a TypeScript project.