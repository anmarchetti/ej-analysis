### Imports

The component imports the following dependencies:

- `React` from the `react` package, which is used for creating the component and handling the SVG properties.
- `classNames` from the `classnames` package, which is a utility to conditionally join class names together.

### Structure

The `SvgInsuranceLined` component is a functional component that takes `props` as an argument. The `props` are typed with `React.SVGProps<SVGSVGElement>`, ensuring that the component correctly types the props as SVG properties.

The component returns an SVG element structured as follows:

- **SVG Container**: The main container has several attributes:
  - `viewBox` set to '1 1 22 22' to establish the viewing area of the SVG.
  - `width` and `height` both set to '1em', making the SVG size relative to the current font size.
  - `aria-hidden` set to 'true' to hide the SVG from screen readers, indicating it's purely decorative.
  - `focusable` set to 'false', preventing SVG from receiving focus.
  - `data-tid` is a custom data attribute for test identification, defaulting to 'insurance-lined-icon' if not provided.
  - `className` uses the `classNames` function to combine 'icon-svg' with any additional class provided via `props.className`.

- **SVG Paths**: There are two `<path>` elements defining the shape of the icon:
  1. The first path draws the outer shape of the icon and is dynamically influenced by the SVG's size and properties.
  2. The second path represents an internal design or feature within the icon, specifically formatted to act as a plus sign, indicating addition or more features.

### Logic

- **Default Properties**: The component uses the nullish coalescing operator (`??`) to provide a default value for `data-tid` if it is not included in the props.
- **Class Names**: The `classNames` function is used to dynamically generate the class name for the SVG element. It ensures that the SVG always has the 'icon-svg' class and any additional classes passed through `props.className`.
- **Accessibility**: By setting `aria-hidden` to 'true' and `focusable` to 'false', the SVG is made purely decorative, which aids in accessibility by not distracting screen reader users.

The component is structured to be reusable and customizable through props, making it suitable for various use cases where an SVG icon like this might be needed.