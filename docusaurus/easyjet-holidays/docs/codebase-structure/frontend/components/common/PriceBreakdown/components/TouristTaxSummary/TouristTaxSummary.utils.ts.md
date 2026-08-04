## Imports

The code imports a type `TAmendTaxesAndFees` from the module `'models/data/IAmendTaxAndFeeItem'`. This type is likely a TypeScript type or interface defining the structure of tax and fee amendment items used throughout the module.

```javascript
import { TAmendTaxesAndFees } from 'models/data/IAmendTaxAndFeeItem';
```

## Structure

### Interfaces

- **`ICurrencyGroup`**: An interface to represent grouped currency information. It includes:
  - `convertedCurrency` (string): The currency to which amounts are converted.
  - `localCurrency` (string): The original currency of the amounts.
  - `totalConverted` (number): The total amount in the converted currency.
  - `totalLocal` (number): The total amount in the local currency.

### Functions

- **`createDecimalFormatter(locale: string): Intl.NumberFormat`**:
  Creates and returns a `NumberFormat` object configured to format numbers according to the specified locale with two decimal places, without grouping separators.

- **`groupByCurrency(taxesAndFees: TAmendTaxesAndFees): ICurrencyGroup[]`**:
  Groups an array of tax and fee items by their local currency, accumulating total local and converted amounts for each currency.

- **`buildAmountToken(taxesAndFees: TAmendTaxesAndFees, locale: string): string`**:
  Constructs a formatted string representing the total amounts in local currencies from the grouped tax and fee items.

- **`buildRateToken(taxesAndFees: TAmendTaxesAndFees, locale: string): string`**:
  Constructs a formatted string representing conversion rates between local and converted currencies for each group of tax and fee items.

## Logic

### Grouping by Currency

The `groupByCurrency` function iterates over an array of tax and fee items. Each item is added to a group identified by its local currency. If a group for a specific currency doesn't exist, it initializes a new group with totals set to zero. It then accumulates the local and converted amounts into these groups.

### Decimal Formatting

`createDecimalFormatter` utilizes the JavaScript `Intl.NumberFormat` API to create a formatter suitable for currency amounts, ensuring consistent display with two decimal places and no digit grouping, which can be particularly useful for financial calculations and display.

### Building Output Tokens

- **Amount Token**:
  `buildAmountToken` uses `groupByCurrency` to get groups of amounts by currency and then maps these groups to formatted strings showing the total amounts in each currency. These strings are joined with ' + ' to form a single string.

- **Rate Token**:
  `buildRateToken` also starts by grouping the items by currency. It calculates the rate of conversion from local to converted currency for each group. If the total local amount is zero, it safely handles this by setting the conversion rate to zero. The resulting strings are formatted to show the conversion rate and are joined with ', ' to form the final output string.