## Imports

The `AmendHotelsFiltersWrap` component uses several imports from various modules:

- `React`: Base library for building the component.
- `observer`: A function from `mobx-react` used for making the component reactive to MobX state changes.
- `useMobileViewport`: A custom React hook from `frontend/hooks/useMediaQuery` to determine if the viewport is mobile-sized.
- `useStore`: A custom hook from `frontend/hooks/useStore` for accessing MobX stores.
- `IHolidaysStores`: An interface from `frontend/store/holidays` that describes the shape of the stores related to holidays.
- `SitecoreDictionary`: A model from `models/enum/SitecoreDictionary` that contains enumeration values for dictionary keys in Sitecore.
- `Button` and `Drawer`: Reusable UI components from `frontend/components/common`.
- `AmendHotelFilters`: A specific React component from `frontend/components/renderings/AmendHotel/components/AmendHotelFilters`.
- `styles`: Module CSS for styling specific to `AmendHotelsFiltersWrap` from `./AmendHotelsFiltersWrap.module.scss`.

## Structure

The `AmendHotelsFiltersWrap` component is structured as follows:

- It is a functional component using React hooks for state and context management.
- The component uses the `observer` function from MobX to make it reactive to state changes within the MobX store.
- The component conditionally renders based on the viewport size. If the viewport is mobile-sized, it renders the filters within a `Drawer` component; otherwise, it renders the filters directly.
- The `Drawer` component, when visible, contains the `AmendHotelFilters` component along with two buttons in the footer for canceling or applying changes.
- The `Button` components use dynamic text retrieved from the Sitecore dictionary via the `getPhrase` function, which accesses translations or specific text values.

## Logic

The logic of the `AmendHotelsFiltersWrap` component revolves around the following points:

- **Store Access**: The component uses the `useStore` hook to access specific functions and states from the MobX store:
  - `getPhrase` for retrieving text based on dictionary keys.
  - `toggleFilterMobileDrawer` for toggling the visibility of the mobile drawer.
  - `isMobileDrawerOpen` to check if the mobile drawer is currently open.
- **Responsive Rendering**: `useMobileViewport` is used to determine if the current viewport is mobile-sized, which influences the rendering logic (either within a `Drawer` or directly).
- **Interaction**: The component provides buttons for user interaction:
  - The "Cancel" button, which uses the `toggleFilterMobileDrawer` function to close the drawer.
  - The "Apply" button, which also uses the `toggleFilterMobileDrawer` function, potentially after applying some filters or changes.
- **Styling**: Uses CSS modules for scoped styling, specifically targeting the footer of the mobile drawer to ensure proper layout and styling of the buttons.