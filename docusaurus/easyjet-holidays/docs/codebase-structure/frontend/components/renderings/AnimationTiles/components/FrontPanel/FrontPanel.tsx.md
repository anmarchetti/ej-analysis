## Imports

The code imports various modules and components that are necessary for the functionality of the `FrontPanel` component:

- `FC` from `react`: The `FC` (Functional Component) type from React is used to type the component.
- `Text` from `@sitecore-jss/sitecore-jss-nextjs`: Used to render text fields from Sitecore in a React component.
- `observer` from `mobx-react`: Enhances the component to react to changes in MobX store state.
- `useStore` from `frontend/hooks/useStore`: Custom hook to access MobX stores.
- `MediaSize` from `models/data/MediaSizeParams`: Enum or object containing media size parameters which might be used for responsive design.
- `ISitecoreField`, `ISitecoreImage` from `models/sitecore/generic/ISitecoreField`: Interfaces defining the structure for Sitecore fields and images.
- `JSSImageNext` from `frontend/components/common/JSSImageNext/JSSImageNext`: A component to render images using Sitecore JSS and Next.js optimizations.
- `SvgChevronUp` from `frontend/components/icons-new/ChevronUp`: React component for rendering an SVG chevron-up icon.
- `styles` from `./FrontPanel.module.scss`: Module CSS for styling the `FrontPanel` component.

## Structure

The `FrontPanel` component is structured as follows:

- **Props Interface (`IFrontPanelProps`)**: Defines the types for the props the component expects. It includes Sitecore fields for an icon, an image, text for "more" details, a title, and an `onClick` event handler function.
- **Constant (`ICONS_SIZE`)**: Specifies a fixed size (90) used for the icon dimensions.
- **Functional Component Definition (`FrontPanel`)**: A functional component that takes `IFrontPanelProps` as props and renders a button which includes:
  - A background image (if provided and not in edit mode).
  - An icon (if provided).
  - A title (if provided).
  - A "more details" section with text and an SVG chevron-up icon (if more text is provided).

## Logic

The component's logic includes:

- **MobX Store Usage**: Utilizes `useStore` to derive `isEditMode` from the `layoutStore`. This value is used to conditionally render the background image only when not in edit mode.
- **Conditional Rendering**:
  - The background image is only rendered if the `Image` prop has a value and the component is not in edit mode.
  - The icon is rendered if the `Icon` prop has a value.
  - The title is rendered if the `Title` prop has a value.
  - The "more" text and icon are rendered together if the `MoreText` prop has a value.
- **Event Handling**:
  - The entire component is wrapped in a `button` element that triggers the `onClick` function passed via props when clicked.
- **Styling**:
  - Utilizes CSS modules for scoped styling, referenced by `styles` and applied to various elements within the component.
- **Data Attributes**:
  - Custom `data-tid` attributes are used for testing or as identifiers in the DOM structure, aiding in both testing and specific styling hooks.

The component is wrapped with `observer` from MobX, making it reactive to changes in the MobX state that affect the rendering of its content.