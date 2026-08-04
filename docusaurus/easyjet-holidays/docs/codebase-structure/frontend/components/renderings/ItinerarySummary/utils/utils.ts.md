## Imports

The given code does not explicitly import any external libraries or modules directly within the snippet. However, it does use standard JavaScript/TypeScript language features such as regular expressions and string manipulation methods. It also uses ES6+ features like `const` for variable declarations, arrow functions, and template literals for string interpolation.

The code does export two functions using ES6 export syntax:
- `formatPhoneNumbersAsLinks`
- `formatLinksInText`

These functions can be imported in other JavaScript or TypeScript files to be utilized within those modules.

## Structure

The code snippet consists of two main parts:

1. **Regular Expression Constants**:
   - `PHONE_NUMBER_REGEX`: A regular expression designed to match phone numbers. It accommodates various formats by allowing optional dashes, pluses, parentheses, and spaces, and expects between 10 to 13 digits.
   - `URL_REGEX`: A regular expression intended to match URLs that begin with "http://" or "https://", followed by any characters except whitespace and certain punctuation marks, ensuring the URL does not end with a comma, period, or other common sentence-ending punctuation.

2. **Functions**:
   - `formatPhoneNumbersAsLinks(text: string): string`: A function that takes a string and replaces all occurrences of phone numbers (matched by `PHONE_NUMBER_REGEX`) with HTML anchor tags that format the phone number as a clickable telephone link.
   - `formatLinksInText(text: string): string`: A function that transforms all found URLs (matched by `URL_REGEX`) within the given text into clickable links, each wrapped in an HTML anchor tag with attributes to open the link in a new tab and include `rel="noopener noreferrer"` for security.

## Logic

### Function: `formatPhoneNumbersAsLinks`

1. **Matching Phone Numbers**: The function first attempts to find all substrings in the provided text that match the `PHONE_NUMBER_REGEX`.
2. **Conditional Check**: If no phone numbers are found (`phoneNumbers` is null), the original text is returned unchanged.
3. **Replacement**: If phone numbers are found, each phone number is replaced in the original text with an HTML anchor tag. This tag uses a `tel:` protocol link for making phone calls directly from the link. Special characters like spaces are removed from the phone number in the `href` attribute to ensure the URL is valid, while the displayed text is the trimmed version of the original phone number.
4. **Return**: The modified text with phone numbers formatted as clickable links is returned.

### Function: `formatLinksInText`

1. **Matching URLs**: Similar to the previous function, it starts by finding all substrings that match the `URL_REGEX`.
2. **Conditional Check**: If no URLs are found, it returns the original text unchanged.
3. **Replacement**: For each URL found, it replaces the plain text URL in the original text with an HTML anchor tag. This tag is designed to open the URL in a new browser tab (`target="_blank"`) and includes `rel="noopener noreferrer"` to mitigate certain security risks.
4. **Return**: The text with URLs formatted as clickable links, with security and usability enhancements, is returned.

Both functions utilize the `reduce` method to iterate over the found matches and incrementally update the text, ensuring that all occurrences are replaced appropriately.