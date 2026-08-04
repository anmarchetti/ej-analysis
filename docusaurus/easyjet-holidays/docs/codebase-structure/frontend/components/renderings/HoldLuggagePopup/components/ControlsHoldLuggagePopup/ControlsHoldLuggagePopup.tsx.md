### Imports

The `ControlsHoldLuggagePopup` component utilizes several imports to facilitate its functionality:

- **React and Sitecore JSS**: 
  - `FC` from `react` for typing the functional component.
  - `RichText` from `@sitecore-jss/sitecore-jss-nextjs` for rendering rich text fields from Sitecore.

- **Utilities and Helpers**:
  - `classNames` from `classnames` for conditional class assignment.
  - `observer` from `mobx-react` to make the component reactive to MobX state changes.

- **Custom Hooks and Stores**:
  - `useStore` from `frontend/hooks/useStore` to access MobX stores.
  - `TStores` from `frontend/store/IStores` for typing the stores used in the component.
  - `isTradeStore` from `frontend/store/tradePortal` to determine if the current store is a trade store.

- **Utility Functions**:
  - `Tokenizer` from `frontend/utils/tokenizer` for replacing tokens in strings.

- **Models and Components**:
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing dictionary values.
  - `SvgMinus` and `SvgPlus` from `frontend/components/icons-new` for rendering SVG icons.

- **Styles**:
  - `styles` from `./ControlsHoldLuggagePopup.module.scss` for component-specific styling.

### Structure

The `ControlsHoldLuggagePopup` is a functional React component typed with `FC` and accepts props defined by the `IControlsHoldLuggagePopupProps` interface. These props include:
- `code`: Optional string representing a unique identifier.
- `isSport`: Boolean indicating if the item is sports equipment.
- `priceLabel`: Optional string used for displaying the price.

The component utilizes the `useStore` custom hook to extract and destructure necessary data from the MobX stores such as:
- Methods for formatting money, adding and removing bags.
- Current currency, visibility of the price, and price data.
- Methods for getting phrases from the dictionary and checking button disabled states.
- Currently selected luggage and sports equipment.

The component returns `null` if no `code` is provided. Otherwise, it renders:
- A price label if prices are visible.
- Controls for adding or removing luggage or sports equipment, including:
  - Minus button to remove an item.
  - Input field to display the count of the selected item, which is read-only.
  - Plus button to add an item.

### Logic

The component's logic revolves around rendering and managing state related to luggage or sports equipment:

- **Visibility and Accessibility**:
  - The price is only shown if it is visible according to the store's state.
  - Buttons are disabled based on the business logic provided by `isAddLuggageBtnDisabled` and `isRemoveLuggageBtnDisabled` functions, which consider the type of item and its code.

- **Dynamic Content**:
  - The `priceLabel` is dynamically constructed using the `Tokenizer.replaceToken` method to insert the formatted price into the label.

- **Interaction**:
  - Buttons are wired with `onClick` handlers that call `addBag` or `removeBag` with appropriate parameters based on the item type and code.
  - The input field prevents user interaction using `onMouseDown` to maintain control over the input value via the component's state rather than allowing direct user modification.

This component is wrapped with `observer` from MobX, enabling it to react to changes in the MobX store's state and re-render as needed, ensuring the UI is always up-to-date with the latest store state.