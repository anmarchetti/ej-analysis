## Imports

The code snippet imports various modules and types to be used within the `PackageValidatingOverlay` component:

- `FC` from `react`: Importing `FC` (Functional Component) from React for typing our component.
- `inject` from `mobx-react`: Used for injecting MobX stores into the component.
- `TStores` from `frontend/store/IStores`: Custom type representing the shape of the application's MobX stores.
- `SitecoreDictionary` from `models/enum/SitecoreDictionary`: Enum containing keys for translation phrases.
- `IComponentWithDictionary` from `models/sitecore/generic/IComponentWithDictionary`: Interface that includes method signatures for components that utilize a dictionary for text values.
- `OverlaySpinner` from the current directory: A React component displayed during loading or processing states.

## Structure

The component `PackageValidatingOverlay` is defined using functional component syntax enhanced with TypeScript for prop types.

### Interface Definition

- `IPackageValidatingOverlayProps` extends `IComponentWithDictionary` and includes three boolean properties:
  - `isFullMaintenance`: Indicates if the system is in full maintenance mode.
  - `isNavigationBooking`: Indicates if the current operation involves navigation booking.
  - `isValidatingPackage`: Indicates if the package validation process is ongoing.

### Component Definition

- `PackageValidatingOverlay`: A functional component typed with `FC<IPackageValidatingOverlayProps>`.
- The component uses a ternary operator to conditionally render the `OverlaySpinner` based on the props provided.

## Logic

The component renders based on the following conditions:
- It will not render (`returns null`) if `isFullMaintenance` is `true`.
- It renders the `OverlaySpinner` if `isValidatingPackage` is `true` or `isNavigationBooking` is `true`.

### OverlaySpinner Props

- `header`: The text for the `OverlaySpinner` is fetched using `getPhrase` method from the injected stores, with the phrase key provided by `SitecoreDictionary.GlobalsLabelsValidatingPackage`.

### MobX Store Injection

The `inject` function is used to connect the MobX stores to the component props:
- `isValidatingPackage`, `isNavigationBooking`, and `isFullMaintenance` are mapped from respective stores (`bookingStore`, `appStore`, `layoutStore`).
- `getPhrase` method is also injected from the `layoutStore` to facilitate fetching phrases for localization.

This structure allows the component to be reactive to changes in the MobX state, updating the UI accordingly when the state changes related to package validation, navigation booking, or maintenance mode.