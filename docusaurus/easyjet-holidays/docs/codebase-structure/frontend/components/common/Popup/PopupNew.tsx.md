## Imports

The `PopupNew` component uses several imports from both external libraries and internal modules:

- **React Specific**: 
  - `AriaAttributes, FC, ReactNode, useEffect, useRef` from `react` for basic React functionalities.
  - `createPortal` from `react-dom` for rendering children into a DOM node that exists outside the DOM hierarchy of the parent component.

- **Utility and Styling**:
  - `classNames` from `classnames` for dynamically setting class names.
  - `FocusTrap` from `focus-trap-react` to trap focus within the popup.

- **Custom Hooks and Utilities**:
  - `useUniqueId` from `frontend/hooks/useUniqueId` to generate a unique ID for the popup.
  - `lockBodyScroll, unLockBodyScroll` from `frontend/utils/ui.utils` to control body scroll behavior when the popup is open.

- **Component and Styles**:
  - `Dialog, { IDialogProps }` from `./Dialog` for the dialog component used inside the popup.
  - `styles` from `./PopupNew.module.scss` for CSS module styles specific to `PopupNew`.

## Structure

The `PopupNew` component is defined as a functional component using the `FC` type from React, with `IPopupNewProps` as its props type. The props extend `AriaAttributes` and selectively from `IDialogProps`, excluding `children` which is redefined within `IPopupNewProps`.

### Props Definition (`IPopupNewProps`)

- `children`: Can be a function returning `ReactNode` or a direct `ReactNode`.
- `onClose`: Function to call on closing the popup.
- `containerClass`, `dialogClass`: Optional custom CSS classes for styling.
- `disableFocusTrap`: If true, disables the focus trap feature.
- `footerContent`: Optional JSX.Element to render in the footer.
- `fullWidth`: Boolean to control the width of the popup.
- `id`: Optional custom ID for the popup; defaults to a unique ID.
- `showCloseButton`: Boolean to control the visibility of the close button.

### Component Layout

- **Focus Trap**: Ensures that focus is trapped within the popup for accessibility.
- **Modal Overlay**: A div that acts as the modal overlay, which can include a `Dialog` component or directly render `children`.
- **Portal**: Uses `createPortal` to render the popup into `modal-portal-root`.

## Logic

1. **Unique ID Generation**:
   - A unique ID is generated for the popup using `useUniqueId` hook, which ensures that each instance of the popup has a distinct identifier.

2. **Body Scroll Locking**:
   - On mounting, it locks the body scroll to prevent scrolling of the background content using `lockBodyScroll`.
   - On unmounting, it restores the scroll using `unLockBodyScroll`.

3. **Focus Management**:
   - If `disableFocusTrap` is not true, the focus is managed within the popup, with options for deactivation behaviors like closing the popup on escape key press or clicking outside.

4. **Conditional Rendering**:
   - Renders the `children` as a function or directly as nodes based on their type.
   - Optionally includes a `Dialog` component if `children` is not a function, passing necessary props and behaviors like close button visibility and onClose handling.

5. **Portal Rendering**:
   - The entire popup structure is rendered into a DOM node outside of the main app DOM tree for better modality control, using `createPortal`.

This component is highly configurable with several options for customization and is designed to handle focus management and accessibility automatically.