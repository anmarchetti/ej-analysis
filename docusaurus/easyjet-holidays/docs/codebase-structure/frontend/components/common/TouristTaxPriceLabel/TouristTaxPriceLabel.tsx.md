## Imports

The code begins by importing various modules and components necessary for its functionality:

- `FC` from `react`: Importing the `FC` type (Functional Component) from React for typing the component.
- Components and utilities:
  - `TrailingZeroDisplay` from `code/currency`: A utility for formatting currency display.
  - `Tokens` from `code/tokens`: An enumeration used for token replacement in strings.
  - `useStore` from `frontend/hooks/useStore`: A custom hook for accessing the Redux store.
  - `Tokenizer` from `frontend/utils/tokenizer`: A utility for replacing tokens in strings with dynamic values.
  - `getTouristTaxPrice` and `INVALID_TAX_VALUE` from `frontend/utils/touristTax.utils`: Utilities for calculating tourist tax and a constant representing an invalid tax value.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary`: Enumerations for dictionary keys used in the application.
  - `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks`: A React component for displaying rich text with link support.
- Styles:
  - `styles` from `./TouristTaxPriceLabel.module.scss`: Module-specific styles for the component.

## Structure

The component is defined with TypeScript interfaces and React functional components:

- **Interface `ITouristTaxPriceLabel`**:
  - Defines the shape of props the component expects:
    - `isPricePP`: Boolean indicating if the price is per person.
    - `price`: Numeric value of the base price.
    - `pricePP`: Numeric value of the price per person.
    - `touristTax`: Numeric value of the tourist tax.
    - `touristTaxPP`: Numeric value of the tourist tax per person.

- **Functional Component `TouristTaxPriceLabel`**:
  - A React functional component typed with `FC` and the props interface `ITouristTaxPriceLabel`.
  - Utilizes destructuring to extract props.

## Logic

The component's logic revolves around conditional rendering and formatting of tourist tax information:

1. **Store Hook Usage**:
   - `useStore` is used to retrieve methods from different stores:
     - `getPhrase`: Fetches phrases for labels based on keys from `SitecoreDictionary`.
     - `isTouristTaxEnabled`: Boolean indicating if tourist tax calculation is enabled.
     - `formatMoney`: Function to format money values according to specified options.

2. **Tax Calculation and Formatting**:
   - Determines which tax and price values to use based on `isPricePP`.
   - Checks if tourist tax is enabled and if the tax value is not invalid (`INVALID_TAX_VALUE`). If either condition fails, it returns `null`, not rendering the component.
   - Calculates the tourist tax using `getTouristTaxPrice` and formats it along with the price using `formatMoney`.

3. **Dynamic Label Generation**:
   - Depending on whether the price is per person, it fetches the appropriate label phrase.
   - If the calculated tax is zero, it fetches a different phrase indicating that the tax is not applicable.
   - Uses `Tokenizer` to replace tokens in the fetched phrase with the formatted tax and price values.

4. **Rendering**:
   - Renders the formatted label inside a `RichTextWithLinks` component, applying styles and passing the label as a field value.