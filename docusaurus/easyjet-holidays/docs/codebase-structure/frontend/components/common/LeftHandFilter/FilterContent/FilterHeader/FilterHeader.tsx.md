### Imports

The `FilterHeader` component utilizes several imports from external libraries and internal modules:

- **React and MobX**: 
  - `FC` from `react` is used to define the functional component type.
  - `observer` from `mobx-react` is used to make the component reactive to MobX state changes.

- **Internal Utilities and Components**:
  - `Tokens` from `code/tokens` provides access to token constants.
  - `useStore` from `frontend/hooks/useStore` is a custom hook for accessing MobX stores.
  - `BaseSearchFilterStore` from `frontend/store/base/search/BaseSearchFilterStore` is the type definition for the store expected in props.
  - `Tokenizer` from `frontend/utils/tokenizer` is a utility for replacing tokens in strings.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` provides access to string constants.
  - `AnimatedCounter` from `frontend/components/common/AnimatedCounter/AnimatedCounter` is a component that animates number changes.
  - `Button` from `frontend/components/common/Button` is a reusable button component.

- **Styling**:
  - `styles` from `./FilterHeader.module.scss` contains CSS module styles specific to the `FilterHeader` component.

### Structure

The `FilterHeader` component is defined as a functional component using TypeScript. It accepts a single prop, `storeInstance`, which must be an instance of `BaseSearchFilterStore`.

**Component Definition**:
- `FilterHeader` is a functional component that uses destructuring to extract `storeInstance` from its props.
- It is wrapped by `observer` from MobX, making it reactive to changes in the MobX state tree that affect the rendering of this component.

**JSX Structure**:
- The component returns a single `<div>` element with a class `filtersHeader` from the imported `styles`.
- Inside the `<div>`, there are two main elements:
  - A `<span>` that displays the count of filters and a phrase which changes based on the count. This utilizes the `AnimatedCounter` for animating the count and `Tokenizer` for string manipulation.
  - A `Button` component that is conditionally rendered based on the `amount` of filters and the `hideClearAllBtn` flag from the store. This button is used to clear all filters.

### Logic

**Store Interaction**:
- The component interacts with the `storeInstance` to manage the state related to filters. It uses the following properties and methods from the store:
  - `onClearAll`: A method to clear all filters.
  - `countableFilters`: An array representing filters that can be counted.
  - `hideClearAllBtn`: A boolean indicating whether the "Clear All" button should be hidden.

**Dynamic Content and Actions**:
- **Filter Count Display**: The `amount` variable holds the length of `countableFilters`. This value is passed to the `AnimatedCounter` for display.
- **Conditional Rendering**: The "Clear All" button is only rendered if there are filters (i.e., `amount` is not zero) and `hideClearAllBtn` is false.
- **Phrase Management**: Uses the `getPhrase` function from the layout store to fetch locale-specific phrases. The phrases are dynamically chosen based on the count of filters and are adjusted using the `Tokenizer.replaceToken` utility.

**Styling**:
- The component uses CSS modules for styling, referenced by `styles.filtersHeader` and other class names, ensuring that styles are scoped locally to the component rather than globally.