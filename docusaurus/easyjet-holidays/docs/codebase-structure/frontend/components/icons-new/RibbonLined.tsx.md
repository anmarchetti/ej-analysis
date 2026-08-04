### Imports

The component `SvgRibbonLined` imports two main dependencies:

- `React`: This is used to leverage React's functionalities, including the creation of the JSX element.
- `classNames`: A utility function used to conditionally join class names together. This is useful for applying conditional styling to React components.

### Structure

The `SvgRibbonLined` component is a functional component written using arrow function syntax. It accepts `props` as an argument, which are of type `React.SVGProps<SVGSVGElement>`. This ensures that the component can accept all valid SVG properties and pass them to the `<svg>` element.

The component returns an SVG element structured as follows:

- **SVG Container**: The main container with a `viewBox` attribute set to '1 1 22 22', and dynamic `width` and `height` properties set to '1em' each. This makes the SVG icon size relative to the font size of its context. `aria-hidden` is set to 'true' and `focusable` is set to 'false', which helps with accessibility by hiding the SVG from screen readers and preventing it from being focusable.
- **Data Attribute**: Uses `data-tid`, which defaults to 'ribbon-lined-icon' if not provided in the props. This is used for testing or targeting the icon in the DOM.
- **Class Name**: Combines a default class 'icon-svg' with any className provided via props using the `classNames` utility.
- **Paths**: Two `<path>` elements define the visual part of the icon. Each path has its own 'd' attribute that describes the shape of the path.

### Logic

The logic of the `SvgRibbonLined` component is simple and primarily focused on the presentation:

1. **Props Handling**: The component handles `props` flexibly by using TypeScript's type checking to ensure all passed props adhere to SVG properties.
2. **Conditional Class Application**: It uses the `classNames` function to merge any class names passed through `props.className` with 'icon-svg'. This allows for external styling control.
3. **Default Prop Values**: The `data-tid` attribute is given a default value using the nullish coalescing operator (`??`). This ensures that if `data-tid` is not provided in the props, it defaults to 'ribbon-lined-icon'.

Overall, the component is designed to be reusable and easily integrated into different parts of a React application where an SVG icon (specifically styled as a ribbon) is needed. It encapsulates all the necessary SVG logic and styling within a single, self-contained functional component.