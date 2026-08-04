### Imports

The CrisisBannerPopup component imports several modules and components to facilitate its functionality:

- **React Essentials**: Imports `FunctionComponent` and `ReactNode` from `react` to define the component type and accept any valid React node as props.
- **Custom Hooks**: Utilizes `useMobileViewport` from `frontend/hooks/useMediaQuery` to determine if the viewport is mobile-sized.
- **Sitecore Models**: Imports `ISitecoreField` from `models/sitecore/generic/ISitecoreField` to handle typed Sitecore fields.
- **Common Components**: Imports `Button`, `Drawer`, and `Popup` from `frontend/components/common` to use these UI components within the popup.
- **Styling**: Imports specific SCSS module styles from `./CrisisBannerPopup.module.scss` for custom styling of the popup component.

### Structure

The `CrisisBannerPopup` component is structured as follows:

- **Interface `ICrisisBannerPopupProps`**: Defines the props that the `CrisisBannerPopup` component expects:
  - `content`: A `ReactNode` to display as the content of the popup.
  - `ctaCloseButtonLabel` and `ctaCloseButtonScreenReaderLabel`: `ISitecoreField<string>` types for accessibility and display purposes.
  - `onClose`: A function to handle the closure of the popup.
  - `open`: A boolean that controls the visibility of the popup.
  
- **Functional Component Definition**: The `CrisisBannerPopup` is a functional component that uses destructured props for easier access and readability.

### Logic

The component's logic is primarily concerned with responsive behavior and rendering based on the `open` prop:

- **Mobile Viewport Check**: Uses the `useMobileViewport` hook to determine if the device has a mobile viewport. If true, it renders a `Drawer` component; otherwise, it renders a `Popup` component for larger screens.
  
- **Mobile Rendering**:
  - A `Drawer` is used when the viewport is mobile-sized. It displays the `content` passed as a prop.
  - A `Button` within a `div` with class `drawer__actions` allows users to close the drawer. The button's accessibility label and text are derived from `ctaCloseButtonLabel` and `ctaCloseButtonScreenReaderLabel`.
  
- **Desktop Rendering**:
  - The `Popup` component is rendered if the `open` prop is true and the viewport is not mobile-sized.
  - Similar to the mobile version, it includes a `Button` that serves as the close control with accessibility features.
  - The `Popup` also receives a `bodyClass` for styling, defined in the imported `styles`.

- **Conditional Rendering**: If the `open` prop is false and the viewport is not mobile-sized, the component returns `null`, making nothing render on the screen.

This structure ensures that the `CrisisBannerPopup` component is responsive and accessible, with clear separation of concerns and reusable UI components.