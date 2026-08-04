## Imports

The code imports several modules and utilities necessary for its operation:

- `React`: Imports the base React library to enable the use of JSX and other React features.
- `classNames`: A utility function from the `classnames` package that is used to conditionally join class names together.

## Structure

The component `SvgFlightTrackerLined` is a functional React component that returns an SVG element. It is designed to be reusable and configurable through props.

### Component Properties

- `props: React.SVGProps<SVGSVGElement>`: The component accepts all standard properties applicable to SVG elements through React's type definitions. This allows for flexibility and extensibility in using the SVG component with various SVG-specific properties.

### SVG Element

- The `svg` element is set up with predefined `viewBox`, `width`, and `height` attributes to control its scaling and positioning.
- `aria-hidden='true'` and `focusable='false'` are used to enhance accessibility by informing assistive technologies that this SVG is purely decorative.
- `data-tid`: A custom data attribute for test identification, which defaults to 'flight-tracker-lined-icon' if not provided.
- `className`: Uses the `classNames` utility to combine 'icon-svg' with any custom classes passed via `props.className`.

### Paths

- Two `<path>` elements define the graphical content of the SVG. These paths use the `d` attribute to describe the shape of the graphic in the SVG coordinate system.

## Logic

### Default Properties

- The component uses a logical OR (`??`) to provide a default value for `data-tid` if it is not specified in the props. This ensures that the element can always be identified in testing environments.

### Class Name Handling

- The `className` for the SVG element is constructed using the `classNames` function, which merges 'icon-svg' with any additional classes provided via `props.className`. This approach allows for flexible styling of the component without modifying the internal structure.

### Rendering

- The component is purely presentational and does not manage any internal state or lifecycle methods. It directly returns the SVG element configured with the properties and attributes passed to it, making it lightweight and fast for rendering graphical icons in a React application.

### Export

- The component is exported as `default`, allowing it to be imported with any name in other parts of the application. This is typical for components that are expected to be used widely across a project.