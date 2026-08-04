## Imports

The `FacilitiesTabs` component imports various libraries and components to facilitate its functionality:

- **React Essentials**: Imports `React`, along with hooks `useEffect`, `useRef`, and `useState` from the `react` library for managing component lifecycle, referencing DOM elements, and handling component state.
- **Classnames Utility**: Imports `classNames` for conditionally joining classNames together.
- **MobX React Integration**: Uses `observer` from `mobx-react` to make the component reactive to MobX state changes.
- **Custom Hooks and Utilities**:
  - `useIsMounted` from `frontend/hooks/useIsMounted` to check if the component is still mounted before setting state.
  - `useStore` from `frontend/hooks/useStore` to access MobX stores.
  - `scrollToElement` and `unLockBodyScroll` from `frontend/utils/ui.utils` for managing scroll behavior.
- **Settings and Models**:
  - `settings` for accessing application settings like animation delays.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing dictionary keys for multilingual support.
- **UI Components**:
  - `Button` and `Drawer` from `frontend/components/common` for rendering buttons and drawer UI elements.
- **Local Components and Types**:
  - `FacilitiesTabsList` and `FacilitiesTabsPanels` for rendering specific sub-components of the facility tabs.
  - `IFacilitiesProps` from a specific path, defining the props type for the component.
- **Styles**:
  - `styles` from `./FacilitiesTabs.module.scss` for component-specific styling.

## Structure

The `FacilitiesTabs` component is structured as follows:

- **Functional Component Definition**: Defined as a functional component using the `FC` type from React, with props typed by `IFacilitiesProps`.
- **State Management**:
  - `activeTabIndex`: State to track the currently active tab index.
- **Refs**:
  - `viewRef`: A ref to the component's root div element for scroll operations.
- **Conditional Rendering**:
  - The component conditionally renders `FacilitiesTabsPanels` directly or within a `Drawer` based on the screen size and component mount status.
- **Event Handlers**:
  - `closeDrawer`: A function to handle closing the drawer and scrolling to the component's position.

## Logic

- **Responsive Behavior**: The component initializes and updates the `activeTabIndex` based on the screen size (`isScreenMedium`), toggling between the first tab and no active tab.
- **Scroll Management**:
  - When the drawer is closed, the component scrolls to its position after a delay defined in settings.
  - On resize, the body scroll is unlocked to ensure smooth resizing experiences.
- **Phrase Handling**: Uses the `getPhrase` function from the store to fetch phrases for multilingual support, used in rendering titles and button texts.
- **MobX Store Interaction**:
  - Uses `useStore` to subscribe to necessary MobX store states and actions, such as checking screen size, fetching phrases, and managing body scroll lock state.
- **Lifecycle Effects**:
  - An `useEffect` hook is used to handle component updates on screen size changes, ensuring the body scroll is unlocked and the active tab index is correctly set.

This component effectively demonstrates responsive design, state management, and integration with global state and utilities in a React application context.