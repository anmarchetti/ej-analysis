## Imports

The code imports various modules and components necessary for its operation:

- `FC` from `react`: Used to type the functional component.
- `observer` from `mobx-react`: Enhances the component to react to MobX state changes.
- Various internal imports:
  - `Tokens` from `code/tokens`: Likely constants or enums related to token management.
  - `useStore` from `frontend/hooks/useStore`: A custom hook for accessing MobX stores.
  - `Tokenizer` from `frontend/utils/tokenizer`: Utility for replacing tokens in strings.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary`: Enumerations for Sitecore dictionary keys.
  - `PillSizeVariants` from `frontend/components/common/Pills/PillWithVariants/PillSizeVariants`: Enumerations for different sizes of pills.
  - `PillWithVariants` from `frontend/components/common/Pills/PillWithVariants`: A component that renders pills with variant properties.
- `styles` from `./DiscountPercentagePill.module.scss`: Module CSS for styling the `DiscountPercentagePill` component.

## Structure

The component is structured as follows:

- **Interface `IDiscountPercentagePillProps`**: Defines the props expected by the `DiscountPercentagePill` component:
  - `icon`: A JSX element to be displayed within the pill.
  - `discountPercentage?`: An optional number representing the discount percentage.
  - `pillSize?`: An optional enum value of type `PillSizeVariants` to specify the size of the pill.
  
- **Functional Component `DiscountPercentagePill`**: A functional component that takes `IDiscountPercentagePillProps` as props. It uses the `useStore` hook to access specific methods from the MobX store:
  - `getPhrase`: A method to retrieve text based on a dictionary key.
  - `isDiscountPercentagePillEnabled`: A boolean indicating if the pill should be rendered.

## Logic

The component's logic is summarized as follows:

1. **Store Hook Usage**: It uses the `useStore` hook to destructure and obtain `getPhrase` and `isDiscountPercentagePillEnabled` from the MobX store.

2. **Conditional Rendering**: The component first checks if `isDiscountPercentagePillEnabled` is true and if `discountPercentage` is provided. If either is false, the component returns `null`, effectively not rendering anything.

3. **Content Construction**:
   - The `icon` provided in the props is used directly.
   - The `text` is constructed using the `Tokenizer.replaceTokens` method which replaces placeholders in a string fetched by `getPhrase` using the `SitecoreDictionary.DiscountForHBGHotelsText` key. It replaces the token `[Tokens.Number]` with the `discountPercentage` converted to a string.
   - The `tooltipMessage` is also fetched using `getPhrase` with the `SitecoreDictionary.DiscountForHBGHotelsTooltip` key.

4. **Component Return**: Renders the `PillWithVariants` component with the constructed `content`, `dataIdPrefix` set to 'discount-percentage', the optional `pillSize`, and class from the imported `styles`.

5. **Observer Enhancement**: The default export of the component is wrapped with `observer` from `mobx-react` to ensure the component reacts to relevant changes in the MobX state, particularly those affecting the rendering and content of the pill.