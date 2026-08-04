### Imports

The `DatesBasket` component utilizes several imports:

- **React Imports:**
  - `FunctionComponent` from `react` to define the component type.

- **MobX Imports:**
  - `observer` from `mobx-react` to make the component reactive to state changes in MobX stores.

- **Utility and Constant Imports:**
  - `DATE_FORMATS` from `code/dates` to access predefined date formats.
  - `formatDateL10n` from `frontend/utils/date.utils` for locale-aware date formatting.

- **Hook Imports:**
  - `useStore` from `frontend/hooks/useStore` custom hook for accessing MobX stores.

- **Type Imports:**
  - `IHolidaysStores` from `frontend/store/holidays` to type-check the stores used in the component.

- **Component and Style Imports:**
  - `SvgCalendarLined` from `frontend/components/icons-new/CalendarLined` for displaying a calendar icon.
  - `styles` from `./DatesBasket.module.scss` for CSS modules support.

### Structure

`DatesBasket` is a functional component structured as follows:

- It is defined as a `FunctionComponent` without props.
- Inside the component, the `useStore` hook is used to destructure and extract `booking`, `departureDate`, and `arrivalDate` from the MobX store.
- The JSX returned by the component consists of a `div` element containing:
  - An SVG calendar icon.
  - A paragraph element that displays formatted departure and arrival dates.

### Logic

The component's logic revolves around displaying formatted departure and arrival dates based on the store's state:

1. **Store Data Extraction:**
   - The `useStore` hook is used to pull relevant date information from the `amendDatesStore` part of the `IHolidaysStores`. It extracts the current booking details along with selected departure and arrival dates.

2. **Date Formatting:**
   - The `formatDateL10n` function is utilized to format the dates. If `departureDate` and `arrivalDate` are not explicitly set, it falls back to the departure dates found in the booking's package transport routes.

3. **Conditional Rendering:**
   - Dates are conditionally rendered based on their existence. If no `departureDate` is set, it uses the departure date from the first route in the booking's transport package. Similarly for `arrivalDate`, it uses the departure date from the second route.

4. **Styling:**
   - The component uses CSS modules for styling, with specific classes applied to the main container and the dates paragraph.

5. **MobX Reactivity:**
   - The `observer` HOC from `mobx-react` wraps the `DatesBasket` component, ensuring that it reacts to changes in the MobX store state related to dates, thereby re-rendering the component when the store updates.

This setup ensures that the component remains both maintainable and responsive to the underlying state changes in the application's stores.