## Imports

The component imports required dependencies at the beginning of the file:

- `React` from the `react` package is imported to use JSX and React features.
- `classNames` from the `classnames` package is used to conditionally join class names together.

## Structure

`SvgShoppingBasketLined` is a functional React component that returns an SVG element. It accepts `props` which are of type `React.SVGProps<SVGSVGElement>`. This type is a generic type provided by React for typing props in SVG elements.

### SVG Element

The SVG element has the following attributes:

- `viewBox` set to '1 1 22 22' which defines the position and dimension in user space.
- `width` and `height` both set to '1em' making the size of the SVG responsive to the font-size of its context.
- `aria-hidden` set to 'true' to indicate that the SVG is purely decorative and should be hidden from accessibility APIs.
- `focusable` set to 'false' to prevent SVG from gaining focus.
- `data-tid` is a data attribute for test identification, defaulting to 'shopping-basket-lined-icon' if not provided in props.
- `className` combines a default class 'icon-svg' with any className provided through props using the `classNames` utility.

### Paths

Inside the SVG, there are two `<path>` elements defined with their respective `d` attributes to draw the shape of a lined shopping basket and its contents.

## Logic

The logic of this component is simple and primarily focused on presentation:

1. **Props Handling**: The component handles `props` efficiently using TypeScript for type safety and default props mechanism (e.g., `data-tid`).
2. **Class Names**: It uses the `classNames` function to merge any class names passed via `props.className` with 'icon-svg'. This is useful for styling the SVG appropriately while maintaining the ability to receive external styles.
3. **Accessibility**: By setting `aria-hidden` and `focusable`, the SVG is made more accessible by ensuring it does not interfere with screen readers or keyboard navigation, considering it's decorative.

This component is a good example of a reusable SVG icon component in React, leveraging TypeScript for props validation and utility functions for dynamic class name handling.