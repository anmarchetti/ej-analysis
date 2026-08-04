## Imports

The `FullScreenPopup` component utilizes several imports:

- **React Imports**: 
  - `FC` (Function Component) and `useEffect` from `react` for component and lifecycle management.
- **Sitecore JSS Next.js**:
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.
- **Classnames Utility**:
  - `classnames` for conditionally joining class names together.
- **Utility Functions**:
  - `setBodyOverflow` from `frontend/utils/ui.utils` to control the body's overflow property.
- **Type Definitions**:
  - `ISitecoreField` from `models/sitecore/generic/ISitecoreField` for strong typing of Sitecore field properties.
- **Common Components**:
  - `Button` and `Popup` from `frontend/components/common` for reusable UI elements.
- **Icon Component**:
  - `IconChevronLeft` from `frontend/components/icons/ChevronLeft` for displaying a left-chevron icon.
- **Styling**:
  - SASS module `styles` from `./FullScreenPopup.module.scss` for specific styling of the component.

## Structure

The `FullScreenPopup` component is defined with the following structure:

- **Interface Definitions**:
  - `IFullScreenPopupFields`: Defines the shape of `fields` prop expected from Sitecore, containing `BackToLabel` and `BtnCancel`.
  - `IFullScreenPopupProps`: Defines all props the component accepts, including children, fields, and various flags and handlers for UI control.
- **Component Definition**:
  - The component is a functional component using React's `FC` for typing with `IFullScreenPopupProps` as its props type.

## Logic

The `FullScreenPopup` component incorporates several logical features:

- **Effect Hook**:
  - `useEffect` is used to set the body's overflow CSS property to 'hidden' when the component mounts and resets it when the component unmounts. This is dependent on the `isInitialized` prop to handle cases where the component might re-render or mount multiple times.
- **Conditional Rendering**:
  - The `Popup` component is used as a wrapper with several props to manage its behavior and appearance, such as `aria-label`, `isInnerPopup`, and `disableReturnFocusOnUnmount`.
  - Inside the `Popup`, there are two main areas:
    - **Navigation Bar**: Depending on the `isMobile` flag, it displays a close button with appropriate text and style. It also optionally includes additional navigation actions through `navigationActionBlock`.
    - **Main Content**: This is a flexible area meant to display any children passed to `FullScreenPopup`.
- **Styling**:
  - The component uses the `classnames` utility to conditionally apply styles based on the `isMobile` flag, ensuring the UI is responsive and adheres to mobile or desktop layouts appropriately.

This component is designed to be a versatile, reusable full-screen popup that can be customized with various content and navigational elements, suitable for a wide range of applications in a Sitecore-powered application.