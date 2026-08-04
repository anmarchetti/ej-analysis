## Imports

The code imports various modules and types from different paths which are categorized as follows:

- **Date and Token Utilities:**
  - `DATE_FORMATS` from `'code/dates'` for handling date formats.
  - `Tokens` from `'code/tokens'` for managing token replacements in strings.
  - `formatDateL10n` from `'frontend/utils/date.utils'` for localizing date formats.
  - `Tokenizer` from `'frontend/utils/tokenizer'` for token manipulation in strings.

- **Models and Interfaces:**
  - `IAmendPaymentInfo` from `'models/data/IAmendBookingFlights'` represents the interface for amendment payment information.
  - `ISitecoreField` from `'models/sitecore/generic/ISitecoreField'` defines the structure of a Sitecore field.
  - `IPaymentPageFields` from `'frontend/components/renderings/AmendPayment/interfaces'` specifies the interface for fields used in the payment page component.

## Structure

The code defines a single function `getTextMeta`, which is exported for use elsewhere. The function accepts an object with several properties:

- `fields`: Optional, of type `IPaymentPageFields`.
- `dueDate`: Required, of type `Date`.
- `totalPrice`: Required, of type `number`.
- `amendmentPaymentInfo`: Optional, of type `IAmendPaymentInfo`.
- `balanceAmount`: Required, of type `number`.
- `formatMoney`: Required, a function that takes a `number` and returns a `string`.

The function returns an object containing:
- `title`: Optional string, sourced from `fields`.
- `description`: Mandatory, of type `ISitecoreField<string>`.
- `subdescription`: Optional, of type `ISitecoreField<string>`.

## Logic

1. **Fee Inclusion Check:**
   - Determines if the amendment includes a fee by checking if `totalFeesAmount` is present and greater than zero.

2. **Total Balance Calculation:**
   - Computes the total balance by adding `totalPrice` and `balanceAmount`, then subtracting any `totalFeesAmount` if present, and formats it using `formatMoney`.

3. **Description Selection:**
   - Chooses between two possible descriptions based on whether `balanceAmount` is present, pulling the value from the `fields` object.

4. **Subdescription Handling:**
   - If fees are included, replaces the `Amount` token in the `ChangeFeeDescription` field's value with the formatted `totalFeesAmount`, wrapped in HTML for emphasis.

5. **Text Description Compilation:**
   - Replaces tokens for `Amount`, `Date`, and `Price` in the selected description using values calculated or formatted as per the logic, including:
     - `Amount`: Either `amendmentChargesWithoutFees` or `totalPrice` formatted and emphasized.
     - `Date`: The due date formatted according to a localized format.
     - `Price`: The total balance emphasized.

6. **Return Structure:**
   - Returns an object with `title`, `description`, and `subdescription`, where `description` and `subdescription` are objects containing a `value` key with the respective string values.