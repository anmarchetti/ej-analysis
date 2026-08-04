## Imports

The `ValidationIndicator` component utilizes several imports:

- `React, { useMemo }`: Imports React and the `useMemo` hook from the React library. `useMemo` is used for memoizing values.
- `classNames`: A utility function from the `classnames` package, used to conditionally join class names together.
- `SvgCross` and `SvgTick`: These are React components imported from `frontend/components/icons-new/`, representing SVG icons for a cross and a tick, respectively.

## Structure

The `ValidationIndicator` component is defined using a functional component pattern in React. It accepts props defined by the `IValidationIndicatorProps` interface:

- `label`: A string that represents the text label to be displayed alongside the icon.
- `valid`: A nullable boolean (`true`, `false`, or `null`) that indicates the validation state.

The component is structured as follows:

- A `useMemo` hook computes the icon and className based on the `valid` prop.
  - If `valid` is `true`, it displays the `SvgTick` icon and applies a `validation-indicator--valid` class.
  - If `valid` is `false`, it displays the `SvgCross` icon and uses a `validation-indicator--invalid` class.
  - If `valid` is `null`, no icon or specific class is applied.
- The rendered output is a `div` element with dynamic class names and contains:
  - An `icon` wrapped in a `span` with a class of `validation-indicator__icon`.
  - The provided `label` displayed as plain text within the `div`.

## Logic

The logic of the `ValidationIndicator` component centers around the `useMemo` hook, which optimizes performance by memoizing the icon and class name based on the `valid` prop. This prevents unnecessary recalculations unless the `valid` prop changes.

The `classNames` function is used to dynamically construct the class name for the root `div` element. It always includes `validation-indicator` and conditionally includes additional classes based on the state of `valid`.

This setup ensures that the component efficiently re-renders only when necessary and maintains a clean, readable structure by separating concerns between computing values and rendering UI elements.