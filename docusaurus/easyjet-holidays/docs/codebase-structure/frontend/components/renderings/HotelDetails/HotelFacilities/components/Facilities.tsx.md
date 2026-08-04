### Imports

The code imports several modules and components which are essential for its functionality:

- `React`, specifically `FC` (Functional Component) and `useMemo` from the 'react' library, are used for creating the functional component and memoizing calculations.
- `useStore` is a custom hook imported from 'frontend/hooks/useStore' presumably for accessing the React context or Redux store.
- `FacilitiesDesignVariant` is an enumeration imported from 'models/enum/FacilitiesDesignVariant', likely used to manage different design variants for the facilities component.
- `FacilitiesLists` and `FacilitiesTabs` are React components imported from local files. These components represent different UI layouts for displaying facility information.
- `IFacilitiesProps` is an interface imported from './types', which defines the props structure for the `Facilities` component.

### Structure

The `Facilities` component is structured as follows:

- It is a functional component that takes `IFacilitiesProps` as props. This interface likely includes properties such as `facilityGroups`, `rendering`, and flags for UI customization like `isShowEcoFacilityPlaceholder` and `isPrintPreview`.
- Inside the component, the `useStore` hook is used to retrieve specific values from the store: `isHotelFacilitiesTabsDesignEnabled`, `filterFacilitiesByDesignVariant`, and `isPostBookingPages`.
- The component uses `useMemo` to compute `filteredGroups` based on the `facilityGroups` provided in props and the current design variant (`Tabs` or `List`).
- Conditional rendering is used to decide whether to render the `FacilitiesTabs` or `FacilitiesLists` based on the `isHotelFacilitiesTabsDesignEnabled` flag and other conditions like `isPrintPreview`.

### Logic

The logical flow of the component can be outlined as follows:

1. **Store Data Retrieval**: The component first retrieves necessary flags and functions from the store using the `useStore` hook.
2. **Data Filtering**: Using `useMemo`, the component filters the `facilityGroups` based on the design variant (Tabs or Lists) and whether an eco facility placeholder should be shown. This memoization helps in optimizing performance by recalculating only when necessary dependencies change.
3. **Conditional Rendering**:
   - If there are no `filteredGroups`, the component returns `null`, effectively rendering nothing.
   - If the `isHotelFacilitiesTabsDesignEnabled` flag is true and it's not a print preview, the component renders the `FacilitiesTabs`. It may also render `FacilitiesLists` if it's in the post-booking pages (presumably for a different view or print layout).
   - If the tabs design is not enabled or it is a print preview, it defaults to rendering the `FacilitiesLists`.
4. **Component Return**: Based on the conditions, either `FacilitiesTabs`, `FacilitiesLists`, or `null` is returned as the output of the component.

This structure and logic ensure that the component is both flexible and optimized for different scenarios and design requirements.