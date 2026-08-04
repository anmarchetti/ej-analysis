### Imports

The code snippet does not have any imports. It defines exports that can be used in other parts of a JavaScript or TypeScript project. The exports include enums and an interface.

### Structure

The code consists of several key structural elements:

1. **Enums**:
   - `CurrencyCode`: Enum representing different currency codes. It includes `GBP`, `CHF`, and `EUR`.
   - `SignDisplay`: Enum defining options for how the sign (positive/negative) should be displayed. Options include `Always`, `AUTO`, and `ExceptZero`.
   - `TrailingZeroDisplay`: Enum specifying how trailing zeros should be handled. Options are `Auto` and `StripIfInteger`.

2. **Object**:
   - `FORMATTING_NUMBERS_LANG_MAP`: An object mapping locale short codes to their respective `Intl.NumberFormat` locale strings. This is used for setting up number formatting based on different languages and regions.

3. **Interface**:
   - `ICurrencyFormatOptions`: An interface that extends `Intl.NumberFormatOptions`. It includes additional properties:
     - `hideCurrencySymbol`: Optional boolean to determine if the currency symbol should be hidden, formatting the number as a decimal.
     - `roundUp`: Optional boolean to specify if rounding should be upwards.
     - `signDisplay`: An optional parameter of type `SignDisplay` to specify how the sign should be displayed.
     - `trailingZeroDisplay`: An optional parameter of type `TrailingZeroDisplay` to manage the display of trailing zeros.

### Logic

The logic within this code snippet revolves around setting up and customizing the formatting of currency and numbers based on locale and specific formatting preferences:

- **CurrencyCode Enum**: Allows for standardized references to specific currencies throughout an application, ensuring consistency in currency identifiers.

- **FORMATTING_NUMBERS_LANG_MAP Object**: Maps short locale codes to full `Intl.NumberFormat` compatible locale identifiers. This mapping ensures that the correct locale settings are used for number formatting, which is crucial for internationalization.

- **ICurrencyFormatOptions Interface**: Extends the standard number formatting options to include additional functionality:
  - `hideCurrencySymbol`: When set to true, this option modifies the number format to exclude the currency symbol, useful in contexts where the currency is implied or where space is limited.
  - `roundUp`: This option could be used to ensure that all formatted numbers are rounded up, which might be necessary in specific financial or reporting contexts.
  - `signDisplay`: Allows for flexible display of the sign, aiding in contexts where the sign display might change based on business rules (e.g., always showing the sign in financial statements).
  - `trailingZeroDisplay`: Provides control over how trailing zeros are displayed, which can be important for aesthetic or clarity reasons in displayed numbers.

Overall, the code provides a robust framework for handling number and currency formatting in a JavaScript or TypeScript application, with a focus on flexibility and internationalization.