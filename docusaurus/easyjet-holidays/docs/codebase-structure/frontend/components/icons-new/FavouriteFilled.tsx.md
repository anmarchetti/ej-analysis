### Imports

The code begins by importing necessary modules and libraries:

- `React` from the `react` package to utilize React framework functionalities.
- `classNames` from the `classnames` package, a utility function used to conditionally join class names together.

### Structure

The `SvgFavouriteFilled` component is a functional component that takes `props` as an argument. These props are of type `React.SVGProps<SVGSVGElement>`, which is a TypeScript generic type that ensures the props adhere to the properties expected of an SVG element in React.

The component returns an SVG element structured as follows:

- **SVG Properties:**
  - `viewBox` is set to '1 1 22 22', defining the position and dimension of the SVG.
  - `width` and `height` are both set to '1em', making the SVG size relative to the font-size of the element.
  - `aria-hidden='true'` makes the SVG invisible to assistive technologies like screen readers.
  - `focusable='false'` prevents the SVG from being focusable.
  - `data-tid` is a data attribute used for testing, with a default value of 'favourite-filled-icon' if not provided in the props.
  - `className` combines a default class 'icon-svg' with any className provided via props using the `classNames` function.

- **SVG Child:**
  - The `<path>` element with a `d` attribute defines the shape of a filled heart. This path is used to visually represent a "favourite" icon.

### Logic

The logic of the `SvgFavouriteFilled` component is primarily concerned with handling and setting SVG properties based on the passed props:

- **Conditional Attributes:**
  - The `data-tid` attribute checks if it is provided in the props; if not, it defaults to 'favourite-filled-icon'.
  - The `className` attribute uses the `classNames` utility to dynamically generate the class name string based on the default class and any additional classes passed via props.

- **Static and Dynamic Attributes:**
  - Static attributes like `viewBox`, `width`, `height`, `aria-hidden`, and `focusable` are set directly in the component.
  - Dynamic attributes like `data-tid` and `className` are computed based on the input props.

This functional component is designed to be reusable and adaptable for different scenarios where an SVG icon is needed, with customizable classes and test identifiers for enhanced development and testing practices.