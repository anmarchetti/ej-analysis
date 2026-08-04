### Imports

The component `SvgParkingCardTypeMeetAndGreet` imports the following dependencies:

- **React**: The base library from which the component is utilizing the React functionality.
- **classNames**: A utility function from the `classnames` package that is used for conditionally joining class names together. This function is particularly useful in React applications for applying multiple class names to a component based on certain conditions.

### Structure

The component is a functional React component that returns an SVG element:

- **Props**: The component accepts `props` which are of type `React.SVGProps<SVGSVGElement>`. This type annotation ensures that the component can accept all standard properties applicable to SVG elements in React.
  
- **SVG Attributes**:
  - `width` and `height` are statically set to '14' and '10' respectively.
  - `viewBox` is set to '0 0 14 10', defining the position and dimension in user space.
  - `fill` is set to 'none', specifying that the SVG graphic itself will not have a fill color.
  - `className` utilizes the `classNames` function to dynamically generate a class string. It combines a default class 'icon-svg' with any className passed through the component's props.
  - `xmlns` specifies the XML namespace and is set to 'http://www.w3.org/2000/svg'.
  - `role` is assigned the value 'graphics-symbol' to indicate the semantics of the SVG to assistive technologies.
  - `aria-label` provides an accessible name, 'meet-and-greet-icon', which describes the purpose of the SVG to assistive technology.
  - `data-tid` uses a fallback mechanism where it defaults to 'parking-card-type-meet-and-greet-icon' if not provided in the props.

- **SVG Content**:
  - Two `<path>` elements define the actual graphic content of the SVG, both with a `fill` attribute set to '#333333' (a dark gray color).

### Logic

The component mainly handles the visual representation of an icon through SVG paths and does not contain any interactive logic or state management. The SVG paths are hardcoded, and the component's primary function is to render these paths with the ability to accept external styles and attributes through props.

The use of `classNames` allows for flexible styling, enabling the component to be reused in different contexts where additional class names might be required for styling purposes without altering the internal structure of the component. The fallback for `data-tid` ensures that there is always a data attribute present for testing purposes, even if it is not explicitly passed as a prop.