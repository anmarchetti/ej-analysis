## Imports

The `AccordionButton` component uses several imports:

- `FC` from `react`: This is the abbreviation for `FunctionComponent`, a TypeScript generic type from React used to type components with props.
- `classNames` from `classnames`: A utility function used to conditionally join class names together.
- `SVGChevronDown` from `frontend/components/icons-new/ChevronDown`: A React component that renders an SVG chevron down icon.

## Structure

The `AccordionButton` component is defined using TypeScript with the following props specified in the `IAccordionButtonProps` interface:

- `isExpanded`: A boolean indicating whether the accordion section associated with this button is currently expanded.
- `onClick`: A function to handle click events on the button.
- `ariaLabel` (optional): A string that defines a string value that labels the current element, used for accessibility.
- `buttonContent` (optional): A `ReactNode` which can be any valid React child (e.g., elements, strings).
- `className` (optional): Additional CSS class names to be applied to the button.
- `dataTid` (optional): A string that can be used as a hook for automated testing.
- `panelId` (optional): The ID of the panel that the button controls, used for accessibility with `aria-controls`.

The component returns a `button` element with various props set for accessibility (`aria-expanded`, `aria-controls`, `aria-label`) and behavior (`onClick`). Class names are managed by the `classNames` utility based on the `className` prop and the `isExpanded` state. The button optionally displays `buttonContent` and always displays the `SVGChevronDown` icon, which flips vertically based on the `isExpanded` state.

## Logic

- **Class Management**: The button's class names are dynamically generated using the `classNames` function. The base classes are `btn` and `btn--txt`. Additional classes can be added via the `className` prop. The `SVGChevronDown` icon's class is conditionally set to `icon--reflect-y` when `isExpanded` is true, which presumably flips the icon vertically to indicate the expandable state.
  
- **Accessibility**: The button is equipped with `aria-expanded` to indicate if the associated content is expanded or not, `aria-controls` to link the button to its controlling panel, and `aria-label` for providing an accessible label.

- **Event Handling**: The `onClick` prop is a function passed to the button's `onClick` event handler, allowing the parent component to define what happens when the button is clicked.

- **Conditional Rendering**: The `buttonContent` is rendered inside a `span` element only if it exists (`!!buttonContent` ensures that `buttonContent` is not null or undefined).

This component is designed to be reusable and adaptable for different parts of an application where an accordion-like functionality is required, with clear accessibility features and dynamic class binding for flexible styling.