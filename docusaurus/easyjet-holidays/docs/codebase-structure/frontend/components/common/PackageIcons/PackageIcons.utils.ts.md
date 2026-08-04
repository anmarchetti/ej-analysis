## Imports

The `usePackageIcons` hook makes use of several imports from different parts of the application:

- `useStore`: A custom hook imported from `frontend/hooks/useStore` used for accessing the global state store.
- `filterPackageIcons`: A utility function imported from `frontend/utils/offer.utils` that filters icons based on certain conditions.
- `IExtraLuggageInfo`, `IThemePackageIcon`, `ITransfer`: TypeScript interfaces imported from `models/data` directory, specifically:
  - `IExtraLuggageInfo` from `models/data/IFlightExtras`
  - `IThemePackageIcon` from `models/data/IHotel`
  - `ITransfer` from `models/data/ITransfer`

These imports are crucial for the function of the `usePackageIcons` hook, providing necessary utilities and type definitions for handling the business logic.

## Structure

The `usePackageIcons` hook is structured to take a single argument, an object of type `IUsePackageIconsProps`, which includes:

- `extraLuggage`: Nullable object of type `IExtraLuggageInfo`
- `isLuxury`: Boolean indicating if the package is luxury
- `packageIcons`: Array of `IThemePackageIcon`
- `transfer`: Nullable object of type `ITransfer`

The hook returns an object of type `IUsePackageIconsData`, which includes:

- `getPhrase`: A function that retrieves localized phrases by key.
- `customItems`: An optional array of objects with `icon` and `label` properties, structured for UI rendering.

## Logic

The logic within the `usePackageIcons` hook is primarily concerned with conditional rendering and data transformation:

1. **Store Access**: It first uses the `useStore` hook to extract the `getPhrase` function from the `layoutStore`. This function is used for localization.

2. **Conditional Logic**: The hook checks if the `isLuxury` flag is set to `true`. If it is, it returns an empty object for `customItems`. If `isLuxury` is `false`, it proceeds to filter and map the `packageIcons`.

3. **Data Transformation**: Using the `filterPackageIcons` utility function, the hook filters the `packageIcons` array based on the presence of `transfer` and `extraLuggage`. The resulting array is then mapped to a new format suitable for UI rendering:
   - Each item is transformed into an object with `icon` (containing `alt` and `src` attributes) and `label`.
   - The `alt` and `src` for the `icon` are derived from the `name` and `iconUrl` properties of the items in the filtered `packageIcons` array.

4. **Output**: The hook combines the `getPhrase` function and the optionally transformed `customItems` into an object and returns it.

This setup allows the hook to provide localized UI data that is conditionally formatted based on the properties of the input object, particularly useful for dynamic UI elements like icons in a travel booking interface.