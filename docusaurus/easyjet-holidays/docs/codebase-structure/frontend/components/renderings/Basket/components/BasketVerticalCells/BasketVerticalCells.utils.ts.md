## Imports

The JavaScript code snippet provided does not include any explicit import statements from external modules or other files. It relies solely on native browser APIs to manipulate the DOM.

## Structure

The code consists of two exported functions:

1. **setContainerHeight**: This function is designed to adjust the CSS variable `--basket-summary-box-height` based on the height of a visible HTML element with the ID `#basket-container`. This function is intended to be used during an A/B testing phase.

2. **resetScrollbarPosition**: This function resets the scrollbar position of an element with the ID `#scrollable-wrapper` to the top. This is typically used after some UI interactions that might alter the scroll position, such as collapsing a summary detail panel.

### Detailed Breakdown:

- **setContainerHeight**:
  - **Purpose**: Adjusts a CSS variable based on the height of a visible container.
  - **Implementation Details**: Searches for the container `#basket-container` that is currently visible (i.e., not hidden) in the DOM and sets a CSS property based on its height.
  - **Visibility Check**: Uses `offsetParent !== null` to determine if an element is visible.

- **resetScrollbarPosition**:
  - **Purpose**: Resets the scrollbar position of a specific container.
  - **Implementation Details**: Targets the element with the ID `#scrollable-wrapper` and uses the `scroll` method to reset its position.

## Logic

### setContainerHeight

1. **Query the DOM**: Uses `document.querySelectorAll` to find all elements with the ID `#basket-container`.
2. **Find Visible Element**: Utilizes the `Array.from()` method to create an array from the NodeList returned by `querySelectorAll`. It then uses `find()` to get the first element that is visible to the user (`offsetParent !== null`).
3. **Set CSS Property**: If a visible element is found, it dynamically sets the CSS variable `--basket-summary-box-height` to the height of this element using `element.style.setProperty`.

### resetScrollbarPosition

1. **Select Element**: Retrieves the element with the ID `#scrollable-wrapper`.
2. **Reset Scroll**: If the element exists, it uses the `scroll` method to set its scrollbar position to the top-left corner (`0, 0` coordinates).

### Notes

- The function `setContainerHeight` includes comments indicating that it is part of a temporary A/B testing implementation and should be refactored after the test concludes.
- Both functions are designed to operate independently and can be called as needed depending on user interaction or specific application state changes.