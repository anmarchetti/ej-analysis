## Imports

The code snippet begins by importing necessary modules and libraries:

- `React` from the 'react' package: This import allows the use of React in the JSX file.
- `classNames` from 'classnames': A utility function used for conditionally joining class names together.

## Structure

The component `SvgMinus` is a functional component that returns a JSX element. It takes `props` as an argument, which should conform to `React.SVGProps<SVGSVGElement>`. This type definition ensures that the props passed to `SvgMinus` are valid properties for an SVG element in React.

Here is a breakdown of the SVG component structure:

- **svg element**: The root element with several attributes:
  - `viewBox`: Defines the position and dimension of the SVG canvas.
  - `width` and `height`: Both set to '1em', making the size of the SVG relative to the font-size of the element it's applied to.
  - `aria-hidden`: Set to 'true' to hide the SVG from screen readers.
  - `focusable`: Set to 'false', preventing SVG from gaining focus.
  - `data-tid`: A custom attribute for testing, defaulting to 'minus-icon' if not provided.
  - `className`: Uses the `classNames` function to combine 'icon-svg' with any additional classes provided via `props.className`.

- **rect element**: A rectangle shape within the SVG:
  - `x` and `y`: The x and y coordinates of the rectangle.
  - `width` and `height`: Dimensions of the rectangle.
  - `rx`: The radius of the rectangle's corners, making them slightly rounded.
  - `transform`: Rotates the rectangle by -90 degrees around the center (12, 12) to turn it into a horizontal line.

## Logic

The logic of the `SvgMinus` component is straightforward:

1. **Default Properties Handling**: The component uses the nullish coalescing operator (`??`) to provide a default value for the `data-tid` attribute if it is not included in the passed `props`.

2. **Class Management**: The `classNames` function is utilized to dynamically generate the `className` for the SVG element. It ensures that the SVG always has the 'icon-svg' class and any additional classes passed through `props.className`.

3. **SVG Presentation**: The SVG is designed to visually represent a minus sign. The structure and transformation applied to the `rect` element achieve this by positioning it horizontally at the center of the SVG canvas.

This component is designed to be reusable and customizable through props, making it a flexible choice for displaying a minus icon in various parts of a UI while maintaining accessibility and style consistency.