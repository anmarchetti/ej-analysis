### Imports

The code begins by importing necessary modules and libraries:

- `React` from the 'react' package: This is used to utilize React's functionalities, such as creating a functional component.
- `classNames` from 'classnames': This utility is used for conditionally joining class names together, which is particularly useful when we want to dynamically assign classes to our React component based on certain conditions.

### Structure

The component defined is `SvgLinkedin`, a functional component that returns a JSX element, specifically an SVG (Scalable Vector Graphics). The component is designed to be reusable and configurable via props passed to it.

**Props:**
- `props`: An object of type `React.SVGProps<SVGSVGElement>`, which allows the component to accept any properties applicable to an SVG element in React.

**SVG Attributes:**
- `viewBox`: Defines the position and dimension in user space which should be mapped to fit into the viewport established for the SVG element.
- `width` and `height`: Set to '1em' to make the size of the SVG relative to the font-size of the element it's used within.
- `aria-hidden`: Set to 'true' to hide the SVG from screen readers, indicating it's purely decorative.
- `focusable`: Set to 'false' to prevent the SVG from being focusable, which is standard for purely decorative graphics.
- `data-tid`: A custom data attribute for test identification, defaults to 'linkedin-icon' if not provided.
- `className`: Uses `classNames` to combine 'icon-svg' with any className passed via props, allowing for additional styling.

**SVG Content:**
- The `<path>` element inside the SVG defines the actual vector path data for the LinkedIn icon.

### Logic

The logic within this component is straightforward:

1. **Default Prop Values**: The component uses the nullish coalescing operator (`??`) to provide default values for certain props if they are not provided. For instance, `props['data-tid']` defaults to 'linkedin-icon' if it's not specified.

2. **Class Names**: The `classNames` function is utilized to dynamically construct the `className` for the SVG element. It combines a default class 'icon-svg' with any additional classes provided through `props.className`. This approach facilitates the extension of default styling with custom styles.

3. **Accessibility and Interaction**: By setting `aria-hidden="true"` and `focusable="false"`, the component ensures the SVG is treated as a purely decorative element, which doesn't participate in user interactions or accessibility tree, making it suitable for icons.

This component encapsulates all the necessary configurations and optimizations to be used as a LinkedIn icon across various parts of a web application, ensuring it adheres to both styling and accessibility standards.