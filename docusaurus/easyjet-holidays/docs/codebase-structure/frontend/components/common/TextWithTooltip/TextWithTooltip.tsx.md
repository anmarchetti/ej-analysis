## Imports

The `TextWithTooltip` component utilizes several imports to function properly:

- **React Imports**:
  - `ElementType` and `FC` (Functional Component) are imported from the `react` library. `ElementType` is used for typing the `tag` prop to ensure it can accept any valid HTML tag name. `FC` is a TypeScript type used to define functional components.

- **Component Imports**:
  - `Tooltip`, `TooltipContent`, and `TooltipTrigger` are imported from `frontend/components/common/Tooltip`. These components are used to create a tooltip that displays additional information.

- **Utility Imports**:
  - `getSplitText` is imported from `./TextWithTooltip.utils`. This utility function is used to split the `message` string into two parts for special formatting.

- **Styles Import**:
  - `styles` is imported from `./TextWithTooltip.module.scss`. This module provides scoped CSS for this component, particularly for styling the last word of the message which might be wrapped in a tooltip.

## Structure

The `TextWithTooltip` component is structured as follows:

- **Props Definition (`ITextWithTooltipProps`)**:
  - `message`: The main text to be displayed.
  - `tooltipMessage`: Text to be shown inside the tooltip.
  - `dataTid`: Optional prop for testing purposes, usually to provide a data attribute for identifying elements in tests.
  - `icon`: Optional JSX element, typically an icon, to trigger the tooltip.
  - `tag`: Optional prop to define what HTML tag should wrap the component's content, defaults to `div`.
  - `tooltipTriggerClassName`: Optional class name to be added to the tooltip trigger element.
  - `wrapperClassName`: Optional class name to be added to the wrapper element.

- **Functional Component Definition**:
  - The component is defined as a functional component using React's `FC` type with `ITextWithTooltipProps` for props validation.

## Logic

The component logic is straightforward and handles the rendering based on the provided props:

1. **Conditional Rendering**:
   - If the `message` prop is not provided, the component returns `null`, effectively rendering nothing.

2. **Tag Handling**:
   - The `tag` prop is used to dynamically determine the HTML tag of the wrapper element. It is cast to `ElementType` to satisfy TypeScript's type checking.

3. **Text Splitting**:
   - The `message` is split into two parts using the `getSplitText` utility function. The main part of the text (`text`) and the last word (`lastWord`) are then used separately in the render.

4. **Tooltip Conditional Rendering**:
   - A tooltip is conditionally rendered if `tooltipMessage` is provided. It wraps the `lastWord` and optionally includes an `icon` if provided. The tooltip is triggered by hovering or focusing on the icon.

5. **Styling**:
   - The `wrapperClassName` is applied to the WrapperTag, and `tooltipTriggerClassName` is applied to the `TooltipTrigger` component. The `lastWord` is wrapped in a `<span>` with a class from the imported `styles` module to apply specific styling.

This component is useful for displaying text with a special emphasis on the last word, which can have a tooltip associated with it for additional context or information.