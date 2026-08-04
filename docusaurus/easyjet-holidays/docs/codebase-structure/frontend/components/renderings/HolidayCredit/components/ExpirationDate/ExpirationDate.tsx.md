## Imports

The code imports various JavaScript and TypeScript modules and components to function:

- `FC` from `react` for defining functional components.
- `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore items.
- Constants `DATE_FORMATS` from a local module `code/dates`.
- Custom hooks `useMoreThenTabletViewport` and `useStore` from `frontend/hooks`.
- Type definition `IHolidaysStores` from `frontend/store/holidays`.
- Utility function `formatDateL10n` from `frontend/utils/date.utils`.
- Interface `IBalanceHistoryFields` from `models/data/IBalanceHistory`.
- Utility functions `getExpireSoonLabel` and `isCreditExpired` from `frontend/components/renderings/HolidayCredit/utils`.
- CSS module `styles` from `./ExpirationDate.module.scss` for styling the component.

## Structure

The `ExpirationDate` component is defined as a functional component using TypeScript. It accepts props of type `TExpirationDateProps`, which include:

- `expirationDate`: a string representing the date the credit will expire.
- `fields`: an object that conforms to the `IBalanceHistoryFields` interface, containing various text labels used within the component.

The component structure includes:

- A main `div` with a class `expireDate` that wraps the entire content.
- A nested `div` with class `date` that contains:
  - Conditionally rendered `Text` components based on the viewport size and whether the credit has expired.
  - A `span` that displays the formatted expiration date.
- A `span` with class `expireSoon` that displays a label indicating if the credit will expire soon.

## Logic

The component's logic revolves around date handling and responsive display:

1. **Store Access**: It uses the `useStore` hook to access the `getPhrase` method from the `layoutStore` of `IHolidaysStores`.
2. **Responsive Handling**: The `useMoreThenTabletViewport` hook is used to determine if the viewport is larger than a tablet's. This affects the text label rendering.
3. **Date Evaluation**:
   - `getExpireSoonLabel`: This function calculates whether the credit will expire soon based on the current date, `expirationDate`, and the device viewport. It also uses the `getPhrase` function for localization.
   - `isCreditExpired`: Determines whether the credit has already expired based on the current date and `expirationDate`.
4. **Conditional Rendering**: Based on the viewport size and whether the credit is expired, different labels (`ExpiredOnLabel` or `ExpiresOnLabel`) are displayed.
5. **Date Formatting**: The `expirationDate` is formatted using `formatDateL10n` with a specific date format for display.

This component is fully responsive and adjusts its display and functionality based on the device's viewport size and the state of the credit's expiration.