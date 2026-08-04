## Imports

The code imports the following dependencies:

- `React`: This is the base library from the React.js framework, which is used for building user interfaces.
- `classNames`: A utility function from the `classnames` package that is used to conditionally join class names together.

## Structure

The component `SvgDepositLined` is a functional component in React that returns an SVG element. The properties of the component are typed with `React.SVGProps<SVGSVGElement>`, which ensures that the props passed to the component are valid SVG properties.

Here is a breakdown of the SVG component's structure:

- **SVG Container**: The main container of the SVG with several attributes:
  - `viewBox`: Defines the position and dimension of the SVG view.
  - `width` and `height`: Set to `'1em'` to scale based on the font size of the element.
  - `aria-hidden`: Set to `true` to hide the SVG from screen readers.
  - `focusable`: Set to `false` to prevent SVG from being focusable.
  - `data-tid`: A custom data attribute for test identification, using a fallback value if not provided.
  - `className`: Uses the `classNames` function to combine 'icon-svg' with any className passed via props.

- **SVG Children**: Contains multiple `<path>` and `<rect>` elements that define the visual parts of the SVG.

## Logic

- **Conditional Attributes**: The `data-tid` attribute is conditionally set based on whether it is passed in the props, with a default value of `'deposit-lined-icon'`.
- **Dynamic Class Names**: The `className` attribute dynamically combines a default class `'icon-svg'` with any custom class provided through `props.className` using the `classNames` utility.

This component is mainly used for displaying a stylized deposit icon, where styling and behavioral properties can be customized via props. The use of SVG specific props and conditional logic for attributes makes it flexible for various use cases within a React application.