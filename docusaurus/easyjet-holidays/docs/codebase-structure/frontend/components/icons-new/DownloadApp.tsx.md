## Imports

The code imports several modules and bindings:

- `React`: The base React library is imported to enable JSX syntax and use of React features.
- `classNames`: A utility function from the `classnames` package, which is used to conditionally join class names together.

## Structure

The `SvgDownloadApp` is a functional React component that returns an SVG element. It is defined using arrow function syntax and accepts `props` of type `React.SVGProps<SVGSVGElement>`, which are the standard props for SVG elements extended with custom properties in React.

The SVG component has the following attributes:
- `viewBox`: Defines the position and dimension of the SVG canvas.
- `width` and `height`: Set to '1em' to make the size of the SVG relative to the font-size of its parent element.
- `aria-hidden`: Set to 'true' to indicate that the SVG is purely decorative and should be hidden from accessibility tools.
- `focusable`: Set to 'false' to prevent SVG from being focusable.
- `data-tid`: A custom data attribute for testing, which defaults to 'download-app-icon' if not provided.
- `className`: Uses the `classNames` function to combine 'icon-svg' with any className passed through props.

Inside the SVG, there are two `<path>` elements, each defined by a `d` attribute that contains the path commands for drawing the shapes within the SVG canvas.

## Logic

The component primarily focuses on rendering an SVG with specific properties and does not contain complex logic or state management. Here’s a breakdown of the minimal logic involved:

1. **Default Prop Handling**: The component uses the nullish coalescing operator (`??`) to provide a default value for `data-tid` if it is not included in the passed props.
2. **Class Name Management**: The `classNames` function is used to dynamically construct the `className` for the SVG element. It ensures that 'icon-svg' is always applied, while also including any additional classes provided via `props.className`.
3. **Accessibility and Interaction**: By setting `aria-hidden` to 'true' and `focusable` to 'false', the SVG is made purely decorative and non-interactive, which is suitable for icons that do not require direct user interaction.

Overall, the component is designed to be reusable and easily integrated into different parts of a React application where an SVG icon for downloading an app is needed.