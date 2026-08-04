### Imports

The code begins by importing necessary modules and libraries:

- `React`: The React base library is imported to enable JSX syntax and use React features.
- `classNames`: A utility function from the `classnames` library, which is used to conditionally join class names together.

### Structure

The `SvgSuccessLined` component is a functional component that takes `props` as an argument. These props are of type `React.SVGProps<SVGSVGElement>`, which is a TypeScript generic type provided by the React library to type-check the props specific to SVG elements.

The component returns an SVG element structured as follows:

- **SVG Container**: The main container has several attributes:
  - `viewBox` set to '1 1 22 22', controlling the scaling of the SVG content.
  - `width` and `height` both set to '1em', making the size relative to the current font size.
  - `aria-hidden='true'` and `focusable='false'` to improve accessibility by hiding the SVG from screen readers and preventing it from being focusable.
  - `data-tid`: A custom data attribute for testing, which defaults to 'success-lined-icon' if not provided in the props.
  - `className`: Uses the `classNames` function to combine 'icon-svg' with any className provided through props.

- **SVG Paths**: There are two `<path>` elements describing the shapes within the SVG:
  - The first path defines a circle with a radius of 10 centered at (12,12).
  - The second path describes a checkmark shape, utilizing a sequence of line commands to create the iconic tick.

### Logic

The logic within this component primarily revolves around handling and setting SVG attributes dynamically:

- **Conditional Attributes**: The `data-tid` attribute shows how default properties can be set. If `props['data-tid']` is not provided, it defaults to 'success-lined-icon'.
  
- **Dynamic Class Names**: The `className` attribute of the SVG uses the `classNames` utility to merge a default class 'icon-svg' with any additional classes passed through the component's props. This is useful for styling the SVG differently in various contexts without altering the core component code.

- **Accessibility Features**: By setting `aria-hidden` to 'true' and `focusable` to 'false', the SVG is made more accessible, as it is indicated to be purely decorative and not part of the interactive or critical content.

This structure and logic make `SvgSuccessLined` a reusable and customizable SVG component suitable for displaying a success icon across different parts of a web application.