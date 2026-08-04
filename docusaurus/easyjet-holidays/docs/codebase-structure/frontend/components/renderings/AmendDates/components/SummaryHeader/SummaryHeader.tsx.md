## Imports

The `SummaryHeader` component uses several imports from various sources to function correctly:

- **MobX React**: `observer` is imported to make the component reactive to state changes.
- **Constants and Utilities**:
  - `DATE_FORMATS` from `code/dates` for handling date formats.
  - `getBookingAirportCodes` from `frontend/utils/airports.utils` to fetch airport codes based on booking information.
  - `formatDateL10n` from `frontend/utils/date.utils` for localizing date formats.
- **Hooks**:
  - `useStore` from `frontend/hooks/useStore` to access MobX stores.
- **Store Types**:
  - `IHolidaysStores` from `frontend/store/holidays` to type-check the stores used in the component.
- **Models**:
  - `IBookingInfo` from `models/data/IBookingInfo` to type-check the booking information.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing dictionary entries.
- **Components**:
  - `Button` from `frontend/components/common/Button` for rendering buttons.
  - `IconCalendar` and `SVGDepartureFilled` from `frontend/components/icons` for displaying icons.
- **Styling**:
  - `styles` from `./SummaryHeader.module.scss` for component-specific styles.

## Structure

The `SummaryHeader` component is a functional React component utilizing TypeScript for props definition:

- **Props**:
  - `numberOfNightsLabel`: A string that describes the number of nights for a booking.

- **Component Definition**:
  - The component uses the `useStore` hook to extract necessary data from the MobX store related to holiday bookings. This includes booking details, dates, and loading states.
  - It conditionally renders based on the `numberOfNights` value. If `numberOfNights` is `0`, it returns `null`, preventing the component from rendering.

- **JSX Structure**:
  - The main container div with a `summaryHeader` class.
  - Inside, it has flight details displaying departure and arrival information with airport codes and dates.
  - Duration of the stay is shown using the `IconCalendar` and `numberOfNightsLabel`.
  - A `Button` component is used to allow users to submit date changes if dates have been modified.

## Logic

- **Data Fetching**:
  - The component fetches booking details and dates from the MobX store using the `useStore` hook, which is customized for MobX state management.
  - Airport codes are derived from the booking information using a utility function.

- **Conditional Rendering**:
  - The component only renders if `numberOfNights` is greater than `0`. This prevents unnecessary rendering and potential errors in case of invalid data.

- **Date Handling**:
  - Dates are formatted using the `formatDateL10n` utility, which applies localization based on predefined date formats.

- **Button Logic**:
  - The button to submit new dates is enabled only if the dates have been changed (`isDatesChanged`).
  - It also handles loading states (`isSubmitDatesLoading`) to provide feedback to the user during data submission.

- **MobX Integration**:
  - The use of `observer` from `mobx-react` ensures that the component re-renders in response to relevant changes in the MobX state tree, making the UI reactive and consistent with the application state.