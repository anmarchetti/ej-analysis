## Imports

The function `getSplitText` is exported from the module, making it available to be imported in other parts of the application where text splitting functionality is required. There are no external dependencies or imports within this code snippet.

## Structure

The `getSplitText` function is structured as an arrow function and is exported to be used elsewhere. It takes a single parameter:

- `text`: a string that will be processed within the function.

The function returns an array of strings containing two elements.

## Logic

The function `getSplitText` operates as follows:

1. **Input Validation**: It first checks if the input `text` is truthy. If it's falsy (`null`, `undefined`, `''`), the function immediately returns an array with two empty strings: `['', '']`. This prevents errors in subsequent operations if the input is empty or invalid.

2. **Splitting the Text**: The function splits the input `text` by spaces using the `split(' ')` method. This method divides the text into an array of words, storing each word as a separate element in the array `arr`.

3. **Constructing the Result**:
   - The main body of the text is obtained by taking all elements of the `arr` except the last one. These elements are then joined back into a string with spaces in between, ensuring that the structure of the sentence remains intact. A space is added at the end of this string to separate it from the last word.
   - The last word is directly accessed using `arr[arr.length - 1]`.

4. **Output**: The function returns an array containing two elements:
   - The first element is the concatenated string of all words except the last, followed by a space.
   - The second element is the last word of the input string.

This function is particularly useful for scenarios where the last word of a text needs to be treated or styled differently from the rest of the text, such as in UI elements displaying titles with emphasized last words.