## Imports

The `BalanceHistoryMobileItem` component relies on several imports, categorized broadly into React-related, utility functions, components, models, styles, and constants:

1. **React and Sitecore JSS:**
   - `React` and `FC` (Functional Component) from 'react' for creating the component.
   - `Text` from '@sitecore-jss/sitecore-jss-nextjs' for rendering Sitecore managed text fields.

2. **Utility Functions and Hooks:**
   - `classNames` from 'classnames' for conditional class assignment.
   - `useMoreThenMobileViewport` from 'frontend/hooks/useMediaQuery' for responsive design behavior.
   - `formatDateL10n` from 'frontend/utils/date.utils' for localized date formatting.

3. **Models:**
   - `IBalanceHistoryFields`, `IBalanceHistoryItem` from 'models/data/IBalanceHistory'.
   - `ISitecoreField`, `ISitecoreImage` from 'models/sitecore/generic/ISitecoreField'.

4. **Components:**
   - `FormattedMoney` and `MIN_FRACTION_DIGITS` from 'frontend/components/common/FormattedMoney/FormattedMoney'.
   - `ShowMoreButton` from 'frontend/components/common/ShowMoreButton'.
   - `BalanceHistoryChip` and `BalanceOrderStatuses` from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryChip/BalanceHistoryChip'.
   - `BalanceHistorySubItem` from 'frontend/components/renderings/HolidayCredit/components/BalanceHistorySubItem/BalanceHistorySubItem'.
   - `CreditItemInfo` from 'frontend/components/renderings/HolidayCredit/components/CreditItemInfo/CreditItemInfo'.
   - `ExpirationDate` from 'frontend/components/renderings/HolidayCredit/components/ExpirationDate/ExpirationDate'.

5. **Constants and Helpers:**
   - `CurrencyCode` from 'code/currency'.
   - `DATE_FORMATS` from 'code/dates'.
   - `getBalanceOnStep` from 'frontend/components/renderings/HolidayCredit/utils'.

6. **Styles:**
   - Imported SCSS module `styles` from './BalanceHistoryMobileItem.module.scss' for component-specific styling.

## Structure

The `BalanceHistoryMobileItem` is a React functional component accepting several props defined by `TBalanceHistoryMobileItemProps`. These props manage the configuration and behavior of the component, including data display and interaction.

### Props

- **Data Props:** These include `creditItem`, `fields`, and `currency`, which are used to display specific information about the credit item and its context.
- **State and UI Props:** Such as `isDisabled`, `isItemExpanded`, `isDrawerExpanded`, which control the UI state.
- **Event Handlers:** `handleExpand` to manage interactions like expanding or collapsing the item.
- **Optional Props:** `LogoImage`, `isInsideDrawer`, `isRecentCredit`, `withoutBorderTop` for additional UI control.

### Main JSX Structure

The component returns a single `button` element with dynamic classes and a conditional `onClick` handler. Inside the button:
- **Card Header:** Displays the status chip, balance amount, and a show more button.
- **Credit Information:** Shows the type, description, and issue date of the credit.
- **Details Section:** Conditionally rendered based on expansion state, displaying sub-items for each redemption.

## Logic

1. **Responsive Handling:** Utilizes `useMoreThenMobileViewport` to determine if the viewport is larger than mobile for conditional rendering and interaction logic.
2. **Conditional Rendering and Class Assignment:** Uses `classNames` to apply CSS classes based on the component's state (e.g., disabled, expanded).
3. **Event Handling:** The main button's `onClick` is conditionally set based on the viewport size to prevent unnecessary interactions on larger screens.
4. **Data Formatting and Display:**
   - Uses `FormattedMoney` for currency formatting.
   - Uses `formatDateL10n` for displaying formatted dates.
   - Sitecore's `Text` component is used for rendering text fields managed by Sitecore, ensuring proper content management and localization.

This component is designed to be highly configurable and responsive, adapting its behavior and presentation according to the data passed and the client's device characteristics.