## Imports

The `HighlightedText` component utilizes several imports:

- `FC` (Function Component) and `Fragment` from `react` are used for defining the component type and rendering multiple elements without adding extra nodes to the DOM, respectively.
- `NEGATIVE_INDEX` and `TWO` are constants imported from `code/commonNumbers`, which are used within the component logic to handle specific conditions.

## Structure

The component is defined as `HighlightedText` which implements the `IHighlightedTextProps` interface. This interface expects two properties:

- `filterValue`: A string that represents the text to be highlighted within the main text.
- `text`: The main text string where the `filterValue` will be searched and highlighted.

The component is a functional component that uses the React hooks and JSX syntax for rendering.

## Logic

The component follows these steps in its execution:

1. **Normalization**: Converts the `text` and `filterValue` to lowercase and trims `filterValue` to avoid case sensitivity and whitespace issues during comparisons.

2. **Highlight Matching Function**: Defined as `highlightMatch`, this function takes a string and a match string as arguments. It searches for the match within the string, and if found, it returns a JSX element that highlights the matched substring by wrapping it in `<b>` tags. If no match is found, it simply returns the original string.

3. **Initial Check**: The component first checks if the entire normalized `filterValue` exists within the normalized `text`. If a match is found, `highlightMatch` is called with the original `text` and the `prettifiedFilter`.

4. **Complex Filter Handling**: If no direct match is found, the `filterValue` is split into individual words and sorted by length in descending order. The component checks if the number of parts in `filterValue` is less than `TWO` to decide if the filter is complex.

5. **Word-by-Word Highlighting**: If the filter is not considered complex, the component splits the `text` into words and maps over them. For each word, it checks against each part of the `filterValue`. If a part matches, it uses `highlightMatch` to highlight the part within the word. Each word or highlighted word is wrapped in a `Fragment` with a unique key.

The result is a JSX structure where matched parts of the text are bolded, helping users see which parts of the text match their filter criteria.