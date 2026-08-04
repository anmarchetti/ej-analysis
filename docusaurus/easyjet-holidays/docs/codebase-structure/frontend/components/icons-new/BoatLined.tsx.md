### Imports

The code begins by importing necessary modules and dependencies:

- `React` from the 'react' package is imported to enable JSX syntax and use React features.
- `classNames` is imported from the 'classnames' package. This utility function is used to conditionally join class names together.

### Structure

The `SvgBoatLined` component is a stateless functional component that returns an SVG element representing a lined drawing of a boat. It accepts `props` which are of type `React.SVGProps<SVGSVGElement>`, making it specifically tailored to handle SVG properties.

Here's a breakdown of the SVG component structure:

- **SVG Element**: The main container with a `viewBox` attribute set to '1 1 22 22', which defines the position and dimension of the SVG canvas. It also receives dynamic properties for `width`, `height`, `aria-hidden`, `focusable`, `data-tid`, and `className`.
  - `width` and `height` are set to '1em' making the SVG size responsive to the font size of its context.
  - `aria-hidden='true'` and `focusable='false'` are set to enhance accessibility by hiding the SVG from screen readers and making it unfocusable.
  - `data-tid` is a custom data attribute used for testing, defaulting to 'boat-lined-icon' if not provided in the props.
  - `className` combines a default class 'icon-svg' with any className provided through props using the `classNames` function.

- **Path Elements**: There are two `<path>` elements within the SVG, each defined with a `d` attribute specifying the path data for two parts of the boat illustration.

### Logic

The component is primarily presentational with minimal logic:

- **Default Props Handling**: The `data-tid` attribute uses a logical nullish assignment (`??`) to provide a default value if it is not included in the props.
- **Class Name Handling**: The `className` attribute on the SVG uses the `classNames` function to merge a default class with any class provided through the props. This allows for flexible styling integration with external CSS.

The component is exported as `default`, allowing it to be imported under any name in other parts of the application where it's used.