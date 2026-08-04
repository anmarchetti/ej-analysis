### Imports

The `BestPrice` component uses the following imports:

- `FC` and `SVGProps` from `react`: These are TypeScript types used to define functional components and props specifically for SVG elements in React.
- `classNames` from `classnames`: A utility function used to conditionally join class names together. This is useful for dynamically assigning classes based on the component's props.

### Structure

The `BestPrice` component is a functional component defined using an arrow function. It accepts `props` which are of type `SVGProps<SVGSVGElement>`, indicating that this component is specifically meant to handle SVG elements and their properties.

The component returns an SVG element with the following attributes:
- `xmlns`: The XML namespace attribute (always `"http://www.w3.org/2000/svg"` for SVGs).
- `width` and `height`: Both set to `'1em'` to ensure the SVG scales with the surrounding text size.
- `aria-hidden`: Set to `'true'` to indicate that this SVG is purely decorative and should be hidden from screen readers.
- `focusable`: Set to `'false'`, ensuring the SVG cannot receive keyboard focus.
- `className`: A dynamic class name that combines a default class `'icon-svg'` with any class passed through `props.className` using the `classNames` function.
- `role`: Set to `'graphics-symbol'` to semantically represent that the SVG is a graphical symbol.
- `aria-label`: Provides an accessible name (`'best-price-icon'`) for the SVG.
- `data-tid`: A data attribute used for testing, defaulting to `'best-price-icon'` unless specified in props.

Inside the SVG, there are two main graphical elements defined within a `<g>` (group) tag:
- Two `<path>` elements that define the actual graphic of the icon, each with specific `d` attributes for the drawing path and `fill` attributes for the color.

### Logic

The component's logic primarily revolves around handling and merging SVG-specific props with predefined attributes and classes:

- The `classNames` function is utilized to merge the `'icon-svg'` class with any additional classes provided via `props.className`.
- The `data-tid` attribute is set using a logical nullish coalescing operator (`??`), which provides a default value of `'best-price-icon'` if `props['data-tid']` is not explicitly provided.

This approach ensures that the SVG element is both customizable and adheres to best practices for accessibility and testing.