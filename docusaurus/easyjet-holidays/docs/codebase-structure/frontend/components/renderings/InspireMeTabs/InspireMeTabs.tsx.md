## Imports

The component imports several libraries and utilities to function properly:

- **React Specific**: Uses `React`, `FC` (Functional Component type from TypeScript), `Fragment`, `useEffect`, and `useLayoutEffect` for managing component lifecycle and rendering.
- **Sitecore JSS**: Imports `withPlaceholder` from `@sitecore-jss/sitecore-jss-react` for integrating with Sitecore placeholders.
- **MobX**: Utilizes `observer` from `mobx-react` to enable reactive data-driven rendering.
- **Custom Hooks and Utilities**:
  - `useMobileViewport` from `frontend/hooks/useMediaQuery` to check if the viewport is mobile-sized.
  - `useStore` from `frontend/hooks/useStore` to access MobX stores.
  - `lockBodyScroll` and `unLockBodyScroll` from `frontend/utils/ui.utils` to control body scroll based on viewport size.
  - `getWebStorageItem` from `frontend/utils/webStorage.utils` for accessing session storage.
- **Models and Enums**: Imports various TypeScript types and enums to type-check the data and manage constants effectively.
- **Components and Styles**:
  - `ProgressBar` component for displaying progress.
  - `styles` from a SCSS module for styling the component.

## Structure

The `InspireMeTabs` component is a functional React component that utilizes TypeScript for props validation. It is wrapped with both `observer` from MobX and `withPlaceholder` from Sitecore JSS to integrate reactive state management and Sitecore's dynamic placeholder functionality.

### Main Functional Component

- **Props**: Accepts `THolidayInspirationProps` which includes necessary data for rendering and interaction.
- **State Management**: Uses custom hook `useStore` to manage state related to the component and interacts with different stores like `inspireMeStore`, `layoutStore`, and `trackingStore`.
- **Rendering**: The component conditionally renders based on `isEditMode` and `activeQuestionIndex` to manage which part of the quiz or tab should be visible.

### Placeholder Integration

- `tabsComponentWithPlaceholderInjected` is the component with Sitecore's placeholder integrated, allowing dynamic insertion of other components or data managed through Sitecore.

## Logic

### Initialization and Cleanup

- **Initial Data Fetching**: On mount, the component checks for quiz data in session storage. If found, it normalizes and sets this data using `setTabsData`. If not, it initializes the quiz with default questions.
- **Cleanup**: On component unmount, it ensures the static start screen tab is active, and body scroll is unlocked.

### Responsive Behavior

- **Viewport Dependency**: The component locks the body scroll when viewed on mobile devices to enhance usability and unlocks it otherwise. This is managed through the `useMobileViewport` hook and corresponding side effects.

### Data Tracking

- **Analytics Tracking**: Utilizes `trackInspireMePageLoad` for tracking page views based on the active question. This is especially handled in a side effect that depends on `activeQuestionIndex`.

### Conditional Rendering

- **EditMode vs Normal Mode**: In edit mode, all questions are rendered inside a wrapper for editing purposes. In normal mode, only the active question is rendered, wrapped in a `Fragment` for grouping without adding extra nodes to the DOM.

This documentation covers the primary aspects of the `InspireMeTabs` component, focusing on its imports, structure, and logic, providing a clear overview of how the component is constructed and operates within a React and Sitecore JSS environment.