## Imports

The code begins by importing necessary modules and libraries:

- `React` from the `react` package is used to leverage React functionalities including the creation of the component.
- `classNames` from the `classnames` package, a utility function that conditionally joins class names together, which is useful for applying conditional classes to React elements.

## Structure

The code defines a React functional component named `SvgExtrasLined` that accepts props of type `React.SVGProps<SVGSVGElement>`. This type is a TypeScript generic that helps in ensuring the props adhere to valid properties for an SVG element.

The component returns an SVG element structured as follows:

- **SVG Container**: The `<svg>` element is defined with several attributes:
  - `viewBox` set to "1 1 22 22", which specifies the position and dimension of the SVG canvas.
  - `width` and `height` both set to '1em', making the size of the SVG responsive to the font-size of its context.
  - `aria-hidden="true"` and `focusable="false"` attributes improve accessibility by hiding the SVG from screen readers and preventing it from being focusable.
  - `data-tid` is a custom data attribute for test identification, with a fallback to 'extras-lined-icon' if not provided.
  - `className` applies CSS classes where 'icon-svg' is a constant class, and `props.className` is an optional additional class passed via props.

- **SVG Paths**: Contains two `<path>` elements each defining part of the SVG's shape:
  - The first path creates a plus-shaped figure within the SVG.
  - The second path outlines a circle and uses a mask to create a border effect around the SVG.

## Logic

- **Conditional Class Names**: The `className` attribute of the SVG uses the `classNames` function to merge 'icon-svg' with any additional classes provided through `props.className`. This allows for flexible styling.
- **Default Prop Values**: The `data-tid` attribute uses a logical nullish assignment (`??`) to provide a default value ('extras-lined-icon') if `props['data-tid']` is not explicitly passed to the component. This ensures that the SVG can always be identified in testing environments.

In summary, `SvgExtrasLined` is a reusable and accessible SVG component styled dynamically via props, with built-in testing support through customizable data attributes. It is designed to scale based on its surrounding font size, making it versatile for various UI contexts.