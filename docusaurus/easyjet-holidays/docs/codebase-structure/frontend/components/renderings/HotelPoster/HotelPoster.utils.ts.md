## Imports

The JavaScript module imports various utilities, models, and constants from different directories, which are essential for the functionalities defined within:

- **Date and Token Constants:**
  - `DATE_FORMATS` from `'code/dates'`
  - `Tokens` from `'code/tokens'`

- **Store and Utilities:**
  - `LayoutStore` from `'frontend/store/holidays'`
  - Utility functions from `'frontend/utils'` for handling accommodations, dates, hotel locations, routes, strings, tokenization, and tourist taxes.

- **Models:**
  - Data models `IHotel` and `IOfferWithoutAltBoards` from `'models/data'`
  - Enumerations like `RouteDirection` and `SitecoreDictionary` from `'models/enum'`

## Structure

The code snippet defines two primary exported functions:

1. **`getPosterMeta`**:
   - **Parameters**: Accepts an object containing `hotelInfo`, `offer`, and `getPhrase` function.
   - **Returns**: An object containing metadata related to a hotel offer or `null` if no offer is provided.

2. **`getTouristTaxLabelForPoster`**:
   - **Parameters**: Includes `isTouristTaxEnabled`, a `getPhrase` function from `LayoutStore`, and an optional `taxPricePp` with a default value of `INVALID_TAX_VALUE`.
   - **Returns**: A string that provides a label for tourist tax information based on the provided conditions.

## Logic

### `getPosterMeta` Function

- **Offer Check**: Immediately returns `null` if no offer is available.
- **Data Extraction**: Destructures and extracts `transport`, `stay`, and `accom` properties from the `offer`.
- **Route Handling**: Filters and retrieves the outbound route using `getSingleRoute` and the `RouteDirection.Outbound` enum.
- **Date Formatting**: Formats the departure date using `formatDateL10n` if an outbound route exists.
- **Return Structure**: Constructs and returns an object containing details about the unit, theme, hotel location, outbound route, departure date, selected unit, room type, board type, and holiday duration.

### `getTouristTaxLabelForPoster` Function

- **Initial Checks**: Returns an empty string if tourist tax is disabled or if the `taxPricePp` equals `INVALID_TAX_VALUE`.
- **Tax Applicability**: Checks the value of `taxPricePp` and decodes HTML entities for the phrase if the tax is not applicable.
- **Tax Calculation and Token Replacement**:
  - Calculates the tourist tax using `getTouristTaxPrice`.
  - Uses `Tokenizer.replaceToken` to replace placeholders in the localized string fetched via `getPhrase`.
- **Output**: Constructs and returns the final string with the tax information enclosed in parentheses.

These functions collectively help in generating metadata and labels for UI components related to hotel offers, particularly focusing on aspects like transportation, accommodation, and applicable taxes.