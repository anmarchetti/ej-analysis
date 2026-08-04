### Imports

The component imports various hooks, components, and utilities from both internal and external sources:

- **React Hooks**: `useLayoutEffect`, `useState` from `react`.
- **Sitecore JSS**: `Placeholder` from `@sitecore-jss/sitecore-jss-nextjs` for rendering dynamic placeholders in the Sitecore application.
- **Classnames Utility**: `classnames` for conditional and dynamic classNames.
- **MobX**: `observer` from `mobx-react` for making the component reactive to state changes in MobX stores.
- **Custom Hooks**: 
  - `useMoreThenDesktopViewport`, `useMoreThenMobileViewport`, `useMoreThenTabletViewport` for responsive design checks.
  - `useStore` to access MobX stores.
- **Store Interface**: `IHolidaysStores` from `frontend/store/holidays/create-stores`.
- **Utilities**:
  - `getSlidesToShow`, `responsiveCarouselSlim` from `frontend/utils/getSlidersToShow` for carousel display logic.
  - `isErrorStatus`, `isLoadingStatus` from `models/enum/DataStatus` for checking data loading and error states.
- **Enums**: `PlaceholderNames` from `models/enum/PlaceholderNames` containing constants for placeholder names.
- **Components**:
  - `FilterContent` from `./FilterContent/FilterContentWrapper`.
  - `FilterSkeleton` from `./FilterContent/FilterSkeleton/FilterSkeleton`.
  - `ClearAllPanel` from `./ClearAllPanel`.
- **Styles**: Imported as `styles` from `./LeftHandFilter.module.scss`.

### Structure

The `LeftHandFilter` component is structured into a functional component that optionally receives props defined by the `ILeftHandFilterProps` interface. These props control various aspects of the component's behavior and appearance, such as visibility and layout adjustments based on whether it is inside a map popup or if pagination is shown.

The component uses several state and effect hooks to manage internal state and respond to changes in the viewport size or data status. It calculates offsets dynamically based on the presence of elements like recommended hotels or pagination controls.

Key JSX structure:
- A conditional rendering of `FilterSkeleton` component when filters are still loading.
- A main `div` that adjusts its style based on the current offset and whether it's displayed in a map popup.
- Conditional rendering of the `Placeholder` component and the `FilterContent` and `ClearAllPanel` components based on various conditions.

### Logic

1. **State Management**:
   - `offset` state is used to adjust the `minHeight` of the filter wrapper based on various conditions.
   - Uses MobX store data fetched through `useStore` custom hook to determine component behavior and rendering.

2. **Effects**:
   - A `useLayoutEffect` is used to calculate the `heightOffset` based on the presence of recommended hotels, pagination, and screen size. This effect adjusts the `offset` state.

3. **Conditional Rendering**:
   - Returns `null` if there is an error and it's a promo page or if the site is under maintenance.
   - Shows a skeleton screen (`FilterSkeleton`) during data loading.
   - Renders the full filter content (`FilterContent` and `ClearAllPanel`) if the filters are loaded and it's meant to be shown.
   - Utilizes the `Placeholder` component from Sitecore JSS for dynamic content placement based on the Sitecore configuration.

4. **Responsive and Reactive Adjustments**:
   - Responsive utilities are used to determine the number of slides to show in a carousel based on the viewport.
   - Reacts to changes in MobX store state to re-render or adjust the UI components accordingly.

This component is wrapped with `observer` from MobX to ensure it reacts to changes in the relevant MobX store states.