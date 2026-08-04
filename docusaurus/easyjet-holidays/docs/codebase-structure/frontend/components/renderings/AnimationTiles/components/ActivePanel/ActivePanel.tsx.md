## Imports

The `ActivePanel` component imports various modules and components to function properly. Below is a breakdown of these imports:

- **React Essentials**: Imports `React`, `FC` (FunctionComponent type), `useEffect`, `useRef`, and `useState` from `react` for component creation and state management.
- **Sitecore JSS**: Imports `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore items.
- **Classnames Utility**: Imports `classNames` for conditionally joining class names together.
- **Custom Hooks**: 
  - `useMobileViewport` from `frontend/hooks/useMediaQuery` to check if the viewport is mobile-sized.
  - `useStore` from `frontend/hooks/useStore` to access the global state store.
- **Types and Interfaces**:
  - `TStores` from `frontend/store/IStores` representing the type definition for stores.
  - `MediaSize` from `models/data/MediaSizeParams` for media size parameters.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing enum values.
  - `ISitecoreField` and `ISitecoreImage` from `models/sitecore/generic/ISitecoreField` for typing Sitecore fields.
- **UI Components**:
  - `Button` from `frontend/components/common/Button`.
  - `JSSImageNext` from `frontend/components/common/JSSImageNext/JSSImageNext`.
  - `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks`.
  - `SvgCross` from `frontend/components/icons-new/Cross` for rendering a cross icon.
- **Styling**: Imports `styles` from `./ActivePanel.module.scss` for component-specific styling.

## Structure

The `ActivePanel` component is a functional React component that accepts props defined by the `IActivePanelProps` interface. The props include:

- `Description`: A Sitecore text field.
- `Icon`: A Sitecore image field.
- `Title`: A Sitecore text field.
- `hideContainer`: A boolean to control the visibility of the container.
- `onClick`: A function to handle click events.

### Subcomponents and HTML Structure

- A main `div` container with conditional classes and a data attribute `data-tid='active-panel'`.
- A `Button` component acts as a close button, with accessibility attributes and conditional tabindex.
- A `div` for content with a `ref` to measure scrollability, conditional tabindex, and data attributes.
- Inside the content `div`, the following are conditionally rendered:
  - `JSSImageNext` for the icon.
  - `Text` for the title.
  - `RichTextWithLinks` for the description.

## Logic

### State and Refs

- `contentRef`: A ref attached to the content `div` to access its DOM properties.
- `hasScroll`: A state to track if the content is scrollable.

### Effects and Conditional Rendering

- An `useEffect` hook checks if the content `div` is scrollable whenever the `isMobile` state changes.
- The `hasScroll` state is used to conditionally set the `tabIndex` of the content `div`.
- The `hideContainer` prop conditionally applies styles and sets `tabIndex` on the close button and the content `div`.

### Accessibility

- The close button has an `aria-label` fetched from `getPhrase` using the `SitecoreDictionary` for accessibility.
- Conditional `tabIndex` values ensure that elements are only focusable when appropriate, enhancing keyboard navigation.

### Dynamic Styling and Attributes

- The `classNames` utility is used to dynamically apply classes based on the `hideContainer` state.
- `JSSImageNext` dynamically receives size props based on the viewport through `ICON_SIZES`.

This component effectively combines React's functional component pattern with hooks for state management, context for global state access, and conditional rendering for responsive and accessible UI.