### Imports
The code begins by importing necessary modules and libraries:

- `React` from the `react` package is imported to enable JSX syntax and the use of React components.
- `classNames` from the `classnames` package is used to conditionally join class names together based on the conditions provided.

### Structure
The component `SvgDepartureLined` is defined as a functional component that accepts `props` of type `React.SVGProps<SVGSVGElement>`. This ensures that the props adhere to the types expected for SVG elements in React.

The component returns an SVG element structured as follows:

- **SVG Container**: The main container with several attributes:
  - `viewBox` set to '1 1 22 22' to establish the viewing area of the SVG.
  - `width` and `height` both set to '1em' to maintain scalability based on font size.
  - `aria-hidden` set to 'true' to hide the SVG from screen readers.
  - `focusable` set to 'false' to prevent SVG from being focusable.
  - `data-tid` is a custom data attribute for test identification, defaulting to 'departure-lined-icon' if not provided in the props.
  - `className` combines 'icon-svg' with any class passed through `props.className` using the `classNames` utility.

- **Path Element**: Contains the `d` attribute which holds the SVG path commands for drawing the icon. This path represents the graphical content of the SVG.

### Logic
The component primarily focuses on rendering an SVG with specific attributes and styles:

- **Conditional Class Names**: The `className` of the SVG element is dynamically generated using the `classNames` function. This function combines a default class 'icon-svg' with any additional classes provided through `props.className`.

- **Default Properties**: The `data-tid` attribute uses a logical nullish assignment (`??`) to provide a default value of 'departure-lined-icon' if it is not explicitly provided in the props.

- **SVG Path**: The `d` attribute of the `path` element contains a string that defines the shape and structure of the SVG icon. This string is a series of commands that instruct how to move the pen in the SVG canvas to draw the icon.

This component is designed to be reusable and easily styled via CSS, making it suitable for various applications where an icon is needed within a UI. The use of TypeScript for props validation ensures that the component is used correctly within a type-safe environment.