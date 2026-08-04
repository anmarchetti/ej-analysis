## Imports

The `MaintenanceContent` component utilizes several imports:

- `classNames`: A utility function from the `classnames` package that conditionally joins class names together. It is used here for dynamically setting CSS classes.
- `useStore`: A custom React hook from `frontend/hooks/useStore` used for accessing the Redux store state.
- `isTradeStore`: A selector function from `frontend/store/tradePortal` that determines if the current store context is related to trade.
- `SitecoreDictionary`: An enumeration from `models/enum/SitecoreDictionary` which provides keys for retrieving specific phrases for localization.
- `SvgCogs`: A React component that renders an SVG icon, imported from `frontend/components/icons-new/Cogs`.
- `styles`: The module-specific CSS classes imported from `MaintenanceContent.module.scss`, which are used to style the components.

## Structure

The `MaintenanceContent` component is a functional React component. It consists of:

- **JSX Structure**: The component returns a single `div` element that wraps an `SvgCogs` icon component and two paragraph (`<p>`) elements. These elements display the title and description of the maintenance message.
- **CSS Classes**: The `div` uses a combination of static and dynamic class names. The static class is always `styles.wrapper`, and the dynamic class `isTrade` is added conditionally based on the `isTrade` flag.
- **Data Attributes**: The `div` also includes a `data-tid` attribute set to 'maintenance-content', which might be used for testing purposes to easily locate this element in the DOM.

## Logic

The logic within the `MaintenanceContent` component involves:

- **Store Access**: The `useStore` hook is used to extract methods and data from the Redux store. Specifically, it retrieves `getPhrase`, a method from `stores.layoutStore`, and `isTrade`, a boolean value determined by the `isTradeStore` selector.
- **Dynamic Text**: The text content for the title and description paragraphs is dynamically fetched using the `getPhrase` method with keys from `SitecoreDictionary`. This approach supports localization by allowing text to be easily swapped depending on the user's language or other localization settings.
- **Conditional Styling**: The `classNames` function is used to conditionally apply the `isTrade` class to the `div` element. This class is added only if the `isTrade` flag is true, which affects the styling based on whether the context is trade-related.