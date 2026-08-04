### Imports

The code imports various modules and components which are utilized within the script:

- `ComponentType` from `react`: Used to define the type for React components.
- Utility function `stringToTitleCase` from `frontend/utils/string.utils`: Transforms a string into title case.
- `GuestType` enum from `models/enum/GuestType`: Enumerates different types of guests (Adult, Child, Infant).
- `SitecoreDictionary` from `models/enum/SitecoreDictionary`: Contains dictionary keys for translating terms.
- SVG components (`SvgAdults`, `SvgChild`, `SvgPramInfantFilled`) from `frontend/components/icons-new`: Visual icons representing adults, children, and infants.

### Structure

The code defines an enum and two functions:

- **Enum `SummaryInfo`**: Contains keys representing different summary information sections such as Flight, LuggageAndTransfer, AccommodationAndBoard, etc.

- **Function `getAccommodationMeta`**:
  - Parameters:
    - `guestsCount`: An object mapping `GuestType` to number, representing the count of each type of guest.
    - `getPhrase`: A function to retrieve phrases from the dictionary.
  - Returns an array of objects, each containing an `Icon` component and a `label` string.

- **Function `createDataTid`**:
  - Parameters:
    - `suffix`: A string to be appended to the data attribute.
    - `prefix` (optional): A string to be prepended to the data attribute.
  - Returns a string that combines `prefix` and `suffix` to form a data attribute ID.

### Logic

#### `getAccommodationMeta` Function

1. **Reduction of `guestsCount`**:
   - Iterates over entries of `guestsCount`.
   - Skips entries where the count is zero.

2. **Dictionary Label Determination**:
   - Uses a switch statement to determine the appropriate label key from `SitecoreDictionary` based on the guest type and count.
   - Handles pluralization by checking if the count is greater than one.

3. **Accumulation**:
   - Constructs an array of objects where each object contains:
     - `Icon`: An SVG component associated with the guest type.
     - `label`: A string constructed by multiplying the guest count with the title-cased phrase obtained from the dictionary.

#### `createDataTid` Function

- Constructs a string for `data-tid` attributes used in HTML elements for testing or specific styling purposes.
- Combines `prefix` and `suffix` to form the final string, handling cases where `prefix` might not be provided.