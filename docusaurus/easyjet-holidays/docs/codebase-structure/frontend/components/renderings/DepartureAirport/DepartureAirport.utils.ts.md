## Imports

The code imports utilities and type definitions from local modules:

- `normalizeString` from `'frontend/utils/string.utils'` - A utility function likely used for string normalization such as trimming and converting to lower case.
- `IAirport` and `IAirportCountry` from `'models/sitecore/IAirportsData'` - TypeScript interfaces used to type-check the data structures representing airports and groups of airports.

## Structure

The module defines several functions aimed at filtering and checking airport data based on search criteria and selection status:

1. **isAirportMatchesSearchValue**:
   - **Parameters**: `airport` (IAirport), `searcherValue` (string)
   - **Returns**: boolean
   - Purpose: Checks if the airport's name matches the normalized search value.

2. **filterGroupsAirportsBySearchValue**:
   - **Parameters**: `acc` (IAirport[]), `airportGroupOfAirports` (IAirport), `searcherValue` (string)
   - **Returns**: IAirport[]
   - Purpose: Filters groups of airports based on the search value and accumulates matches.

3. **filterAirports**:
   - **Parameters**: `airportsGroups` (IAirportCountry[]), `searcherValue` (string)
   - **Returns**: IAirportCountry[]
   - Purpose: Filters an array of airport groups by reducing each group based on the search value.

4. **isCheckedAirport**:
   - **Parameters**: `checkedAirports` (string[])
   - **Returns**: Function that takes either IAirport or IAirportCountry and returns a boolean
   - Purpose: Creates a function to check if an airport or a group of airports is selected based on a list of checked airport codes.

## Logic

### isAirportMatchesSearchValue Function

- Normalizes the airport name and the search value using the imported `normalizeString` function and converts them to lower case.
- Checks if the normalized airport name includes the normalized search string using the `includes` method.

### filterGroupsAirportsBySearchValue Function

- Filters the `airports` array in an `IAirport` object based on whether each airport matches the search value using the `isAirportMatchesSearchValue` function.
- Accumulates and returns an updated array of `IAirport` objects with the filtered airports.

### filterAirports Function

- Maps over an array of `IAirportCountry` objects.
- For each group, it uses the `reduce` method to filter out individual `IAirport` objects or groups of airports based on the search value.
- Constructs a new array of `IAirportCountry` objects with the filtered results.

### isCheckedAirport Function

- Initializes a new Set containing the codes of checked airports.
- Returns a function that checks if an airport or a group of airports is entirely checked:
  - If the item is a group of airports, it verifies that all airports in the group are checked.
  - If the item is a single airport, it checks if its code is in the set of checked codes.