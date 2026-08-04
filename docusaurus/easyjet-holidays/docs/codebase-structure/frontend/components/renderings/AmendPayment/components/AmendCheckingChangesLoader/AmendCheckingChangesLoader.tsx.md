## Imports

The code imports several modules and components necessary for its functionality:

- `useEffect` from `react`: A React hook used for performing side effects in function components.
- `setBodyOverflow` from `frontend/utils/ui.utils`: A utility function likely used to control the overflow property of the body element in the DOM.
- `IconLock` from `frontend/components/icons/Lock`: A React component that renders an icon, specifically a lock icon in this context.
- `styles` from `./AmendCheckingChangesLoader.module.scss`: Module CSS for styling the `AmendCheckingChangesLoader` component, scoped to prevent conflicts with other styles.

## Structure

The component `AmendCheckingChangesLoader` is structured as follows:

- **Props Interface (`IAmendCheckingChangesLoaderProps`)**: Defines the shape of the props that the component expects. It includes optional properties:
  - `description` (string): Text providing additional details.
  - `header` (string): Text for the header or title of the loader.
  - `icon` (JSX.Element): A React element for rendering an icon, defaulted to `IconLock` if not provided.

- **Component Definition (`AmendCheckingChangesLoader`)**:
  - The component uses destructuring to extract `header`, `description`, and `icon` from its props, with `icon` defaulting to `<IconLock />` if not provided.
  - The component's return value is JSX that structures the visual representation of the loader, including conditionally rendered text and the icon.

## Logic

The component's logic revolves around two main functionalities:

1. **Handling Body Overflow**:
   - Within a `useEffect` hook, `setBodyOverflow('hidden')` is called when the component mounts to prevent scrolling on the page.
   - The cleanup function of `useEffect` resets the overflow property by calling `setBodyOverflow('')` when the component unmounts. This ensures that page scrolling is restored after the loader is removed.

2. **Conditional Rendering**:
   - The component conditionally renders elements based on the presence of `header` and `description` props.
   - If either `header` or `description` is provided, a containing `<div>` for text is rendered. Inside this `<div>`, the `header` and `description` are conditionally rendered as paragraphs only if they exist.
   - The `icon` is always rendered within a dedicated container, which is styled and positioned appropriately according to the accompanying SCSS module.

The combination of these functionalities ensures that the loader provides a user-friendly and visually consistent way to indicate loading or processing states, especially when checking for changes, as suggested by the component's name.