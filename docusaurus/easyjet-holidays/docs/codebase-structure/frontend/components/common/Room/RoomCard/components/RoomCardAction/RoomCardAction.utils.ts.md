## Imports

The function `getFormattedPriceLabel` is exported using ES6 module syntax:

```javascript
export const getFormattedPriceLabel = ...
```

This allows it to be imported and used in other JavaScript or TypeScript files.

## Structure

The function `getFormattedPriceLabel` is defined as a constant using arrow function syntax. It takes two parameters:

- `formattedPriceLabel` (type `string`): A string that represents the price label, potentially including a '+' or '-' sign.
- `price` (type `number`): The numerical value of the price, which determines the prefix in the final string.

The function returns a string.

## Logic

1. **Prefix Determination**:
   - The `prefix` variable is determined based on the value of `price`. If `price` is greater than 0, `prefix` is set to '+'. If `price` is less than or equal to 0, `prefix` is set to '-'.

2. **String Manipulation**:
   - The `formattedPriceLabel` is modified by removing any existing '+' or '-' signs using the `replace` method with a regular expression (`/\+|\-/g`). This ensures that the label does not contain any prefix signs before adding the new prefix.

3. **Final String Construction**:
   - The final string is constructed using template literals. It combines the `prefix` (if `price` is not zero) and the cleaned `formattedPriceLabel`. The entire string is then trimmed of any leading or trailing whitespace using the `trim` method.

4. **Return Value**:
   - The function returns the newly constructed and trimmed string. If `price` is zero, no prefix is added, and only the cleaned `formattedPriceLabel` is returned after trimming.