## Imports

The component imports two libraries:

1. **React**: The entire React library is imported to enable the use of JSX and other React features within the component.
2. **classNames**: A utility function from the `classnames` package is imported. This function is used to conditionally join class names together based on the input properties.

## Structure

The `SvgGlobeNew` component is a functional component that accepts props of type `React.SVGProps<SVGSVGElement>`. The component returns a JSX element structured as follows:

- **svg**: The root element with the following properties:
  - `width` and `height` set to '1em', making the size of the SVG relative to the font-size of its parent element.
  - `aria-hidden` set to 'true' indicating that this SVG is purely decorative and should be hidden from accessibility tools.
  - `focusable` set to 'false' to prevent the SVG from being focusable.
  - `data-tid`: A data attribute for test identification, defaulting to 'globe-new-icon' if not provided in props.
  - `className`: A dynamic class name combining a default class 'icon-svg' with any className provided through props.
  - `viewBox` set to '0 0 125 125', defining the aspect ratio and coordinate system of the SVG.

- **path**: A single child element of the SVG that defines the shape of the globe icon. It includes:
  - `d`: A long string that defines the SVG path commands for drawing the icon.
  - `transform`: A transformation attribute that flips the path horizontally and centers it.

## Logic

The component primarily focuses on displaying a styled SVG element without any internal state or side effects. The logic involves:

- **Defaulting Properties**: The `data-tid` property defaults to 'globe-new-icon' if it is not provided in the props.
- **Class Name Handling**: The `className` for the SVG element is dynamically generated using the `classnames` function, which combines 'icon-svg' with any additional classes provided via props.
- **SVG Path and Transformation**: The path data (`d`) and the transformation are predefined and static, designed to render a specific globe icon with a horizontal flip transformation for stylistic purposes. 

This component is purely presentational and meant to be reused wherever a globe icon is needed within a React application, with customizable classes and test identifiers for flexibility and ease of testing.