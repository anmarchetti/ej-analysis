## Imports

The `BreadcrumbsStatic` component utilizes several imports to function:

- **React and Sitecore JSS**: The component is built using React (`React`, `FC` from `react`) and Sitecore JSS (`Text` from `@sitecore-jss/sitecore-jss-nextjs`), which facilitates integration with the Sitecore CMS.
- **Classnames**: Utilized for conditional class assignment (`classnames`).
- **MobX**: The component is wrapped with `observer` from `mobx-react` to enable reactive data-driven rendering.
- **Utility Functions and Models**: Several utility functions and models are imported to handle Sitecore-specific logic and data types:
  - `isSitecoreCheckboxSelected` from `frontend/utils/sitecore.utils` checks if a checkbox field in Sitecore is selected.
  - Several models (`SitePath`, `ISitecoreComponent`, `ISitecoreField`, `ISitecoreLink`, `TSitecoreCheckboxValue`) define TypeScript types and interfaces for structured data management.
- **Components**: Custom components (`Link`, `RouterLink`, `SvgChevronRight`, `SvgHomeLined`) are used for navigation and displaying icons.
- **Styles**: SCSS module for styling (`styles` from `./BreadcrumbsStatic.module.scss`).

## Structure

### Component Interfaces

- **`IBreadcrumb`**: Represents a single breadcrumb item containing `fields` for `Link` and `Text`, and an `id`.
- **`IBreadcrumbsStaticFields`**: Contains an array of `IBreadcrumb` items.
- **`IBreadcrumbsStaticParams`**: Contains parameters to control the display features of the breadcrumbs such as visibility of the home icon, opacity, shadow, and whether it is wrapped.
- **`TBreadcrumbsStaticProps`**: Combines the fields and parameters into a single type extending a generic `ISitecoreComponent`.

### Main Component

The `BreadcrumbsStatic` component is a functional component typed with `TBreadcrumbsStaticProps`. It uses destructuring to extract `params` and `fields` from the props.

### Styling

Conditional styling is applied using the `classNames` function to manage classes based on the component parameters (e.g., `isOpaque`, `isShadowed`). The `styles` object imported from the SCSS module is used to reference CSS classes.

## Logic

1. **Parameter Checks**: The component begins by evaluating the `params` object to determine the styling and features to apply:
   - `isOpaque`, `isHomeIconShown`, `isWrapped`, and `isShadowed` are boolean values derived from the Sitecore checkbox fields using the `isSitecoreCheckboxSelected` utility function.
   
2. **Conditional Rendering**:
   - If `fields` is undefined or contains no items, the component returns `null`, effectively rendering nothing.
   - The `className` constructed with `classNames` is applied to the `<ul>` element based on the `isOpaque` and `isShadowed` conditions.

3. **Breadcrumb Items Rendering**:
   - If `isHomeIconShown` is true, a home icon linked to `SitePath.Home` is rendered first.
   - Each breadcrumb item is rendered within a `<li>` tag. If it is not the last item, it is rendered as a `RouterLink`; otherwise, it is rendered as a span with the current page's text.
   - A chevron icon (`SvgChevronRight`) is displayed between breadcrumb items unless it is the first item or the home icon is not shown.

The component is wrapped with `observer` from MobX, making it reactive to changes in observable data used within the component, such as data fetched from Sitecore.