### Imports

The code begins by importing necessary modules and libraries:

- `React` from the 'react' package, which is essential for using React's functionalities.
- `classNames` from the 'classnames' package, a utility function used to conditionally join classNames together.

### Structure

The `SvgInfoLined` component is a functional component that accepts `props` of type `React.SVGProps<SVGSVGElement>`. This type is a generic type provided by React for type-checking props specific to SVG elements.

Here is a breakdown of the JSX structure inside the component:

- The main element is an `<svg>` which is scalable vector graphics used to define images in XML format.
- The `<svg>` element has several attributes set dynamically:
  - `width` and `height` are set to '1em' making the size relative to the current font size.
  - `viewBox` is set to '0 0 16 16' which defines the position and dimension, in user space, of an SVG viewport.
  - `aria-hidden` set to 'true' indicates that this SVG is purely decorative and should be hidden from accessibility APIs.
  - `focusable` set to 'false' prevents SVG from gaining focus.
  - `data-tid` is a custom data attribute for test identification, defaulting to 'info-lined-icon' if not provided.
  - `className` combines a default class 'icon-svg' with any className passed through `props`.
- Inside the `<svg>`, there is a `<g>` element (a container used to group other SVG elements).
  - Within `<g>`, there is a `<path>` element that defines the shape of the graphic. The path uses the `d` attribute to define its drawing, `fillRule` and `clipRule` for clipping and filling rules, and `fill` to set the color.

### Logic

The component's logic is primarily related to handling and merging props:

- `data-tid` prop is managed with a fallback option using the nullish coalescing operator (`??`). It defaults to 'info-lined-icon' if no `data-tid` is provided in the props.
- `className` prop is combined with a static class 'icon-svg' using the `classNames` function. This utility function is particularly useful for conditionally including classes.
- The SVG itself is a purely presentational component, designed to be reusable and configurable through props for different instances where an SVG icon like this might be needed.

This structure and logic allow for a highly reusable and customizable SVG component within a React application.