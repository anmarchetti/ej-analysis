## Imports

The code imports several modules and types to be used within the `RecentlyUsed` component:

- `FC` from `react`: This is the abbreviation for `FunctionComponent` type from the React library, used to type the functional components.
- `SearchFilterStore` and `TradePortalSearchFilterStore` from respective paths within the `frontend/store` directory: These are specific store instances used for managing state related to search filters in different contexts (standard holiday search and trade portal search).
- `FilterGroupCodes` from `models/enum/FilterGroupCodes`: This is an enumeration that stores various group codes for filters, used to specify which group of filters the component should handle.
- `FilterPills` from a nested path in `frontend/components`: This is a React component used to render the UI elements for filter pills based on the provided store and filter group code.

## Structure

The `RecentlyUsed` component is defined as a functional component using the `FC` generic type from React, which is passed an interface `IRecentlyUsedProps` as its props definition:

### `IRecentlyUsedProps` Interface

- `storeInstance`: This is a type union of `SearchFilterStore` or `TradePortalSearchFilterStore`, allowing the component to be used with either of these store types.

### `RecentlyUsed` Component

- The component accepts props of type `IRecentlyUsedProps`.
- It renders the `FilterPills` component by passing along the `storeInstance` received from its own props.
- It also sets the `code` prop on the `FilterPills` component to `FilterGroupCodes.RecentlyUsed`, indicating that this instance of `FilterPills` should handle filters classified under "Recently Used".
- The `getLabel` prop is a function that determines what label to display for each filter option, using the `fullName`, `name`, or `code` properties of the option object, in that order of preference.

## Logic

The logic within the `RecentlyUsed` component revolves around how it configures and utilizes the `FilterPills` component to display filters:

- **Store Instance Propagation**: It directly passes the `storeInstance` prop to the `FilterPills` component, ensuring that the same store context is used for managing state.
- **Filter Group Specification**: By setting the `code` prop to `FilterGroupCodes.RecentlyUsed`, it specifies that the `FilterPills` should utilize the part of the store that deals with recently used filters.
- **Dynamic Labeling**: The `getLabel` function provided to the `FilterPills` component allows for dynamic determination of the text to be displayed on each filter pill based on available properties of the filter option. This function is designed to handle different possible structures of filter data gracefully, using a fallback mechanism (`fullName`, then `name`, then `code`). This ensures robustness in how filter labels are derived, accommodating various data configurations.

Overall, the `RecentlyUsed` component acts as a specialized configuration wrapper for the `FilterPills` component, tailoring it for displaying recently used filters with appropriate labeling and store integration.