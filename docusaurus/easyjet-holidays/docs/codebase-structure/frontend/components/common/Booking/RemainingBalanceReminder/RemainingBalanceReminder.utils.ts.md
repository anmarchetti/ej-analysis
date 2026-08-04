## Imports

The code imports several modules and utilities that are essential for its operation:

- **`DATE_FORMATS`** from `'code/dates'`: Constants defining date formats used in the application.
- **`Tokens`** from `'code/tokens'`: Enumerations or constants representing token names used in string replacements.
- **`formatDateL10n`** from `'frontend/utils/date.utils'`: A utility function for formatting dates according to locale-specific rules.
- **`Tokenizer`** from `'frontend/utils/tokenizer'`: A utility class for replacing tokens in strings with dynamic values.
- **`SitecoreDictionary`** from `'models/enum/SitecoreDictionary'`: An enumeration that provides access to localized string keys used in Sitecore implementations.

## Structure

The code defines three functions that are exported for use elsewhere in the application:

1. **`getRemainingBalanceTitle`**: This function generates a title string based on the number of remaining days until a balance is due.
2. **`getRemainingBalanceDescription`**: This function creates a description string for the remaining balance, incorporating dynamic values such as the balance due date, destination, and price.
3. **`getRemainingBalanceButtonDescription`**: This function produces a description for a button, tailored to whether the balance is overdue or due by a certain date.

Each function takes a `getPhrase` function as an argument, which is used to retrieve localized phrases by key from the `SitecoreDictionary`.

## Logic

### `getRemainingBalanceTitle`

- The function determines the appropriate phrase based on the number of `remainingDays`:
  - If `remainingDays` is less than 0, it indicates an overdue balance.
  - A value of 0 means the balance is due today.
  - A value of 1 indicates the balance is due tomorrow.
  - Otherwise, it retrieves a general due date phrase.
- The selected phrase is then processed by the `Tokenizer` to replace the token representing the day with the actual number of `remainingDays`.

### `getRemainingBalanceDescription`

- The function first selects a phrase:
  - If the balance is overdue (`remainingDays` < 0), it uses a specific overdue phrase.
  - Otherwise, it uses a generic balance due label provided by the `balanceDueLabel` argument.
- It then uses the `Tokenizer` to replace various tokens in the phrase:
  - `Tokens.Amount` with the provided `price` (or an empty string if not provided).
  - `Tokens.Destination` with the provided `destination` (or an empty string if not provided).
  - `Tokens.Date` with the `validBalanceDueDate` formatted according to a specific date format.

### `getRemainingBalanceButtonDescription`

- The function selects a phrase based on whether the balance is overdue:
  - If overdue, it uses a specific phrase for overdue payments.
  - Otherwise, it uses a phrase indicating the due date for payment.
- It then replaces the `Tokens.Date` token in the selected phrase with the formatted `validBalanceDueDate`.

This structured approach allows for dynamic generation of user interface text based on the state of a user's financial obligations, with support for localization and token replacement for personalized content.