## Imports

The component imports several modules and components which are categorized into various types:

- **React and Utility Libraries:**
  - `React` with `FC` for functional component type.
  - `classNames` for dynamically setting CSS class names based on conditions.

- **Custom Hooks and Store:**
  - `useStore` custom hook for accessing the Redux store.
  - `TStores` type definition for the store.

- **Models and Enums:**
  - `IFilterOption` interface for the filter option properties.
  - `FilterGroupCodes` enum for predefined group codes.

- **Components:**
  - `Checkbox`, `RadioButton`, `NewItemPill`, and `TextWithTooltip` are UI components.
  - `Tooltip`, `TooltipTrigger`, and `TooltipContent` for showing tooltips.

- **Styles:**
  - SCSS module for component-specific styles.

## Structure

The component file defines two main entities:

- **`CheckboxIcon` Functional Component:**
  - A small component that returns an image element if the `option` prop has a URL and the group code is not `HotelTypes`. It uses the `cmsUrls.media` function to resolve the URL.

- **`FilterCheckControl` Functional Component:**
  - This is the main component accepting various props to control its behavior including:
    - `checked`: Boolean indicating if the filter is active.
    - `onChange`: Function to call when the filter state changes.
    - `option`: Object containing details about the filter.
    - `disabled`, `hiddenZeroCount`, `hideLabelCount`, `isRadioButton`: Optional flags to modify the component's behavior.
    - `label`: Optional custom label (string or JSX).
  - It utilizes the `useStore` hook to access formatted numbers from the store.
  - It conditionally renders either a `RadioButton` or a `Checkbox` with additional components like `NewItemPill` and labels possibly enhanced with tooltips.

## Logic

- **Conditional Rendering and Class Assignment:**
  - The `getClassName` function uses `classNames` to add a 'disabled' class based on the `disabled` prop.
  - Depending on the `isRadioButton` prop, it either renders a `RadioButton` or a `Checkbox` wrapped inside a div.

- **Label Handling:**
  - The `getLabel` function constructs the label for the checkbox or radio button. It includes:
    - Directly using the `label` prop if provided.
    - Automatically generating a label using the `option.name` or `option.code`, and appending a count if applicable.
    - If `option.tooltipText` is provided, a `Tooltip` component is included.

- **Event Handling:**
  - Both the `RadioButton` and `Checkbox` use the `onChange` callback prop for the change event, ensuring the parent component can react to changes.

- **Icon Rendering:**
  - The `CheckboxIcon` component is conditionally rendered inside the `Checkbox` based on the presence of an `icon` URL and specific group codes.

This component is designed to be flexible and reusable in different parts of an application where filter options need to be presented either as checkboxes or radio buttons, with additional features like tooltips and new item indicators.