## Imports

The `ExpandableBanner` component utilizes several imports:

- **React and FC**: Imports React and its `FC` (Functional Component) type for type-checking the component.
- **Text**: Imported from `@sitecore-jss/sitecore-jss-nextjs`, used for rendering text fields from Sitecore.
- **classNames**: A utility function from `classnames` package to conditionally join class names together.
- **useMobileViewport**: A custom hook from `frontend/hooks/useMediaQuery` to determine if the viewport is of mobile size.
- **ISitecoreField and ISitecoreImage**: TypeScript interfaces from `models/sitecore/generic/ISitecoreField` that define the types for fields and images used in Sitecore projects.
- **Button, ExpandableItem, JSSImage, RichTextWithLinks**: Custom React components from `frontend/components/common`.
- **styles**: Specific SCSS module for styling components imported from `./ExpandableBanner.module.scss`.

## Structure

The `ExpandableBanner` component is structured into the following main parts:

1. **Type Definitions**:
   - `IExpandableBannerProps`: Interface describing the expected props for the component, including optional and mandatory fields.

2. **Component Definition**:
   - The `ExpandableBanner` is a functional component that accepts props defined by `IExpandableBannerProps`.

3. **Conditional Rendering**:
   - The component checks if it is being viewed on a mobile device either through the `useMobileViewport` hook or via the `isMobileView` prop.

4. **Mobile View**:
   - In mobile view, the component uses the `ExpandableItem` component for displaying the content in an expandable format that includes an icon, title, and description.

5. **Desktop View**:
   - In non-mobile view, content is displayed more traditionally with a title, description, and optional button next to the icon.

## Logic

1. **Mobile Detection**:
   - Utilizes `useMobileViewport` hook combined with `isMobileView` prop to determine if the component should render in mobile view style.

2. **Expandable Functionality**:
   - Only in mobile view, `ExpandableItem` is used to allow users to expand or collapse the content section.

3. **Content Rendering**:
   - Both views utilize the `JSSImage` component to render the icon from Sitecore.
   - The title and description are rendered using `Text` and `RichTextWithLinks` components respectively, ensuring that rich text and links from Sitecore are handled correctly.

4. **Button Rendering**:
   - An optional button is rendered if `ButtonLabel` has a value. This button can trigger an action defined by the `onButtonClick` prop.

5. **Dynamic Class Names**:
   - Uses the `classNames` utility to dynamically assign CSS classes based on the props, allowing for customizable styles.

6. **Accessibility**:
   - Data attributes like `data-tid` are used for testing and ensuring accessibility by providing unique identifiers for elements.

This component is designed to be flexible and responsive, adapting its layout and functionality to accommodate different device sizes and user interactions.