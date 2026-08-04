## Imports

The component `BalanceHistoryDesktopSubItem` imports several modules and components which are essential for its functionality:

- **React and FC (Function Component)**: Imports React library and `FC` type from `react` for creating functional components.
- **classNames**: Utility function from `classnames` to conditionally join class names together.
- **CurrencyCode**: Custom type for currency codes imported from `code/currency`.
- **DATE_FORMATS**: Constant imported from `code/dates` which contains date format configurations.
- **formatDateL10n**: Function from `frontend/utils/date.utils` used to format dates based on locale.
- **FormattedMoney and MIN_FRACTION_DIGITS**: Component and constant imported from `frontend/components/common/FormattedMoney/FormattedMoney` to format monetary values.
- **CreditItemInfo**: Component from `frontend/components/renderings/HolidayCredit/components/CreditItemInfo/CreditItemInfo` used to display credit item information.
- **dataTid**: Function or value from `frontend/components/renderings/PriceChanged/PriceChanged` used to handle test IDs.
- **styles**: Module CSS imported from `./BalanceHistoryDesktopSubItem.module.scss` for styling the component.

## Structure

The `BalanceHistoryDesktopSubItem` is a functional React component defined using TypeScript. It accepts props of type `TBalanceHistoryDesktopSubItemProps`, which include:

- `amount`: Numeric value representing the transaction amount.
- `balanceAmount`: Numeric value representing the current balance after the transaction.
- `creditLabel`: String label for the credit type.
- `currency`: Currency code which might be undefined.
- `date`: String representation of the transaction date.
- `isAmountMoreThanZero`: Boolean indicating if the amount is positive.
- `redemptionOrigin`: String describing the origin of the redemption.

The component structure is primarily a `<div>` element with various nested `<div>` elements, each serving different parts of the UI:

1. **CreditItemInfo**: Displays the credit type and redemption origin.
2. **Date Display**: Shows the formatted date of the transaction.
3. **Transaction Amount**: Conditionally displays and styles the transaction amount based on whether it is positive or negative.
4. **Balance**: Shows the formatted balance amount.

## Logic

The component's logic primarily revolves around the conditional rendering and styling based on the props:

- **Date Formatting**: Uses `formatDateL10n` to format the transaction date according to `DATE_FORMATS.dateWithAbbrMonthName`.
- **Transaction Amount Styling**: Uses `classNames` to apply different styles based on whether `isAmountMoreThanZero` is true (styles.refund) or false (styles.purchase).
- **Conditional Rendering**: The transaction amount only renders if `amount` is not zero. It displays a `+` or `-` sign based on `isAmountMoreThanZero` followed by the formatted absolute value of `amount`.
- **Balance Formatting**: The balance amount is always displayed using `FormattedMoney`, formatted with the currency and minimum fraction digits defined by `MIN_FRACTION_DIGITS`.

This component is designed to be a sub-item within a larger list or table of balance history entries, suitable for desktop displays given its name and structured styling.