### Imports

The code begins by importing necessary modules and libraries:

- `import * as React from 'react';`: This imports the React library, which is essential for defining the component and its properties.
- `import classNames from 'classnames';`: This imports the `classNames` utility, which is used to conditionally join class names together. This is particularly useful when we need to dynamically assign CSS classes to elements based on certain conditions or props.

### Structure

The component `SvgSelfCatering` is a functional component that takes `props` as an argument. These props adhere to the `React.SVGProps<SVGSVGElement>` type, ensuring that the component receives valid SVG properties.

The component returns an SVG element structured as follows:

- **SVG Container**: The main container for the SVG graphic, which includes several attributes:
  - `viewBox='1 1 22 22'`: Defines the position and dimension of the SVG canvas.
  - `width='1em'` and `height='1em'`: Sets the width and height of the SVG to scale with the current font size.
  - `aria-hidden='true'`: Indicates that this SVG is purely decorative and should be hidden from assistive technologies.
  - `focusable='false'`: Prevents the SVG from being focusable, which is useful for accessibility.
  - `data-tid`: A custom data attribute, which defaults to 'self-catering-icon' if not provided in the props.
  - `className`: Uses the `classNames` utility to combine 'icon-svg' with any additional classes provided via `props.className`.

- **SVG Paths**: Defines two path elements that describe the shapes within the SVG. These paths use the `d` attribute to define the drawing:
  - The first path describes the main graphic.
  - The second path provides additional details or highlights within the SVG.

### Logic

The logic of this component is primarily concerned with the handling and manipulation of SVG attributes:

- **Default Props Handling**: The `data-tid` attribute uses a logical nullish assignment (`??`) to ensure that it falls back to 'self-catering-icon' if not explicitly provided.
- **Class Name Management**: The `className` attribute dynamically constructs the class names applied to the SVG element using the `classNames` function. This allows for both static and dynamic class names, making the component flexible and reusable in different contexts.
- **Accessibility Features**: By setting `aria-hidden` to 'true' and `focusable` to 'false', the component ensures that it meets accessibility standards, making it invisible to screen readers and non-focusable, as it is intended for decorative purposes.

This technical structure and logic ensure that `SvgSelfCatering` is a reusable and accessible SVG component suitable for various decorative purposes within a web application.