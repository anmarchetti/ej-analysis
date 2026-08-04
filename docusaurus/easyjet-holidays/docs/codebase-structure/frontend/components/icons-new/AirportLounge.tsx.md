### Imports

The code imports several modules and utilities necessary for its execution:

- `React`: Imported from the 'react' package, it is used to utilize React's functionalities throughout the component.
- `classNames`: A utility function imported from 'classnames', which is used to conditionally join class names together.

### Structure

The component `SvgAirportLounge` is a functional component that takes `props` as an argument. These props are of the type `React.SVGProps<SVGSVGElement>`, which ensures type safety by enforcing the props to adhere to the properties expected of an SVG element in React.

Here's a breakdown of the JSX structure:

- **svg element**: The root element with several props set:
  - `viewBox` is set to '1 1 22 22', controlling the scaling of the SVG content.
  - `width` and `height` are both set to '1em', making the size of the SVG relative to the current font size.
  - `aria-hidden` is set to 'true', which hides the SVG from screen readers to improve accessibility.
  - `focusable` is set to 'false', preventing the SVG from being focusable.
  - `data-tid` is a data attribute for test identification, defaulting to 'airport-lounge-icon' if not provided in the props.
  - `className`: Uses the `classNames` function to combine 'icon-svg' with any className provided through props.
- **path elements**: Two path elements define the shapes within the SVG. Each path element has a 'd' attribute that contains the path data necessary to draw the shapes.

### Logic

The component primarily handles the visual representation of an SVG and does not contain business logic or state management. The logic within the component involves:

- **Conditional attributes**: The `data-tid` attribute is conditionally set based on the presence of a similar attribute in the props. If not present, it defaults to 'airport-lounge-icon'.
- **Class handling**: The `className` for the SVG element is dynamically constructed using the `classNames` function, which combines a default class 'icon-svg' with any additional classes passed via props.

The component is straightforward in its implementation, focusing solely on presenting an SVG with configurable properties for reusability and testing.