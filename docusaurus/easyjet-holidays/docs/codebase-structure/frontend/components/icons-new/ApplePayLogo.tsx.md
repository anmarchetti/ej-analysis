### Imports
The code begins by importing necessary modules and libraries:
- `React` is imported from the 'react' package to enable JSX syntax and React component functionality.
- `classNames` is imported from 'classnames', a utility that conditionally joins class names together. This is used to handle dynamic class assignments based on conditions.

### Structure
The `ApplePayLogo` component is a stateless functional component that accepts props of type `React.SVGProps<SVGSVGElement>` and returns a JSX element. The component structure is outlined as follows:

- **SVG Container**: The main container is an `<svg>` element with several attributes controlled by the component's props:
  - `version`, `id`, `xmlns`, `x`, `y`: Standard SVG attributes for defining the SVG version, ID, XML namespace, and position.
  - `height`: Dynamically set based on the `height` prop, with a default value of '35px'.
  - `viewBox` and `enableBackground`: Set the view area and background properties for the SVG.
  - `xmlSpace`: Preserves whitespace.
  - `style` and `className`: CSS styling and class names are applied directly from props. The `className` uses `classNames` to merge 'icon-svg' with any className provided via props.
  - `data-tid`: A custom data attribute for test identification, defaulting to 'apple-pay-logo' if not provided in props.

- **Title and Graphics**: Inside the SVG:
  - A `<title>` element labels the SVG as 'Apple Pay Logo'.
  - Two main `<path>` elements define the graphical representation of the Apple Pay logo. Additional nested `<g>` and `<path>` elements provide further details and structure to the logo.
  - The paths use various attributes like `id`, `fill`, and `d` (path commands) to render the visual parts of the logo.

### Logic
The component primarily handles visual presentation and does not include interactive logic or state management. The logic within the component involves:
- Handling default props: If certain props like `height` or `data-tid` are not provided, default values are used.
- Class name management: The `classNames` function is used to combine 'icon-svg' with any additional classes provided through props, allowing for flexible styling integration.
- Scalability and responsiveness: The SVG's `viewBox` attribute ensures that the logo scales correctly for different sizes, maintaining its aspect ratio.

This component is designed to be reusable and easily integrated into various parts of a web application where the Apple Pay logo is needed, adhering to Apple's branding guidelines.