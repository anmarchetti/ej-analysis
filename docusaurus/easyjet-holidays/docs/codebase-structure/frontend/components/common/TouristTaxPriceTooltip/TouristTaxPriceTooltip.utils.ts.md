## Imports

The code snippet imports several modules and types:

1. **CurrencyCode** - Imported from the module located at `code/currency`. This likely contains definitions or constants related to different currency codes used globally.
2. **Tokens** - Imported from the module at `code/tokens`. This module is expected to contain various token identifiers used within the application, possibly for localization or token replacement in strings.
3. **TTaxesAndFees** - A type imported from `models/data/ITouristTax`. This type is used to define the structure of tax and fee data related to tourism, tailored to different currencies.

## Structure

The code defines two types and two functions:

### Types

- **TTaxEntry**: This type is derived from `TTaxesAndFees` for a specific `CurrencyCode`. It uses TypeScript's utility type `NonNullable` to ensure that the value cannot be `null` or `undefined`.

### Functions

1. **getMultiCurrencyTokens**:
   - **Parameters**:
     - `touristTax`: A number representing the tourist tax.
     - `taxesAndFees`: An object of type `TTaxesAndFees`.
     - `conjunctionWord`: A string used to join exchange rate values.
   - **Returns**: An object where keys are token names from `Tokens` and values are strings. It constructs strings based on the tourist tax and related currency data.

2. **getSingleCurrencyTokens**:
   - **Parameters**:
     - `touristTax`: A number representing the tourist tax.
     - `taxEntry`: A single tax entry of type `TTaxEntry`.
   - **Returns**: An object with keys from `Tokens` and values as strings, providing formatted tax and currency information for a single currency scenario.

## Logic

### getMultiCurrencyTokens Function

- **Purpose**: To create a token object for scenarios involving multiple currencies.
- **Process**:
  1. Extracts all values from the `taxesAndFees` object into `taxEntries`.
  2. Constructs three key-value pairs:
     - `TouristTax`: Converts `touristTax` to a string.
     - `TouristTaxLocalAmounts`: Maps over `taxEntries` to create a string for each entry showing the currency and local price, joined by ' + '.
     - `ExchangeRateValues`: Maps over `taxEntries` to extract the exchange rate (`exchRt`), joining them with the provided `conjunctionWord`.

### getSingleCurrencyTokens Function

- **Purpose**: To create a token object for scenarios where only a single currency is involved.
- **Process**:
  - Directly constructs an object with key-value pairs where:
    - `TouristTax`: Converts `touristTax` to a string.
    - `CurrencyCode`, `ExchangeRate`, and `TouristTaxLocal`: Extracts respective values from `taxEntry`, converting them to strings where necessary.

In summary, these functions facilitate the generation of tokenized strings for displaying tourist tax information, adaptable to both single and multiple currency contexts, using predefined tokens for consistent key naming.