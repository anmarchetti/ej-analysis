## Imports

The `Tabs` component imports several modules and components to function properly:

- **React Imports**: `React`, `useEffect`, `useRef`, and `useState` are imported from the `react` package to utilize React's core functionalities including component state management and lifecycle effects.
- **Utility and Style Imports**:
  - `classNames`: A utility function from the `classnames` package to conditionally join class names together.
  - `switchTabOnArrowPress`: A utility function from `frontend/utils/a11y.utils` to handle arrow key navigation between tabs.
  - `SvgChevronRight`: A React component for the right chevron icon, used from `frontend/components/icons-new/ChevronRight`.
  - `styles`: Module-specific styles imported from `./tabs.module.scss`.
- **Component Imports**:
  - `Tab`: A sub-component used for rendering individual tabs, located in `./Tab/Tab`.

## Structure

The `Tabs` component is structured into the following main parts:

- **Prop Types**:
  - `ITab` and `ITabsProps`: Interfaces defining the shape of props that `Tabs` and individual tab items accept.
- **Constants**:
  - `INDICATOR_WIDTH_PADDING`: A constant used for styling calculations related to the visual indicator of the active tab.
- **Component Definition**:
  - The `Tabs` functional component is defined with destructured props for clarity and ease of use.
- **State Management**:
  - `activeTab`: State to track the currently active tab.
  - `isArrowVisible`: State to control the visibility of the navigation arrow in the UI.
- **Refs**:
  - `indicatorRef`, `tabWrapperRef`, `selectedTabRef`: React refs used to directly interact with DOM elements for managing focus, styles, and scroll behaviors.

## Logic

The component encapsulates several key behaviors necessary for a fully functional tab interface:

- **Tab Activation**:
  - `toggleActive`: A function to update the `activeTab` state, thus changing the currently active tab.
- **Indicator and Arrow Handling**:
  - `handleIndicator`: Adjusts the style of the tab indicator based on the currently selected tab's dimensions and position.
  - `handleArrow`: Determines whether the arrow for additional navigation should be shown, based on the overflow status of the tab container.
- **Keyboard Navigation**:
  - `handleTabsKeySwitch`: Handles left and right arrow key events to switch tabs accordingly.
- **Lifecycle Effects**:
  - An effect to call `onChange` if provided, and manage indicator and arrow visibility whenever the `activeTab` changes.
  - An effect to add and clean up a resize event listener, which also manages indicator and arrow visibility.
- **Rendering**:
  - The component returns a structured layout composed of a container that includes the tab list with individual tabs and potentially an arrow for scrolling through tabs. Each tab can be interacted with through clicks and keyboard events, and it controls the display of associated tab content.
- **Accessibility**:
  - Proper ARIA attributes and roles are used to enhance accessibility, including `aria-selected`, `aria-controls`, `role='tab'`, and `role='tabpanel'`.

This structure and logic ensure that the `Tabs` component is both functional and accessible, providing a robust solution for tabbed interfaces in React applications.