## Imports

The `ChangeFeeTooltipMobile` component uses several imports from different sources:

- **React and Hooks**: Imports `FC` (Function Component) and `useState` from `react` for component and state management.
- **Sitecore JSS**: Imports `RichText` and `Text` from `@sitecore-jss/sitecore-jss-react` for rendering rich text and text fields from Sitecore.
- **Custom Utilities and Components**:
  - `TrailingZeroDisplay` from `code/currency` for formatting currency display.
  - `Tokens` from `code/tokens` for handling token replacements in strings.
  - `useStore` from `frontend/hooks/useStore` for accessing Redux store state.
  - `Tokenizer` from `frontend/utils/tokenizer` for replacing tokens in text.
  - `Button` and `HeightAnimatedContainer` from `frontend/components/common` for reusable UI components.
  - `SvgInfoFilled` from `frontend/components/icons-new` for using an SVG icon.
- **Models and Types**:
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing dictionary values.
  - `ISitecoreComponent` from `models/sitecore/generic/ISitecoreComponent` for typing props according to Sitecore component standards.
  - `IChangeFeeInfoFields` from `frontend/components/renderings/ChangeFeeInfo/ChangeFeeInfo` for typing the fields specific to the component.
- **Styling**: Imports `styles` from `./ChangeFeeTooltipMobile.module.scss` for component-specific styles.

## Structure

The `ChangeFeeTooltipMobile` component is structured as follows:

- **Type Definition**: Defines `TChangeFeeTooltipMobileProps` as a type that extends `ISitecoreComponent` with `IChangeFeeInfoFields`.
- **Functional Component**:
  - Utilizes `useState` to manage the tooltip's visibility state.
  - Uses `useStore` hook to derive necessary methods and values from the Redux store, specifically from `layoutStore`, `marketStore`, and `amendHotelStore`.
  - Conditionally renders based on the presence of `fields` and `amendHotelFeePP`.
  - Extracts and processes necessary fields from `fields` prop.
  - Handles the display of the tooltip and its content, including a button to open the tooltip, the overlay, and the tooltip popup itself, which includes a title, description, and a close button.

## Logic

The component's logic is primarily focused on displaying and managing the state of a tooltip:

- **State Management**:
  - `isTooltipOpen`: A boolean state managed by `useState` to control the visibility of the tooltip.
- **Conditional Rendering**:
  - The component returns `null` if either `fields` is not provided or `amendHotelFeePP` is falsy, meaning there's no fee information to display.
- **Event Handling**:
  - The button to open the tooltip sets `isTooltipOpen` to `true`.
  - The close button within the tooltip sets `isTooltipOpen` to `false`.
- **Data Formatting and Token Replacement**:
  - `formatMoney` is used to format `amendHotelFeePP` with specific display rules.
  - `Tokenizer.replaceToken` and `Tokenizer.replaceTokens` are used to insert dynamic content (like prices) into predefined text templates fetched from the Sitecore dictionary.
- **Accessibility**:
  - Ensures that the button to open the tooltip has an `aria-label` for screen readers, which is derived from `TooltipIconAriaLabelMobile`.