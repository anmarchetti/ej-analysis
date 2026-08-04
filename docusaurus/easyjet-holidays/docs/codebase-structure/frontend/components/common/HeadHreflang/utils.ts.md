## Imports

The code imports several modules and functions that are necessary for its operation:

- `parseHtmlToReact` from the `html-react-parser` package: This function is used to convert HTML strings into React components.
- `sanitizeHtml` from the `sanitize-html` package: This function is used to clean HTML content by removing or modifying non-allowed tags and attributes according to specified rules.
- Various named imports from `code/cmsLang`:
  - `AVAILABLE_LANGS`: A constant array containing available language codes.
  - `getCMSLang`: A function to get CMS-specific language code from a standard language code.
  - `getLangByCMSLang`: A function to convert CMS language codes to standard language codes.
  - `TCmsLang`: A TypeScript type alias used for type-checking CMS language codes.
- `purifyUrl` from `frontend/utils/url.utils`: A utility function to sanitize URLs.

## Structure

The code defines two main functionalities encapsulated in functions:

1. **`getHreflangTagByPageUrl`**:
    - **Purpose**: Generates an array of objects containing href and hrefLang properties for multi-language support in websites.
    - **Parameters**:
        - `pageUrls`: A record (object) where the keys are CMS language codes and the values are URLs.
        - `getSitePathInLang`: A function that takes a language code and returns a base path for that language.
    - **Returns**: An array of objects with `href` and `hrefLang` properties.

2. **`parseManualHreflangTag`**:
    - **Purpose**: Parses a string containing manual hreflang tags and converts it into React elements.
    - **Parameters**:
        - `manualHreflangTag`: A string potentially containing `<link>` elements with attributes like `rel`, `href`, and `hreflang`.
    - **Returns**: A JSX element, an array of JSX elements, or null if the input does not start with a `<link>` tag.

## Logic

### `getHreflangTagByPageUrl`

1. Extracts the language codes from the `pageUrls` object keys using `getLangByCMSLang`.
2. Filters the `AVAILABLE_LANGS` to only include those languages that are present in the `pageUrls`.
3. Maps over the sorted languages to construct the final array of hreflang tags:
    - Converts site language to CMS language using `getCMSLang`.
    - Constructs the full URL by combining the base path (from `getSitePathInLang`) and the sanitized URL (from `purifyUrl`).
    - Returns an object with `href` and `hrefLang`.

### `parseManualHreflangTag`

1. Sanitizes the `manualHreflangTag` string to only allow `<link>` tags with specific attributes (`rel`, `href`, `hreflang`).
2. Checks if the resulting HTML string starts with `<link>` to ensure it's a valid link element.
3. Parses the sanitized HTML into React elements using `parseHtmlToReact` if valid, otherwise returns null. This is crucial to safely insert the content into the `<head>` of a document without risking XSS attacks.