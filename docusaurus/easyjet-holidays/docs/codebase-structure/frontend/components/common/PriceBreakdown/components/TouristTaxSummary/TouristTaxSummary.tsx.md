## Imports

The `TouristTaxSummary` component imports various resources from both internal and external modules:

- **React and TypeScript**: Utilizes the `FC` type from `react` for typing the component as a Function Component.
- **Constants and Types**:
  - `CurrencyCode` and `FORMATTING_NUMBERS_LANG_MAP` are imported from `code/currency` to handle currency formatting based on the user's locale.
  - `Tokens` from `code/tokens` provides constants used for token replacements in text.
- **Hooks**:
  - `useStore` from `frontend/hooks/useStore` is used to access the Redux store state.
- **Store Types**:
  - `IHolidaysStores` from `frontend/store/holidays` defines the type for the stores related to holiday information.
- **Utilities**:
  - `Tokenizer` from `frontend/utils/tokenizer` helps in replacing tokens within strings.
- **Components**:
  - `RichTextWithLinks` and `Tooltip`, including its sub-components `TooltipTrigger` and `TooltipContent`, from `frontend/components/common` are used to display rich text and interactive tooltips.
- **Local Utils**:
  - `buildAmountToken` and `buildRateToken` from `./TouristTaxSummary.utils` are utility functions for creating tokens based on tax data.
- **Styling**:
  - Styles from `./TouristTaxSummary.module.scss` to apply CSS modules styling specific to this component.

## Structure

The `TouristTaxSummary` component is structured as follows:

- **Type Definitions**:
  - `ITouristTaxSummaryProps` defines the props expected by the component, including currency, tax data, and optional labels and tooltips.
- **Functional Component Definition**:
  - The component is defined as a functional component using TypeScript's `FC` type for props validation.
- **Tooltip Content Construction**:
  - Constructs the content for the tooltip dynamically based on the props provided, using token replacement for dynamic data insertion.
- **Rendering**:
  - The component renders two rows of tax information. Each row displays a label and the amount, formatted according to the currency.
  - The second row includes a tooltip that provides additional information on the new tourist tax.

## Logic

The component's logic revolves mainly around data formatting and dynamic content generation:

- **Store Usage**:
  - Uses the `useStore` hook to extract `formatMoney` and `lang` from the Redux store, which are used for currency formatting and determining the locale for number formatting.
- **Locale Determination**:
  - Determines the locale for number formatting based on the user's language settings, falling back to English if the language is not supported.
- **Token Replacement**:
  - Utilizes the `Tokenizer` utility to replace tokens in the tooltip text with dynamic values, such as the amount and rate of the new taxes and fees.
- **Conditional Rendering**:
  - Conditionally renders labels and tooltips based on the availability of their respective data in the props.
- **Currency Formatting**:
  - Formats the monetary values using the `formatMoney` function, ensuring that the currency display is consistent with the user's locale settings.

This component effectively combines utility functions, store data, and user interface elements to present tax information in a user-friendly format, enhanced with tooltips for additional context.