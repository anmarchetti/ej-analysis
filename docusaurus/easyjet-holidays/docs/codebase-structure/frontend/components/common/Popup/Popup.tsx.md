## Imports

The component imports several modules and utilities to function properly:

- **React Modules**: Standard React imports including `useEffect` and `useRef` for handling component lifecycle and references.
- **createPortal from react-dom**: Used to render children into a DOM node that exists outside the DOM hierarchy of the parent component.
- **classNames**: A utility function for conditionally joining classNames together.
- **FocusTrap from focus-trap-react**: A component that traps focus within a specified element.
- **Custom Hooks and Utilities**:
  - `useUniqueId`: A custom hook presumably used to generate unique IDs for components.
  - `pick`: A utility function for object manipulation, likely used to filter object properties.
  - `lockBodyScroll` and `unLockBodyScroll`: Utility functions to prevent and allow body scrolling.
- **Enums and Models**:
  - `KeyboardKey`: Enum for keyboard keys to detect specific keyboard actions like ESC.
- **Component and Interface Imports**:
  - `Dialog` and `IDialogProps`: Custom Dialog component and its props interface.
  - `PopupCloseButton`: A button component specifically for closing the popup.

## Structure

The `Popup` component is a functional component utilizing TypeScript for prop type definitions. The component accepts a variety of props that control its behavior and appearance:

- **Styling and Classes**: Props like `containerClass`, `overlayClass`, and `bodyClass` allow custom class names to be passed for styling.
- **Behavioral Flags**: Such as `disableOutsideClick`, `isCentered`, `isFullWidth`, which dictate how the popup behaves.
- **Focus Management**: `initialFocus` and `disableReturnFocusOnUnmount` help manage focus behavior when the popup is opened or closed.
- **ID Handling**: `id` for custom ID and `useUniqueId` for generating a fallback ID.
- **Conditional Rendering and Features**:
  - `withPortal`: Determines whether to render the popup into a portal.
  - `wrapper`: An optional function to wrap the popup's children.
- **Nested Components**:
  - `PopupCloseButton` and `Dialog` are used within the popup for closing functionality and content display respectively.

## Logic

### Lifecycle and Event Management

1. **Body Scroll Lock**: When the popup is not a toast or nested inside another popup, it locks the body scroll.
2. **Escape Key Handling**: Adds an event listener to close the popup when the Escape key is pressed.
3. **Outside Click Handling**: Closes the popup if clicked outside, unless disabled or it's a toast popup.

### Cleanup on Unmount

- Removes the keydown event listener.
- Unlocks the body scroll if this popup is the last one open.
- Optionally returns focus to the element that was focused before the popup opened.

### Rendering

- **FocusTrap**: Ensures that focus remains within the popup while it's open. Configurable with props like `initialFocus` and `fallbackFocus`.
- **Conditional Portal Rendering**: Uses `createPortal` if `withPortal` is true, rendering the popup into a specified DOM node.
- **Overlay**: Renders an overlay div unless it is a toast popup, with optional class names passed through `overlayClass`.

### Additional Features

- **Close Button**: Conditionally renders a close button outside the main dialog area if specified.
- **Dynamic Class Application**: Uses `classNames` utility to apply classes conditionally based on the props, enhancing the flexibility of styling based on the popup's state or configuration.