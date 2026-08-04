## Imports

The component imports several modules and components to function properly:

- `React`, `useEffect`, and `useState` from the `react` library for creating the component and managing state and lifecycle.
- `classNames` from the `classnames` package to conditionally join class names together.
- `useStore` custom hook from `frontend/hooks/useStore` to access the Redux store.
- `KeyboardKey` enum from `models/enum/KeyboardKey` to handle keyboard events.
- `SitecoreDictionary` enum from `models/enum/SitecoreDictionary` for accessing dictionary values.
- `AlphabetNav` and its interface `IAlphabetNavProps` from the local file `AlphabetNav` for rendering the alphabetical navigation component.

## Structure

The `AlphabetStickySelector` is a functional React component that accepts props of type `IAlphabetNavProps`. The component structure includes:

- **State Management**: Utilizes `useState` to manage the visibility state of the selector popup (`isSelectorShown`).
- **Effect Hook**: Uses `useEffect` to add and remove an event listener for closing the popup when the escape key is pressed.
- **Rendering**: The component returns a div that conditionally renders the `AlphabetNav` component and an overlay based on the `isSelectorShown` state. It also includes a button to toggle the visibility of the popup.

## Logic

1. **State Initialization**:
    - `isSelectorShown`: A boolean state initialized to `false`, used to control the display of the popup.

2. **Store Hook**:
    - `getPhrase`: Extracted from the store using the `useStore` hook, this function is used to retrieve localized phrases from the Sitecore dictionary.

3. **Popup Control Functions**:
    - `openSelectorPopup`: A function that sets `isSelectorShown` to `true`, thus showing the popup.
    - `closeSelectorPopup`: A function that sets `isSelectorShown` to `false`, thus hiding the popup.

4. **Effect for Keyboard Event Handling**:
    - Adds a `keydown` event listener to the document when `isSelectorShown` is `true`. The listener triggers `closeSelectorPopup` if the escape key is pressed.
    - Cleans up by removing the event listener when the component unmounts or `isSelectorShown` changes to `false`.

5. **Rendering Logic**:
    - The main container div applies dynamic class names using the `classNames` function.
    - A button is rendered to toggle the popup state. The button's label is fetched using the `getPhrase` function with `SitecoreDictionary.GlobalsLabelsAZ`.
    - When `isSelectorShown` is `true`, the component renders:
        - A popup (`div`) with `role` set to `dialog` and appropriate `aria` attributes for accessibility.
        - The `AlphabetNav` component is passed all props and additionally handles the `onAnchorClick` event to also close the popup.
        - An overlay `div` that closes the popup when clicked, enhancing the user experience by allowing clicks outside the popup to dismiss it.