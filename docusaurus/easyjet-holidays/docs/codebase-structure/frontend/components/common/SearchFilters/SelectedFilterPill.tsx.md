## Imports

The code begins by importing necessary modules and components:
- `React` from the 'react' package, which is essential for using React's functionalities.
- `classNames` from 'classnames', a utility to conditionally join class names together.
- `SVGCross` from 'frontend/components/icons-new/Cross', a React component that likely renders a cross (or "X") icon, used here for a visual representation of a remove/close button.

## Structure

The code defines a TypeScript interface `ISelectedFilterPillProps` and a functional component `SelectedFilterPill`.

### ISelectedFilterPillProps Interface
This interface specifies the expected props for the `SelectedFilterPill` component:
- `dataTid`: A string identifier for test identification purposes.
- `label`: A nullable string that represents the text to be displayed on the pill. It's marked as nullable indicating that it can be `null` or `string`.
- `onClick`: A function that handles click events on the pill but does not expect any parameters and does not return anything.
- `onRemoveClick`: A function specifically for handling clicks on the remove icon, which takes a React mouse event as its parameter.
- `isDisabled`: An optional boolean that indicates if the pill is disabled.

### SelectedFilterPill Component
A functional React component that takes `ISelectedFilterPillProps` as props. It destructures these props to use them within the component. The component returns a `div` element styled as a filter pill, which includes text and a remove icon.

## Logic

1. **Conditional Rendering**:
   - The component first checks if the `label` prop is `null`. If it is, the component returns `null`, effectively rendering nothing. This prevents rendering of an empty or undefined label.

2. **Dynamic Class Names**:
   - The `div` element uses the `classNames` utility to dynamically assign class names. If `isDisabled` is true, the 'is-disabled' class is added to the 'filter-apply__group--item' base class. This allows CSS to target and style the component based on its state.

3. **Event Handling**:
   - The `div` itself has an `onClick` event tied to the `onClick` prop, allowing for a callback function to be executed when the pill (excluding the remove icon) is clicked.
   - The remove icon (`i` element) inside the `div` has its own `onClick` event, managed by the `onRemoveClick` prop. This separation allows for distinct actions between clicking the pill and clicking the remove icon. The event for the remove icon also stops propagation (`e.stopPropagation()` is implied but should be added in practice) to prevent the `onClick` event of the parent `div` from firing when the icon is clicked.

This component is typically used in UIs where filters are represented as pills (tags), and users can remove specific filters by clicking on a close or remove icon. The optional disabling functionality provides flexibility in scenarios where certain filters should not be removed or interacted with.