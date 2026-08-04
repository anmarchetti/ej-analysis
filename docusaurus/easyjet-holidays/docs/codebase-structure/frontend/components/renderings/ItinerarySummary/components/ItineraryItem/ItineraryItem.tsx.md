### Imports

The `ItineraryItem` component uses several imports:

- **React Imports:**
  - `FC` (Function Component) and `ReactNode` from the `react` library are used to define the component type and the type for children and icon props respectively.
  
- **Sitecore JSS Next.js:**
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` is used to render text fields from Sitecore, supporting inline editing and internationalization.
  
- **Classnames Utility:**
  - `classnames` is a utility to conditionally join class names together, used here for dynamic styling based on component state.
  
- **Custom Models and Components:**
  - `ISitecoreField` is an interface from `models/sitecore/generic/ISitecoreField` that represents a generic field from Sitecore.
  - `Button` is a custom component from `frontend/components/common/Button` used for rendering buttons.
  - `SvgChevronDown` is an SVG icon component from `frontend/components/icons-new/ChevronDown` used as an icon in the expand button.
  
- **SCSS Module:**
  - `styles` from `./ItineraryItem.module.scss` contains CSS modules for scoped styles.

### Structure

The `ItineraryItem` component is structured as follows:

- **Props:**
  - Defined by `TItineraryItemProps` type, which includes:
    - `children`: Content to be rendered inside the item.
    - `icon`: Icon to be displayed next to the item title.
    - `isExpanded`: Boolean indicating if the item content is expanded.
    - `setExpanded`: Function to toggle the expanded state.
    - `title`: Sitecore field for the item title.
    - Optional props for expandability, custom class names, and UI behaviors like `canExpand`, `className`, `hideSeparator`, and `isGreyedOut`.

- **JSX Structure:**
  - The top-level `div` uses `data-tid` attribute for testing purposes and combines several classes for styling.
  - Icon and title are rendered at the top of the component.
  - The content (`children`) is conditionally rendered based on `isExpanded` or `isGreyedOut`.
  - An expand button is optionally rendered if `canExpand` is true, which toggles the `isExpanded` state on click.
  - A vertical separator is conditionally rendered based on the `hideSeparator` prop.

### Logic

- **Conditional Styling:**
  - The `classnames` function is used extensively to apply conditional styles based on the component's state, such as `isGreyedOut` and `isExpanded`.
  
- **Expand/Collapse Functionality:**
  - The expand button toggles the `isExpanded` state of the component, which controls the visibility of the content and the rotation of the chevron icon.
  
- **Visibility Conditions:**
  - The content and the expand button's visibility are controlled by `isExpanded`, `isGreyedOut`, and `canExpand` props.
  
- **Accessibility and Testing:**
  - `data-tid` attributes are used throughout the component to facilitate easier testing and ensure that each part of the component can be uniquely identified in test scripts.

This documentation provides a clear overview of the `ItineraryItem` component's dependencies, structure, and logic, aiding in understanding, maintaining, and testing the component.