## Imports

The component imports several JavaScript and TypeScript entities to function properly:

- `FC` and `useEffect` from React. `FC` stands for Function Component, which is a type from React used to define functional components with TypeScript. `useEffect` is a React hook that performs side effects in function components.
- Custom hook `useMobileViewport` from `frontend/hooks/useMediaQuery` to determine if the viewport is of a mobile device.
- Utility function `scrollIntoViewHorizontal` from `frontend/utils/scroll.utils` to manage horizontal scrolling behavior.
- `RadioButton` component from `frontend/components/common/RadioButton` which is a UI component used to render each option.

## Structure

### Interfaces

- `IPillOption`: Defines the type for each option in the pill selector with properties:
  - `label`: A string that represents the display text of the option.
  - `value`: A number that represents the underlying value of the option.

- `IPillSelectorProps`: Defines the props accepted by the `PillSelector` component:
  - `dataTid`: A string for testing ID.
  - `inputName`: A string that specifies the name attribute for the radio button inputs, ensuring they are part of a single group.
  - `onChange`: A function that is called when the selected value changes, accepting the new value as its parameter.
  - `options`: An array of `IPillOption` items to be rendered.
  - `className`: An optional string to add custom classes to the component.
  - `selectedValue`: An optional number to indicate which value is currently selected.

### Component Definition

`PillSelector` is a functional component typed with `FC` from React and uses the `IPillSelectorProps` for its props. It includes:
- Usage of the `useMobileViewport` hook to add responsive behavior.
- A `useEffect` hook to handle side effects related to component updates.
- Conditional rendering to return `null` if there are no options to display.
- A mapping of `options` to `RadioButton` components, passing necessary props and handling selection logic.

## Logic

1. **Mobile Scrolling**: When on a mobile device (checked via `useMobileViewport`), the `useEffect` hook triggers whenever `selectedValue`, `isMobile`, or `inputName` changes. If there's a selected radio button, it scrolls it into the center of the viewport smoothly.

2. **Rendering Logic**: If there are no options provided (`options.length` is 0), the component renders nothing (`return null`). Otherwise, it iterates over each option, creating a `RadioButton` for each. It passes properties like `label`, `value`, `name`, and an `onChange` handler which triggers the parent component's `onChange` function with the new value.

3. **Selection Handling**: The component checks if the current value of an option equals the `selectedValue` to determine if the radio button should be marked as checked.

4. **Styling**: The `className` on the `RadioButton` is conditionally set to `'is-selected'` if the radio button is currently checked, allowing for custom styling of selected options.