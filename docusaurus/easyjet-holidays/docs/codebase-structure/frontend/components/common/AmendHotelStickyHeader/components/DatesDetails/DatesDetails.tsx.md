## Imports

The `DatesDetails` component utilizes several imports to function:

1. **React Import:**
   - `FunctionComponent` from `react` - This is used to type the functional component.

2. **Custom Hooks and Utilities:**
   - `useStore` - A custom hook from `frontend/hooks/useStore` for accessing the Redux store.
   - `useNightsLabel` - A custom hook from `frontend/hooks/viewBooking.hooks` to compute the label showing the number of nights between two dates.
   - `formatDateL10n` - A utility from `frontend/utils/date.utils` for formatting dates based on localization settings.

3. **Type and Interface Imports:**
   - `IHolidaysStores` - An interface from `frontend/store/holidays` representing the structure of the holidays store.

4. **Component Import:**
   - `SvgCalendarLined` - A React component from `frontend/components/icons-new/CalendarLined` representing a calendar icon.

## Structure

The `DatesDetails` component is defined as a functional component using TypeScript with props detailed in the `IDatesDetailsProps` interface:

- `startDate` and `endDate` (both strings) are required to determine the period.
- `className` (optional string) to allow custom styling.
- `dataTid` (optional string) to facilitate easier testing through specific data attributes.
- `showOnlyDuration` (optional boolean) to optionally show only the duration (nights) without the dates.

The component structure includes:
- A wrapping `<div>` element with optional `className` and `data-tid` attributes.
- An embedded `SvgCalendarLined` icon component.
- A `<span>` element that conditionally displays either the date range and duration or only the duration, based on the `showOnlyDuration` prop.

## Logic

1. **Store Access:**
   - The `useStore` hook is employed to extract the `getPhrase` function from the `layoutStore` of the `IHolidaysStores`.

2. **Date Formatting:**
   - The `startDate` and `endDate` are formatted using the `formatDateL10n` utility. The format `'DD MMM'` is used for the start date and `'DD MMM YYYY'` for the end date.

3. **Duration Calculation:**
   - The `useNightsLabel` hook calculates the string representing the number of nights between `startDate` and `endDate` using the `getPhrase` function to handle localization of the text.

4. **Conditional Rendering:**
   - The component conditionally renders the date details. If `showOnlyDuration` is `true`, only the duration (nights) is displayed. Otherwise, both the start and end dates along with the duration are shown.

This organization of imports, structure, and logic ensures the `DatesDetails` component is both modular and maintainable, with clear separation of concerns and reusability of functionality.