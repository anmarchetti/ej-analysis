### Imports

The Breadcrumbs component imports several modules and components to function properly:

- **React**: The base library for building the component.
- **classNames**: A utility function to conditionally join classNames together.
- **observer**: A function from `mobx-react` used for making the React component reactive to MobX state changes.
- **BreadcrumbsPage**: An enumeration from `models/enum/BreadcrumbsPage` used to define constants for breadcrumb pages.
- **ISitecoreComponent**: An interface from `models/sitecore/generic/ISitecoreComponent` that defines a standard structure for Sitecore components.
- **ActionPopup**: A common component for displaying popups, imported from `frontend/components/common/ActionPopup`.
- **BreadItem**: A sub-component specific to the Breadcrumbs component.
- **useBreadcrumbs**: A custom hook that provides logic for handling breadcrumb states and interactions.
- **styles**: Specific module CSS imported from `Breadcrumbs.module.scss` for styling the Breadcrumbs component.

### Structure

The Breadcrumbs component is structured as follows:

- **IBreadcrumbsSitecoreParameters**: An interface defining the optional `ActivePage` parameter that can be passed to the component.
- **TBreadcrumbsProps**: A type alias that extends the `ISitecoreComponent` with `null` as its data type and `IBreadcrumbsSitecoreParameters` for its parameters.
- **Breadcrumbs**: The main functional component defined as an observer from MobX, making it reactive to state changes. It uses destructuring to extract various handlers and state variables from the `useBreadcrumbs` hook based on the `ActivePage` parameter.

The component conditionally renders based on `activeItemIndex`. If `activeItemIndex` is greater than -1, it displays a list of breadcrumb items and potentially an action popup if required by the selected breadcrumb.

### Logic

The logic of the Breadcrumbs component is primarily managed by the `useBreadcrumbs` hook. This hook takes the `ActivePage` parameter and returns:

- **breadItems**: An array of breadcrumb items.
- **activeItemIndex**: The index of the currently active breadcrumb item.
- **isExtrasPage**: A boolean indicating if the current page is an extras page.
- **isFlightPlusHotelFunnel**: A boolean indicating if the current funnel is for flight plus hotel bookings.
- **changeIsClickChangeButton**: A function to handle button click logic.
- **selectedBreadcrumb**: The currently selected breadcrumb item.
- **handleBreadcrumbClick**: A function to handle clicks on breadcrumb items.
- **handlePopupClose**: A function to handle the closing of a popup.
- **handlePopupContinue**: A function to handle the continuation from a popup.

The component uses conditional rendering and the `classNames` utility to dynamically assign class names based on the state. The `BreadItem` components are rendered within a loop, each receiving props that determine their appearance and behavior based on the current state and index.

Additionally, if the selected breadcrumb item has associated popup data, an `ActionPopup` component is rendered to manage actions like continue, cancel, or close events. This popup is styled and controlled based on the state provided by the `useBreadcrumbs` hook.