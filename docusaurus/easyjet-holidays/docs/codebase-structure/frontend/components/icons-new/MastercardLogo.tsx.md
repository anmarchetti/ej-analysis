### Imports

The code begins by importing necessary modules and libraries:

- `* as React`: This import brings in React library functionalities, which are essential for defining the component as a React functional component.
- `classNames`: Imported from `classnames` library, this utility function is used to conditionally join class names together. It's used here to handle conditional class assignment based on the component's `props`.

### Structure

The component `SvgMastercardLogo` is a functional React component that renders an SVG element representing the Mastercard logo. It uses TypeScript for type safety, specifically annotating `props` with `React.SVGProps<SVGSVGElement>` to ensure the props match the expected types for an SVG element in React.

#### SVG Element

- **Attributes**:
  - `version`, `xmlns`, `viewBox`, `fill`, `xmlSpace`: These attributes define the SVG's version, XML namespace, the view area of the SVG, the fill behavior, and how white spaces in text content should be handled.
  - `className`: Dynamically assigned using the `classNames` function based on the passed `props.className`.
  - `data-tid`: Custom data attribute for testing, with a fallback default value of 'Mastercard'.

#### Title and Groups

- **Title**: The `<title>` tag provides a text description of the SVG, which is "Mastercard Logo".
  
- **Graphics (`<g>` element)**:
  - Contains multiple `<path>` elements each defining parts of the Mastercard logo with specific `fill`, `fillRule`, and `clipRule` attributes.
  - A `clipPath` is used, referenced by `clip0_311_1320`, to clip parts of the SVG elements according to the defined path.

#### Definitions (`<defs>` and `<clipPath>`)

- Defines a `clipPath` with an id that is referenced by elements within the SVG to control the visible region of the SVG elements.

### Logic

The component is straightforward in terms of logic:

- **Conditional Class Assignment**: The `className` for the `<svg>` element is assigned based on `props.className` using the `classNames` utility. This allows for flexible styling integration with external CSS.
  
- **Default Prop Values**: The `data-tid` attribute is given a default value of 'Mastercard' if not provided in the `props`, ensuring a consistent identifier for testing purposes.

- **Rendering**: The component solely focuses on rendering the SVG based on the provided props without any internal state or lifecycle methods, making it a pure presentation component.

This component is designed to be reusable wherever a Mastercard logo is needed within a React application, with customizable class names and test identifiers for enhanced maintainability and testability.