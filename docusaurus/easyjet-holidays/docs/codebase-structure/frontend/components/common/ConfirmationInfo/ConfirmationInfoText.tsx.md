## Imports

The `ConfirmationInfoText` component uses several imports from both internal and external sources:

- **React Imports:**
  - `useEffect`, `useRef`, and `useState` are imported from `react` to manage component lifecycle, references, and state respectively.

- **Utility and Helper Imports:**
  - `classNames` is imported from the `classnames` package to conditionally apply CSS class names based on the component's state.

- **Custom Hooks and Models:**
  - `useStore` is a custom hook imported from `frontend/hooks/useStore` that likely abstracts Redux or Context API store interactions.
  - `SitecoreDictionary` is imported from `models/enum/SitecoreDictionary` and is used to handle static content or text that is likely managed through Sitecore CMS.

- **Component Imports:**
  - `RichTextWithLinks` is a custom React component imported from `frontend/components/common/RichTextWithLinks` designed to render rich text content with embedded links.
  - `IconChevronDown` and `IconChevronUp` are icon components from `frontend/components/icons`, which visually indicate the expandable and collapsible states of the component.

## Structure

The `ConfirmationInfoText` component is structured as follows:

- **Interface Definition (`IConfirmationInfoTextProps`):**
  - This defines the props that the component expects, with a single `text` prop of type string.

- **Functional Component Definition:**
  - The component is a functional React component that accepts `IConfirmationInfoTextProps` as props.
  - Inside, it uses the `useStore` hook to access phrases from a store, which are used for the expand/collapse button text.
  - Two `ref` hooks, `infoTextRef` and `contentRef`, are used to reference DOM elements for calculating heights and managing expand/collapse functionality.
  - Two state hooks, `isOpened` and `canExpand`, manage the visibility of the text and the availability of the expand/collapse feature.

- **JSX Return:**
  - The component returns a `div` element with conditional classes based on its state.
  - It contains a `RichTextWithLinks` component for rendering the provided text and a button to toggle the expand/collapse state if `canExpand` is true.

## Logic

The component's logic is encapsulated within its effects and event handlers:

- **useEffect Hook:**
  - This effect runs once on mount. It checks the heights of the text and container divs to determine if the expand/collapse functionality should be enabled (`canExpand` state).
  - If the text's height exceeds the container's height, it enables the expand/collapse functionality.

- **toggleOpen Function:**
  - This function toggles the `isOpened` state, which controls whether the content is shown in an expanded or collapsed state.

- **Conditional Rendering:**
  - The expand/collapse button is only rendered if `canExpand` is true. The text on the button changes based on the `isOpened` state, using phrases fetched from the store.
  - Icons change depending on whether the content is expanded or collapsed, enhancing user experience and providing visual cues.

- **Dynamic Class Application:**
  - The `classNames` utility is used to dynamically apply CSS classes to the outer `div` based on the component's state, controlling the styling for expanded and expandable states.