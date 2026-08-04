## Imports

The code begins by importing necessary modules and libraries:

- `React`: Imported from the 'react' package, it is used to utilize React's functionalities including the component structure.
- `classNames`: Imported from the 'classnames' package, this utility function is used to conditionally join class names together.

## Structure

The file defines a single React functional component named `SvgArrivalsFilled`. This component is designed to render an SVG element, specifically an icon. The structure of the component is straightforward, consisting of a single JSX element returned directly by the arrow function.

### SVG Element

The `svg` element within the component has several attributes:

- `viewBox`: Defines the position and dimension in user space.
- `width` and `height`: Both set to `1em` making the size of the icon flexible to font size changes.
- `aria-hidden` and `focusable`: Accessibility attributes to indicate the icon is purely decorative and should not be focusable.
- `data-tid`: A custom data attribute for testing, which defaults to 'arrivals-filled-icon' if not provided.
- `className`: Combines a default class 'icon-svg' with any class passed through `props.className` using the `classNames` function.

### Path Element

Inside the `svg`, there is a single `path` element that defines the shape of the icon using the `d` attribute.

## Logic

### Default Properties Handling

The component handles default properties by using the nullish coalescing operator (`??`). This operator allows the component to use 'arrivals-filled-icon' as a default value for `data-tid` if it's not provided in the props.

### Class Name Management

The `className` attribute of the `svg` element uses the `classNames` function to dynamically generate the class name string. This function merges 'icon-svg' with any additional classes provided via `props.className`.

### Accessibility

Accessibility features include:
- `aria-hidden="true"`: Indicates that the icon is purely decorative and should be hidden from accessibility tools.
- `focusable="false"`: Ensures the icon cannot receive keyboard focus, which is typical for decorative elements not requiring interaction.

This component is designed to be reusable and adaptable, fitting different scenarios where an SVG icon (specifically an arrivals filled icon) is needed within a React application. The use of `classNames` allows for flexible styling, and default props handling ensures robustness in various usage contexts.