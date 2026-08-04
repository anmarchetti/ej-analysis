### Imports

The code begins with importing necessary modules and libraries:

- `React`: The base React library is imported to enable JSX syntax and React features.
- `classNames`: A utility function from the `classnames` package that conditionally joins class names together. This is useful for applying dynamic classes to React elements based on certain conditions.

### Structure

The `SvgHoliday` component is a functional component that returns an SVG element. It accepts `props`, which are typed with `React.SVGProps<SVGSVGElement>`, ensuring that the props adhere to the properties expected of an SVG element in React.

The component structure is defined as follows:

- **SVG Element**: The root element with several attributes:
  - `viewBox` set to '1 1 22 22', defining the position and dimension of the SVG canvas.
  - `width` and `height` both set to '1em', making the size of the SVG relative to the current font size.
  - `aria-hidden` set to 'true' to indicate that this SVG is purely decorative and should be hidden from accessibility tools.
  - `focusable` set to 'false', preventing SVG from receiving focus.
  - `data-tid`: A custom data attribute for test IDs, which defaults to 'holiday-icon' if not provided in the props.
  - `className`: Uses the `classNames` function to combine 'icon-svg' with any additional classes provided via `props.className`.

- **Path Elements**: Two `<path>` elements define the shapes within the SVG. Each path has a `d` attribute that contains the series of commands and coordinates to draw the shape.

### Logic

The logic of the `SvgHoliday` component is straightforward and primarily focused on rendering:

- **Default Props Handling**: The `data-tid` attribute uses nullish coalescing operator (`??`) to provide a default value if it is not included in the component's props.

- **Class Management**: The `className` attribute on the SVG element uses the `classNames` utility to dynamically construct the class string. It ensures that the SVG always has the 'icon-svg' class, along with any custom classes passed through `props.className`.

- **Accessibility and Interaction**: The component is made non-interactive and hidden from screen readers by setting `aria-hidden` to true and `focusable` to false, which is typical for purely decorative icons.

This component is designed to be reusable and configurable through props, allowing for flexible integration into various parts of a UI while maintaining accessibility and style encapsulation.