## Imports

The `CheckboxItem` component imports several modules and components:

- `React` and `FC` (Function Component) from the `react` library for creating the functional component.
- `Checkbox` component from a local path `frontend/components/common/Checkbox`, which is a custom checkbox component used in the UI.
- `IconBed` and `IconMapMarker` components from local paths within `frontend/components/icons`, which are used to display specific icons conditionally within the checkbox item.
- `styles` from `./CheckboxItem.module.scss` for applying scoped CSS styles to this component.

## Structure

The `CheckboxItem` component is defined as a functional component using React's Functional Component (FC) type, with props specified by the `ICheckboxItemProps` interface. This interface includes the following properties:

- `checked`: Boolean indicating whether the checkbox is checked.
- `code`: String to uniquely identify the checkbox item, used in `data-tid`.
- `name`: String representing the display name of the checkbox item.
- `onChange`: Function to handle change events.
- `dataType`: Optional string for additional data categorization, used in `data-type`.
- `disabled`: Optional boolean to disable the checkbox.
- `disabledShowUnchecked`: Optional boolean to control visibility of unchecked state when disabled.
- `enableIfChecked`: Optional boolean to enable the checkbox only if it is already checked.
- `hotelIcon`: Optional boolean to determine whether to display the hotel (bed) icon.
- `icon`: Optional boolean to determine whether to display the map marker icon.

The component returns a `div` element with a class from the imported `styles` and data attributes derived from props. Inside this `div`, it renders the `Checkbox` component with several props and a custom render function that conditionally displays icons and the name based on the props.

## Logic

The logic of the `CheckboxItem` component primarily revolves around the conditional rendering and the propagation of props to the `Checkbox` component. Here's how it works:

1. **Conditional Rendering of Icons**: Inside the `render` prop of the `Checkbox`, icons are conditionally rendered based on the `icon` and `hotelIcon` props. If `icon` is true, the `IconMapMarker` is displayed. If `hotelIcon` is true, the `IconBed` is displayed.

2. **Data Attributes**: The component uses `data-tid` and `data-type` attributes on the wrapper `div` for potential use in testing or styling. The `data-tid` is set to the `code` prop, and `data-type` is set to the `dataType` prop if provided.

3. **Passing Props to Checkbox**: The `Checkbox` component receives props such as `checked`, `onChange`, `disabled`, `enableIfChecked`, and `disabledShowUnchecked` directly from the `CheckboxItem`'s props, allowing it to control its behavior based on the user interactions and conditions defined outside this component.

This structure and logic facilitate a reusable and customizable checkbox item component that can be integrated into larger forms or UIs with specific behavior and styling requirements.