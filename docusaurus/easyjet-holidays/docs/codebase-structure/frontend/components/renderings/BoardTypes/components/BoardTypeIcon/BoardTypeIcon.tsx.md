## Imports

The code imports several JavaScript and TypeScript entities which are essential for its operation:

- `classNames`: A utility function from the `classnames` library, used for conditionally joining class names together.
- `cmsUrls`: Specifically imports `cmsUrls` from a module located at `code/endpoints`. This object likely contains various URL configurations for the CMS (Content Management System).
- `SvgFullBoard`: A React component imported from `frontend/components/icons-new/FullBoard`. This component renders an SVG icon representing a "Full Board".

## Structure

The code defines a TypeScript interface `IBoardTypeIconProps` and a functional React component `BoardTypeIcon`:

### IBoardTypeIconProps Interface
This interface describes the props that the `BoardTypeIcon` component expects:
- `className`: An optional string that allows custom class names to be passed to the component for CSS styling.
- `iconUrl`: An optional string that should provide the URL to a specific icon image.

### BoardTypeIcon Component
`BoardTypeIcon` is a functional React component that utilizes destructuring to extract `iconUrl` and `className` from its props. The component returns one of two possible JSX elements based on the presence of `iconUrl`:
- If `iconUrl` is provided, it returns a `<span>` element with a background image styled with the URL processed by `cmsUrls.media(iconUrl)`.
- If `iconUrl` is not provided, it returns the `SvgFullBoard` component, passing along the `className` prop if available.

## Logic

The component's rendering behavior is conditional based on the `iconUrl` prop:
- **With `iconUrl`**: The component constructs a full URL to the media by calling `cmsUrls.media(iconUrl)`, which is then used to set the CSS `backgroundImage` style of a `<span>` element. This element also receives any additional classes defined by `className` through the `classNames` function, which ensures that the `icon--bg-image` class is always applied.
- **Without `iconUrl`**: The `SvgFullBoard` component is rendered instead, receiving the `className` prop. This serves as a fallback when no `iconUrl` is provided, ensuring that there is always an icon displayed.

This structure and logic enable the `BoardTypeIcon` component to be versatile and reusable in different parts of an application where an icon representing "Full Board" needs to be displayed, with optional customization through CSS classes.