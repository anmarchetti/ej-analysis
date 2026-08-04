### Imports

The component imports the following dependencies:

- `React` from the 'react' package is used to utilize React's functionalities in defining the component.
- `classNames` from the 'classnames' package is used to conditionally join class names together.

### Structure

`SvgPrinterLined` is a React functional component that accepts props of type `React.SVGProps<SVGSVGElement>`. This type defines the props as standard SVG properties applicable to an SVG element in React.

The component returns an SVG element configured as follows:
- **viewBox**: Defines the position and dimension of the SVG canvas.
- **width** and **height**: Set to '1em' making the SVG size flexible based on the font size of the element.
- **aria-hidden**: Set to 'true' to indicate that this SVG is purely decorative and should be hidden from accessibility APIs.
- **focusable**: Set to 'false' to prevent the SVG from being focusable.
- **data-tid**: A custom data attribute for testing, which defaults to 'printer-lined-icon' if not provided.
- **className**: Combines a default class 'icon-svg' with any className provided through props using `classNames`.

Inside the SVG, two `<path>` elements define the graphical content to be rendered. These paths represent the icon's design.

### Logic

The component utilizes the `classNames` function to handle dynamic class names:
- It always applies the 'icon-svg' class.
- It additionally applies any custom class passed through `props.className`.

The `data-tid` property is set for possible use in testing environments to target the SVG more easily. It defaults to 'printer-lined-icon' if no specific value is provided via props.

The SVG paths are hardcoded, which means the visual representation of the printer icon is fixed and does not adapt or change based on the input props beyond the class name and test ID. This setup is typical for reusable icon components in a UI library, where the icon's appearance should remain consistent across different usages.