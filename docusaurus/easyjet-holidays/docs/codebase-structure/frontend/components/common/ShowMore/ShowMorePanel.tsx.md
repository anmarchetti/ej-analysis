### Imports

The code imports several modules and components necessary for its functionality:

- React hooks (`useState`, `useEffect`, `useRef`) and `ElementType` from the `react` package to manage state, lifecycle, and references, and to define prop types for components respectively.
- `classNames` function from the `classnames` package to conditionally join class names together.
- `useStore` custom hook from `frontend/hooks/useStore` to access the Redux store.
- `IHolidaysStores` interface from `frontend/store/holidays` to type-check the store structure specific to holidays.
- `SitecoreDictionary` enum from `models/enum/SitecoreDictionary` to utilize predefined dictionary keys for site-specific text.
- SVG components (`SvgChevronDown`, `SvgChevronUp`) from `frontend/components/icons-new/` to render icons conditionally.
- Component-specific styles from `./ShowMorePanel.module.scss` to style the components.

### Structure

The code defines two React components: `ShowButton` and `ShowMorePanel`.

#### `ShowButton` Component:
- **Props**:
  - `showTitle`: Title text when the panel is collapsed.
  - `hideTitle`: Title text when the panel is expanded.
  - `onClick`: Function to execute on button click.
  - `isOpen`: Boolean indicating if the panel is open.
  - `id`: Identifier for accessibility controls.
- **Functionality**:
  - Renders a button that toggles the visibility of content. It uses the `isOpen` state to determine which icon and title to display.

#### `ShowMorePanel` Component:
- **Props** (`IShowMoreProps` interface):
  - `Component`: React component type that will be rendered for each item.
  - `id`: Unique identifier for the component.
  - `visibleItems`: Items always visible.
  - `hiddenItems`: Items visible only when the panel is expanded.
  - `bodyClass`, `containerClass`: Optional CSS classes for styling.
  - `showLessTitle`, `showMoreTitle`: Titles for the show/hide button.
- **Hooks**:
  - Uses `useState` to manage the open/close state of the panel.
  - Uses `useRef` to reference the container DOM element for potential scrolling behavior.
  - Uses `useEffect` to reset the open state when items change.
- **Functionality**:
  - Toggles visibility of `hiddenItems` and optionally scrolls the component into view.
  - Conditionally renders `hiddenItems` and the `ShowButton` based on the presence and length of `hiddenItems`.

### Logic

- **State Management**: 
  - `isOpen` state determines if the hidden content is visible.
  - `containerRef` provides a reference to the container element, used for scrolling into view when expanding content.
- **Scrolling Behavior**:
  - `scrollFunction` checks if the component is out of view when expanded and scrolls it into view smoothly.
- **Conditional Rendering**:
  - The component only renders if there are items in `visibleItems`.
  - `hiddenItems` are rendered in a collapsible container that is controlled by the `isOpen` state.
- **Phrase Handling**:
  - Fetches phrases for the button titles using `getPhrase` from the store, which likely retrieves localized or configurable text based on `SitecoreDictionary` keys.
- **Accessibility**:
  - Proper `aria` attributes are used to enhance accessibility, such as `aria-expanded` and `aria-controls`.

This component is designed to be reusable for different types of content by passing different components and data as props, making it flexible for various parts of an application.