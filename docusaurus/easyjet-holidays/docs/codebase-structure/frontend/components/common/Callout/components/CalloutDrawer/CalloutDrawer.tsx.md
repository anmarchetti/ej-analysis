### Imports

The `CalloutDrawer` component makes use of several imports:

- **React and Related Imports**:
  - `FC` from `react`: Used to define the functional component type.
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs`: A Sitecore utility for rendering text fields.

- **Utility and Helper Imports**:
  - `classNames` from `classnames`: A utility to conditionally join class names together.
  - `useStore` from `frontend/hooks/useStore`: A custom hook for accessing the application's store.

- **Models and Interfaces**:
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary`: An enumeration that likely contains constant keys for dictionary items in Sitecore.
  - `ISitecoreField` from `models/sitecore/generic/ISitecoreField`: An interface representing a generic Sitecore field.

- **Component Imports**:
  - `Button` from `frontend/components/common/Button`: A reusable button component.
  - `SwipeableContent` and `FloatingPopup` from `frontend/components/common/FloatingPopup`: Components that provide modal and swipeable interfaces.

- **Styling**:
  - `styles` from `./CalloutDrawer.module.scss`: Module CSS for styling the `CalloutDrawer` component.

### Structure

The `CalloutDrawer` component is structured as follows:

- **Props**:
  - `ICalloutDrawerProps` interface defines the props accepted by the component, including callbacks, children, and optional styling and behavior flags.

- **Functional Component Definition**:
  - `CalloutDrawer` is a functional component utilizing destructured props for easy access.
  - Utilizes a custom hook `useStore` to fetch phrases from the store, specifically for localization or text management.

- **JSX Structure**:
  - The component renders a `FloatingPopup` which contains:
    - A `SwipeableContent` that wraps a `Text` component for the title.
    - A div that serves as a container for any children passed to the component.
    - A `Button` in the footer, which uses dynamic class names and an event handler for closing the drawer.

### Logic

- **Phrase Management**:
  - `getPhrase` is fetched from `useStore` and is used to get localized text for the close button using a key from `SitecoreDictionary`.

- **Styling and Class Management**:
  - `classNames` utility is used extensively to conditionally apply CSS classes based on the props such as `isCTAOutlined` and `footerClassName`.

- **Component Composition**:
  - `FloatingPopup` is used as the main container, with swipeable functionality enabled.
  - The title is rendered using the `Text` component from Sitecore JSS, which is designed to handle Sitecore-managed fields.
  - The close button dynamically adjusts its outlined style based on `isCTAOutlined`.

- **Accessibility and Data Attributes**:
  - Data attributes like `data-tid` are used within the component for testing purposes, ensuring elements can be easily targeted in tests.

This documentation outlines the key aspects of the `CalloutDrawer` component, focusing on its imports, structure, and the logic behind its rendering and behavior.