## Imports

The script starts by importing the `dayjs` library along with several plugins that extend its functionality:

- `advancedFormat`: Allows using more complex date formats.
- `customParseFormat`: Enables the parsing of custom date string formats.
- `localeData`: Provides localized data based on the locale.
- `localizedFormat`: Allows for localized formatting of dates.
- `updateLocale`: Permits modifications to the locale's specific formatting and parsing behaviors.

Additionally, specific locale data for English (UK), French (Switzerland), German (Switzerland), French, and German are statically imported to ensure availability within the application.

## Structure

### Enums and Constants

The code defines several enums and constants to standardize date formats and configurations across the application:

- **`DateLocalizedFormats`**: Enum for standard localized date formats.
- **`DateCustomFormats`**: Enum for custom date formats, providing a standardized way of referring to these formats throughout the application.
- **`DATE_FORMATS`**: An object that consolidates all date formats (both default and custom) used in the application. It merges localized formats and custom formats for easy reference.
- **`DayjsLocale`**: Enum that lists supported locales, making it easier to manage and reference throughout the code.
- **`DAYJS_LOCALES_CONFIG`**: An object mapping that holds configuration for each locale, including how to expand the locale with custom formats and abbreviations.
- **`TIME_UNITS`**: Constants related to time calculations like milliseconds in a day, minutes in an hour, etc., used for various time-related operations.
- **`MONDAY`**: A constant representing the day Monday (used in contexts where the day of the week is needed as a number).

### Interfaces

- **`ILocaleImportConfig`**: Interface defining the structure for locale configuration objects, including methods for expanding the locale settings.
- **`ILocale`**: A global declaration that extends the existing `ILocale` interface from `dayjs`, adding custom formats and abbreviations specific to the application's needs.

### Plugin Extensions

The script extends `dayjs` with the imported plugins to enhance its formatting and parsing capabilities.

### Locale Expansion

Each locale configuration includes an `expandLocale` function that updates the locale's specific settings in `dayjs`. This setup allows for the dynamic alteration of date formats and abbreviations according to locale-specific requirements.

## Logic

The application logic revolves around configuring and utilizing the `dayjs` library to handle dates according to various international formats. The `DAYJS_LOCALES_CONFIG` object plays a crucial role by defining how each locale should interpret and display dates, ensuring that date handling is consistent and appropriate for different regional settings.

The use of enums and constants for defining date formats and locales ensures that the application uses a consistent and error-free approach when dealing with dates. This method also simplifies maintenance and scalability by centralizing date format specifications and locale configurations.