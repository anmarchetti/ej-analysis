## Imports

The `OfferButton` component uses several imports from various libraries and local modules:

- **React and FC**: Imports the React library and the Functional Component type (`FC`) from React for defining the component.
- **classNames**: A utility function from the `classnames` package to conditionally join classNames together.
- **observer**: From the `mobx-react` package, used to make the component reactive to MobX state changes.
- **useMobileViewport**: A custom hook imported from `frontend/hooks/useMediaQuery` to determine if the viewport is of a mobile device.
- **useStore**: A custom hook from `frontend/hooks/useStore` for accessing MobX stores.
- **isHolidayStore, isTradeStore**: Functions from `frontend/store` to check if the current store is a holiday or trade store respectively.
- **TStores**: A TypeScript type from `frontend/store/IStores` representing the structure of the stores.
- **SitecoreDictionary**: An enumeration from `models/enum/SitecoreDictionary` used for accessing string resources.
- **Link**: A custom React component from `frontend/components/common/Link` for handling navigation.

## Structure

The `OfferButton` component is defined as a functional component using TypeScript. It accepts props of type `IOfferButtonProps`, which includes:

- `link`: URL to navigate to when the button is clicked.
- `onClick`: Function to execute on button click.
- `asLink`: Optional string to redefine the element type in the `Link` component.
- `className`: Optional string for additional CSS classes.
- `label`: Optional string to override the default button text.

Within the component:

- **useStore Hook**: Used to extract methods and values from MobX stores. It conditionally includes properties based on whether the current store is a holiday or trade store.
- **useMobileViewport Hook**: Determines if the current viewport is a mobile device.
- **onSelectHoliday Function**: Handles additional logic when the button is clicked, specifically for non-mobile views and when the price is not visible.
- **Link Component**: Used to render the button, passing properties like `href`, `className`, and event handlers.

## Logic

The component's logic primarily revolves around conditional rendering and state management:

- **MobX Store Interaction**: The component interacts with MobX stores to determine phrases and visibility conditions. It uses custom logic to decide whether the price should be visible based on the type of store (holiday or trade).
- **Conditional Rendering**: The button label is conditionally set based on the `label` prop or fetched from the Sitecore dictionary using `getPhrase`.
- **Responsive Behavior**: The component adjusts its behavior based on the viewport size. For non-mobile devices, it might set additional fields in the store when the price is not visible.
- **Event Handling**: The `onSelectHoliday` function is triggered on button click, which in turn calls the provided `onClick` function from the props after executing its internal logic.
- **Styling**: Uses `classNames` to dynamically construct the class string for the button element, allowing for conditional and additional classes passed via props.

This component is wrapped with `observer` from MobX, making it reactive to changes in the relevant MobX store states.