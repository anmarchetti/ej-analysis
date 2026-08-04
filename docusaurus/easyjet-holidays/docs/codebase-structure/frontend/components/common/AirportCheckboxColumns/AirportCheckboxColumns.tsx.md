### Imports

The component imports several modules and utilities:

- `React, { FC }` from the React library to use React and functional components.
- `classNames` to conditionally join class names together.
- `useStore` custom hook for accessing the Redux store state.
- Utility functions `leftColumn` and `rightColumn` from `frontend/utils/array.utils` to split arrays into two columns.
- `sortDepartureAirportsAlphabetically` from `frontend/utils/search/search.utils` for sorting airports.
- `MarketCode` enum from `models/data/MarketSettings` to handle specific market codes.
- `IAirport` and `IAirportCountry` interfaces from `models/sitecore/IAirportsData` to type-check the data related to airports and countries.
- `AirportCheckboxRow` and `GeoInput` components for rendering individual rows of airports and a geographical input component respectively.
- `styles` from a local SCSS module for styling the component.

### Structure

The `AirportCheckboxColumns` component is structured as follows:

- **Props:** Defined by the `IAirportCheckboxColumnsProps` interface, which includes methods for checking if an item is checked or disabled, handlers for adding or removing origins, and properties related to origins and countries.
- **State Management:** Uses the `useStore` hook to access the `marketCode` from the Redux store.
- **Utility Processing:** Combines and processes airports data based on the current market code and sorts them if necessary.
- **Rendering:** The component returns two main div elements each containing a column of `AirportCheckboxRow` components. It also includes a `GeoInput` component for handling geographical inputs.

### Logic

1. **Market Code Handling:**
   - Fetches the `marketCode` from the Redux store.
   - Filters and modifies airport data based on the market code. If the market is not the UK, it modifies the airport names to include the country name unless already included.

2. **Airport Data Processing:**
   - Reduces the countries array to a single array of airports, applying name modifications based on the country and market code.
   - Sorts the airports alphabetically if the market is not the UK.

3. **Column Splitting and Rendering:**
   - Uses the `leftColumn` and `rightColumn` utility functions to divide the list of airports into two columns.
   - Maps each column to `AirportCheckboxRow` components, passing necessary props for handling state changes and UI updates.

4. **Conditional Styling:**
   - Uses `classNames` to dynamically assign classes to the column containers.

5. **GeoInput Integration:**
   - Integrates the `GeoInput` component at the top of the first column, passing relevant props for managing origins based on user interaction.