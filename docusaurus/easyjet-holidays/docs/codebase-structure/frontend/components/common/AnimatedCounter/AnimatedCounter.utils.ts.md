## Imports

This JavaScript module uses ES6 module syntax for exporting the function `getDigits`. There are no external imports in this module, as it only utilizes built-in JavaScript functions and methods.

## Structure

The `getDigits` function is defined as an arrow function and exported directly using `export const`. It takes a single parameter:
- `number`: A number (type `number`) which is the input for which digits are extracted.

The function returns an array of objects, each containing two properties:
- `id`: A number representing the index of the digit in the original number, starting from the least significant digit (rightmost).
- `value`: The numeric value of the digit.

### Function Signature

```typescript
(number: number): { id: number; value: number }[]
```

## Logic

1. **Input Validation and Preparation**:
   - The function starts by ensuring the input number is non-negative using `Math.max(number, 0)`. If the input number is negative, it defaults to `0`.
   - The number is then converted to a string using `.toString()` method.

2. **Conversion to Integer**:
   - The string representation of the number is converted to a fixed decimal format with no decimal places using `.toFixed(0)`. This step ensures that the number is treated as an integer, stripping off any decimal part that might exist if a floating-point number was provided.

3. **Extraction and Reversal of Digits**:
   - The resulting string is split into an array of its individual characters (digits) using `.split('')`.
   - The array of characters is then reversed using `.reverse()`, which is necessary because the final output expects the least significant digit first (rightmost digit).

4. **Mapping to Objects**:
   - The reversed array of characters is then mapped to an array of objects using `.map()`.
   - Each character (now a string representing a digit) is converted back to a number using the unary plus operator (`+i`).
   - Each object in the resulting array has an `id`, which is the index provided by the second argument of the map function (`index`), and a `value`, which is the numeric value of the digit.

### Example Usage

```javascript
console.log(getDigits(1234));
// Output: [{ id: 0, value: 4 }, { id: 1, value: 3 }, { id: 2, value: 2 }, { id: 3, value: 1 }]
```

This function is useful for when you need to process or analyze the individual digits of a number, starting from the least significant to the most significant, with an easy reference to their original position through the `id` property.