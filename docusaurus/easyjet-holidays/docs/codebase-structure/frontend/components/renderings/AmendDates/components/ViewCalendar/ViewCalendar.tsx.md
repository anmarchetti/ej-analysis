### Imports

The `ViewCalendar` component relies on several imports from various modules:

- **React and MobX:** 
  - `React` and `useMemo` from the `react` library for managing the component lifecycle and memoizing values.
  - `observer` from `mobx-react` to make the component reactive to MobX state changes.

- **Custom Hooks and Stores:**
  - `useStore` from `frontend/hooks/useStore` is a custom hook for accessing MobX stores.
  - `IHolidaysStores` from `frontend/store/holidays` defines the TypeScript interface for the holidays-related stores.

- **Components and Models:**
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` provides enums for dictionary keys.
  - `Calendar` and `CalendarType` from `frontend/components/common/Calendar` and `frontend/components/common/Calendar/IDatePickerProps` respectively, for displaying a calendar and its props.
  - `CalendarSkeleton` from `frontend/components/renderings/AmendDates/components/CalendarSkeleton/CalendarSkeleton` is used as a loading placeholder.

### Structure

The `ViewCalendar` function component is structured as follows:

- **MobX Store Hook:**
  - `useStore` is utilized to extract necessary state and actions from the MobX stores related to holiday amendments, such as `amendDatesStore` and `layoutStore`.

- **Memoized Values:**
  - `desktopCalendarEndDate` is derived using `useMemo` to adjust the `calendarEndDate` by subtracting one month for desktop display, addressing a specific UI issue.

### Logic

The component's logic can be summarized in the following key functionalities:

- **Error Handling:**
  - Early return of an error message if `isError` is true, preventing further execution and rendering of the component.

- **Loading State:**
  - Displays `CalendarSkeleton` if `availableDates` are not present or if initial data is still loading, providing a visual feedback to the user during data fetching.

- **Calendar Configuration:**
  - The `Calendar` component is configured with various props such as `calendarType`, `selectedMonth`, `setSelectedMonth`, and others to manage the display and interaction with the calendar.

- **Conditional Rendering and Actions:**
  - Disables the "Continue" button based on the `numberOfNights` and whether dates have been changed (`isDatesChanged`).
  - Handles month selection and date setting through respective functions passed as props.
  - Triggers date submission through `submitDates` when the "Continue" button is clicked.

- **Accessibility and UX Enhancements:**
  - Automatically focuses on the calendar when the component mounts (`focusOnMount`), improving user experience and accessibility.

This technical structure ensures that `ViewCalendar` is a responsive and interactive component, handling state management, UI updates, and user interactions efficiently.