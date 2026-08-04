## Imports

The FloatingPopup component imports several modules and resources:

- `createContext`, `FC`, `useMemo`, `useState` from `react`: These are hooks and utilities from React for managing state and context.
- `classNames` from `classnames`: A utility function to conditionally join class names together.
- `useMobileViewport` from `frontend/hooks/useMediaQuery`: A custom hook to check if the viewport is mobile-sized.
- `Popup` from `frontend/components/common/Popup`: A reusable Popup component.
- `styles` from `./FloatingPopup.module.scss`: Module CSS for styling the FloatingPopup component.

## Structure

### Interfaces

- `IFloatingPopupContext`: Defines the context shape for the FloatingPopup, which includes:
  - `onClose`: Function to close the popup.
  - `setTranslateY`: Function to set the vertical translation of the popup content.

- `IFloatingPopupProps`: Defines the props accepted by the FloatingPopup component:
  - `children`: ReactNode, the content inside the popup.
  - `onClose`: Function to close the popup.
  - `bodyClass`, `containerClass`, `contentClass`, `footerClass`: Optional CSS class names for various parts of the popup.
  - `disableOutsideClick`: Optional boolean to disable closing the popup when clicking outside.
  - `footerContent`: Optional JSX.Element to be rendered in the footer.
  - `hasFooterShadow`: Optional boolean to add a shadow effect to the footer.
  - `id`: Optional string to assign an ID to the popup element.
  - `swipeable`: Optional boolean indicating if the popup content is swipeable.

### Component Definition

`FloatingPopup` is a functional component utilizing React's functional component (FC) type, tailored for handling popups differently based on the viewport. It uses state and context to manage its behavior and appearance.

## Logic

1. **Viewport Check**: The `useMobileViewport` hook determines if the current viewport is mobile-sized, which influences the popup's behavior and styling.

2. **State Management**: The `useState` hook initializes `translateY` to control the vertical position of the popup content.

3. **Context Provision**: The `useMemo` hook creates a memoized context value containing `setTranslateY` and `onClose`, which are provided to the `FloatingPopupContext`.

4. **Conditional Styling**: The `classNames` utility is used to dynamically apply CSS classes based on the component's props and state:
   - `contentClass` is combined with default styles and conditionally with swipeable styles.
   - `bodyClass` and `footerClass` are merged with default styles, and `footerClass` additionally gets a shadow style if `hasFooterShadow` is true.

5. **Popup Component Usage**: The `Popup` component is used to render the actual popup, passing all necessary props and styles. It adapts based on the viewport (centered on desktop, floating on mobile) and handles user interactions like closing on outside clicks if not disabled.

6. **Children Wrapping**: The `children` of `FloatingPopup` are wrapped in a `FloatingPopupContext.Provider` to allow nested components to access the popup's context, such as `onClose` and `setTranslateY`.

This component effectively manages a popup's appearance and behavior, making it versatile for different devices and user interactions.