## Imports

The component imports several modules and resources necessary for its functionality:

- **classnames:** A utility to conditionally join class names together.
- **mobx-react:** Provides the `observer` decorator to enable reactive components that automatically re-render when observable data changes.
- **Constants and Tokens:** Imports constants (`ONE_HUNDRED`) and tokens (`Tokens`) used for calculations and text replacements.
- **Hooks and Utilities:** `useStore` for accessing MobX stores, and `Tokenizer` for replacing tokens in strings.
- **Models:** Enums from `SitecoreDictionary` and `SiteSettings` to utilize predefined keys and settings.
- **Components:** Reusable UI components (`Pill`, `IconInfoCircle`, `SvgCup`) for building the visual part of the pill.
- **Styles:** SCSS module (`styles`) for styling the component.

## Structure

The component `DiscountedBoardPercentagePill` is defined with TypeScript interface `IDiscountedBoardPercentagePillProps` which describes its props:

- **large:** A boolean indicating if the pill should be displayed in a large size.
- **medium:** A boolean indicating if the pill should be displayed in a medium size.
- **percent:** A number representing the discount percentage.

The component function itself begins by extracting necessary data from stores using the `useStore` hook and destructuring the props to get `percent`, `large`, and `medium`.

## Logic

1. **Store Data Extraction:**
   - `isDisabled`: Determines if the component should be disabled based on a setting from `SiteSettings`.
   - `getPhrase`: A function to retrieve phrases for localization based on keys from `SitecoreDictionary`.

2. **Early Return Conditions:**
   - The component returns `null` if it is disabled, the `percent` is less than or equal to 0, or exactly 100, avoiding rendering unnecessary or invalid states.

3. **Pill Display Logic:**
   - **Rounded Condition:** Checks if the pill should have rounded corners based on the `large` or `medium` props.
   - **Title Generation:** Uses the `Tokenizer` to dynamically insert the `percent` into a localized string template for the pill's title.

4. **Conditional Rendering:**
   - The `Pill` component is rendered with specific classes and children determined by the `rounded` condition.
   - If `rounded` is true, an additional `<span>` is rendered to display the title beside the icon.

5. **Dynamic Class Application:**
   - Class names are applied conditionally using the `classNames` utility based on the `rounded`, `large`, and `medium` props to adjust the styling dynamically.

This component effectively demonstrates the use of conditional rendering, dynamic class binding, and store-driven logic to create a responsive and localized UI element based on application settings and user-defined properties.