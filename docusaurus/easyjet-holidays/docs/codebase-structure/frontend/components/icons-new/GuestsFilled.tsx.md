### Imports

The component imports the following dependencies:

- `React` from the `react` library: This is used to leverage React's capabilities in defining the component.
- `classNames` from the `classnames` library: This utility function is used to conditionally join class names together, which is particularly useful for dynamically setting the classes based on the component's props.

### Structure

The `SvgGuestsFilled` component is a functional component that takes `props` of type `React.SVGProps<SVGSVGElement>` and returns a JSX element. The component is structured as follows:

- **SVG Element**: The root element is an `<svg>` tag with several attributes:
  - `viewBox` set to "0 0 24 24" which defines the position and dimension of the SVG viewport.
  - `width` and `height` both set to '1em', making the SVG size responsive to the font size of its context.
  - `aria-hidden` set to 'true' to indicate that this SVG is purely decorative and should be hidden from accessibility tools.
  - `focusable` set to 'false', preventing it from receiving keyboard focus.
  - `data-tid` attribute for test identification, which defaults to 'guests-filled-icon' if not provided in the props.
  - `className` which combines a default class 'icon-svg' with any className provided via props using the `classNames` function.

- **Path Elements**: There are two `<path>` elements within the SVG, each defined by a `d` attribute that contains the path commands for drawing the shapes within the SVG.

### Logic

The component's logic primarily revolves around handling and setting SVG attributes:

- **Conditional Attributes**: The `data-tid` attribute is set conditionally based on `props['data-tid']`. If it is not provided, it defaults to 'guests-filled-icon'.
- **Dynamic Class Names**: The `className` attribute on the `<svg>` element is dynamically set using the `classNames` utility. It always includes 'icon-svg' and additionally includes any class passed through `props.className`.
- **Fixed and Dynamic SVG Properties**: The component has fixed properties such as `viewBox`, `width`, and `height` that define the overall size and viewable area of the SVG. Other properties like `data-tid` and `className` are dynamically adjusted based on the inputs provided to the component through `props`.

This structure and logic facilitate the reuse and customization of the SVG icon in different parts of an application, ensuring that it can adapt to varying requirements like accessibility and styling.