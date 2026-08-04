## Imports

The `DurationPills` component imports several modules and types to be used within its implementation:

- `FC` from `react`: The `FC` (Functional Component) type is imported from React for typing the component.
- `useStore` from `frontend/hooks/useStore`: A custom hook for accessing the application's store.
- `TStores` from `frontend/store/IStores`: The type definition for the stores used within the application.
- `SiteSettings` from `models/enum/SiteSettings`: Enumerations defining various site settings.
- `IDurationPillOption` from `models/sitecore/IDurationPillOption`: Interface describing the structure of duration pill options.
- `PillSelector` from `frontend/components/common/PillSelector/PillSelector`: A reusable pill selector component.

## Structure

The `DurationPills` component is defined as a functional component using TypeScript. It accepts props of type `IDurationPillsProps`, which includes:

- `onChange`: A function that is called when the selected value changes.
- `selectedValue`: The currently selected value.
- `className`: An optional string for CSS class names.

The component uses destructuring to extract `onChange`, `selectedValue`, and `className` from its props.

## Logic

1. **Store Hook Usage**: The `useStore` hook is utilized to access the store and retrieve a specific setting using `getSetting` method from `layoutStore`. It fetches `SiteSettings.SearchPodDurationPillOptions` which should return an array of `IDurationPillOption`.

2. **Handling No Options**: If there are no duration pill options available (`durationPillOptions.length` is zero), the component renders `null`, effectively rendering nothing.

3. **Options Conversion**: The available `durationPillOptions` are mapped over to convert them into a format suitable for the `PillSelector` component. Each option is transformed into an object with a `value` (parsed as an integer from `option.Duration`) and a `label` (from `option.Label`).

4. **Rendering PillSelector**: The `PillSelector` component is rendered with the converted options, the currently selected value, the onChange handler, and any additional className. It also includes a custom data attribute `dataTid` set to 'duration-pills' for testing or targeting the component in the DOM more easily.

This component is primarily responsible for providing a user interface to select a duration from predefined options, handling both the data fetching and UI rendering aspects seamlessly.