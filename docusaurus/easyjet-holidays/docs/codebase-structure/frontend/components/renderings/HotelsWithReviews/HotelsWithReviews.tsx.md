## Imports

The `HotelsWithReviews` component imports several modules and components to function correctly:

- React hooks and utilities: `FC` (Function Component type) and `useMemo` from `react`.
- MobX React integration: `observer` from `mobx-react` for React component reactivity.
- Custom hook: `useStore` from `frontend/hooks/useStore` to access MobX stores.
- Type definitions:
  - `IHolidaysStores` from `frontend/store/holidays` for typing the stores used.
  - `ISitecoreComponent` from `models/sitecore/generic/ISitecoreComponent` for Sitecore component props typing.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing dictionary keys.
- Components:
  - `ShowMorePanel` from `frontend/components/common/ShowMore/ShowMorePanel` for displaying a list with a show more functionality.
  - `HotelItem` component from the local directory for rendering individual hotel items.
- Styles: `styles` from `./HotelsWithReviews.module.scss` for CSS module styling.

## Structure

The component `HotelsWithReviews` is structured as follows:

- **Type Definitions**:
  - `IHotelItem`: Defines the shape of each hotel item including optional properties for eco facilities.
  - `IHotelItems`: Defines the structure for props received by the component, containing an array of `IHotelItem`.
  - `THotelItemProps`: Combines `ISitecoreComponent` with `IHotelItems` for enhanced prop typing.

- **Constants**:
  - `DESKTOP_ITEMS_AMOUNT`: Number of items to show on desktop screens.
  - `TABLET_ITEMS_AMOUNT`: Number of items to show on tablet screens.

- **Component Definition**:
  - The component is defined as a functional component using TypeScript, wrapped with the `observer` from MobX to react to state changes.

## Logic

- **Store Usage**:
  - The `useStore` hook is utilized to pull necessary state and functions from the MobX stores. It extracts `getPhrase` for translations, `isScreenLessMedium` for responsive behavior, and `country` for dynamic text in the title.

- **Memoization**:
  - `useMemo` is used to compute the visible and hidden hotel items based on the screen size. It divides the list of hotels into two parts: one to show initially and the other to show upon user interaction with the "Show More" functionality.

- **Conditional Rendering**:
  - The component early returns `null` if there are no items to display, enhancing performance by avoiding unnecessary rendering.

- **Dynamic Title**:
  - Constructs a dynamic title using the `getPhrase` function with a dictionary key and the current country.

- **Rendering**:
  - The rendered output includes a wrapper `div` with a title and the `ShowMorePanel` component, which handles the logic for showing more items upon user interaction. The `HotelItem` component is used as a child component for rendering individual items, and CSS modules are used for styling.

This component effectively demonstrates the use of MobX for state management, React's built-in hooks for performance optimizations, and conditional rendering based on the application's state and responsiveness.