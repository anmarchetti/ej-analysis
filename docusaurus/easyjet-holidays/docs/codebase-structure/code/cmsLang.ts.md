## Imports

The code does not explicitly import external libraries or modules but defines and exports constants, types, and functions for managing language settings in a Sitecore CMS environment. It utilizes TypeScript features for type safety and better code management.

## Structure

### Constants

- `ENGLISH`: A constant string `'en'` used to represent the English language universally in the code.
- `ENGLISH_REGION`: A constant string `'GB'` representing the region for the English language.
- `LANG_MAP`: A constant mapping object that relates URL language codes to CMS (Sitecore) language codes. This is particularly useful for converting languages from the URL-friendly format to the format expected by the CMS.
- `AVAILABLE_LANGS`: An array of strings listing the languages available in the CMS.

### Types

- `TSitecoreLangs`: A TypeScript union type of strings representing the supported Sitecore languages.
- `TLangs`: A TypeScript union type representing generic language codes.
- `TRedion`: A TypeScript union type representing region codes.
- `TUrlLang`: A TypeScript type derived from the keys of `LANG_MAP`, representing all possible URL language codes.
- `TCmsLang`: A TypeScript type derived from the values of `LANG_MAP`, representing all CMS language codes that can be derived from URL languages.

### Functions

- `getCMSLang`: A function that takes a URL language code and an optional fallback language, returning the corresponding CMS language code. If the provided URL language is not mapped in `LANG_MAP`, it returns the fallback language, defaulting to English.
- `getLangByCMSLang`: A function that takes a CMS language code and returns the corresponding URL language code by finding the first key in `LANG_MAP` that matches the CMS language code.
- `isLanguageAvailableInCMS`: A function that checks if a given language is available in the CMS by checking its presence in the `AVAILABLE_LANGS` array.

## Logic

### Language Mapping

The core functionality revolves around the conversion between URL language codes and CMS language codes using `LANG_MAP`. This mapping is essential for applications that need to interface with a multilingual Sitecore CMS where URL languages might differ from the internal language codes used by the CMS.

### Language Checking

The function `isLanguageAvailableInCMS` provides a utility to check if a language is supported by the CMS, which is crucial for validating language inputs and preventing errors related to unsupported languages.

### Language Conversion

The functions `getCMSLang` and `getLangByCMSLang` facilitate the conversion between URL and CMS languages. `getCMSLang` allows for a fallback mechanism, ensuring that the application can gracefully handle unsupported languages by reverting to a default language, thus maintaining robustness.

Overall, the code efficiently handles language mappings and conversions, essential for supporting multilingual capabilities in web applications interfacing with Sitecore CMS.