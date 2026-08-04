## Imports

The `ViewBookingComponentWrapper` component utilizes several external and internal modules:

- **React Imports:**
  - `FC` (Function Component) and `ReactNode` are imported from the React library to define functional component types and allowed children types respectively.

- **Sitecore JSS Next.js:**
  - `Text` is imported from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.

- **Classnames Utility:**
  - `classnames` is a utility to conditionally join classNames together.

- **Model Imports:**
  - `ISitecoreField` and `ISitecoreImage` are imported from `models/sitecore/generic/ISitecoreField` to type-check the props related to Sitecore fields and images.

- **Component Imports:**
  - `Button` and `JSSImageNext` are custom components imported from `frontend/components/common`.

- **Styling:**
  - SCSS module styles are imported from `./ViewBookingComponentWrapper.module.scss` for scoped component styling.

## Structure

The `ViewBookingComponentWrapper` is a functional React component that accepts several props to control its behavior and display:

- **Props:**
  - The component accepts various props such as `Icon`, `Title`, `Subtitle`, `PrimaryButtonText`, `SecondaryButtonText` for displaying content, and callback functions like `onPrimaryButtonClick` and `onSecondaryButtonClick` for handling button click events. It also accepts `children` and `bottomChildren` as ReactNode for flexibility in content inclusion.

- **Conditional Styling:**
  - The `useMasonryStyle` boolean prop allows conditional application of masonry-style layouts through dynamic className application using the `classnames` library.

- **Accessibility:**
  - Accessibility labels (`aria-label`) for buttons are managed through `PrimaryButtonScreenReaderText` and `SecondaryButtonScreenReaderText` props to enhance accessibility.

- **HTML Structure:**
  - The component structure includes a main `div` container with nested elements for titles, subtitles, icons, content, and buttons. It uses the `data-tid` attribute for testing purposes.

## Logic

- **Conditional Rendering:**
  - Buttons are conditionally rendered based on the existence of their respective text values (`PrimaryButtonText` and `SecondaryButtonText`). This prevents rendering empty button elements in the UI.

- **Event Handling:**
  - The `onClick` handlers for the primary and secondary buttons are mapped to the respective props `onPrimaryButtonClick` and `onSecondaryButtonClick`, allowing the parent component to define specific behaviors on button clicks.

- **Dynamic Class Application:**
  - Class names for the main container and buttons are dynamically applied using the `classnames` utility based on the `useMasonryStyle` prop and other conditions, providing flexible styling options based on the component usage context.

- **Image Handling:**
  - The `JSSImageNext` component is used for rendering images, with fixed dimensions passed as props, ensuring consistent rendering of icons.

This component is designed to be highly reusable and adaptable, suitable for various parts of a web application where a stylized section with optional buttons is needed.