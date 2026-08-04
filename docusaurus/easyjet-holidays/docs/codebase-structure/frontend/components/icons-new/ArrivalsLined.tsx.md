### Imports

The code begins with importing necessary dependencies:

- `React` from the `react` package, which is essential for using JSX and React components.
- `classNames` from the `classnames` package, a utility to conditionally join class names together.

### Structure

The component defined in the code is `SvgArrivalsLined`. It is a functional component that takes `props` as an argument and returns an SVG element. The props argument is typed with `React.SVGProps<SVGSVGElement>`, specifying that it accepts all standard properties applicable to SVG elements in React, along with custom extensions.

Here's a breakdown of the SVG component structure:

- **ViewBox**: The `viewBox` attribute defines the position and dimension of the SVG canvas. It's set to '1 1 22 22'.
- **Dimensions**: Both `width` and `height` are set to '1em', making the size of the SVG relative to the font-size of its parent element.
- **Accessibility**: The attributes `aria-hidden='true'` and `focusable='false'` are used to indicate that the SVG is purely decorative and should be ignored by assistive technologies.
- **Data Attribute**: A custom data attribute `data-tid` is used, which defaults to 'arrivals-lined-icon' if not provided in the props.
- **Class Names**: The `className` attribute is dynamically set using the `classNames` utility, combining 'icon-svg' with any class passed through `props.className`.

### Logic

The SVG consists of a single `<path>` element that defines the shape to be drawn. The path's `d` attribute contains the commands for drawing the icon. Here's a brief overview of the logic and styling within the SVG:

- **Path Definition**: The `d` attribute of the `<path>` element contains a long string of commands that instructs how the path should be drawn. These commands move the cursor around the canvas and define lines and curves.
- **Styling and Behavior**: The visual styling (like fill, stroke) would typically be controlled via CSS. The SVG itself doesn't contain inline styles, which makes it flexible to be styled directly from an external stylesheet.
- **Conditional Rendering**: The SVG element uses the `classNames` function to conditionally apply classes, allowing for more control over styling based on the component's props.

This component is exported as a default export, meaning it can be imported without curly braces and with any name in other parts of the application.