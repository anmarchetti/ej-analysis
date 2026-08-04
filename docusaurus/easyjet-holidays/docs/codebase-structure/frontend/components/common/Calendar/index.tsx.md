## Imports

The `Calendar` component imports several modules and hooks to facilitate its functionality:

- **React Essentials**: Imports `FunctionComponent`, `useMemo`, and `useRef` from `react` for component creation, memoization, and referencing DOM elements, respectively.
- **Flatpickr**: Imports the `flatpickr` library, used for creating date picker components.
- **Custom Hooks**:
  - `useMobileViewport` from `frontend/hooks/useMediaQuery` to check if the viewport is mobile-sized.
  - `useStore` from `frontend/hooks/useStore` for accessing the Redux store.
- **Utilities**:
  - `getCountOfNightLabel` and `getFullMonthsDifference` from `frontend/utils/date.utils` for date calculations and formatting.
  - `isBackend` from `frontend/utils/isBackend` to determine if the code is running on a server.
- **Type Definitions and Components**:
  - `IHolidaysStores` from `frontend/store/holidays` for type definitions related to the holiday stores.
  - `TReactFlatpickr` from `frontend/components/common/Calendar/components/FlatPickerDynamic` for type definitions of the flatpickr component.
- **Child Components**:
  - `CalendarDesktop` and `CalendarMobile` from the current directory for rendering the calendar in desktop and mobile views respectively.
- **Prop Types**:
  - `CalendarType` from `./IDatePickerProps` for defining the type of calendar.

## Structure

The `Calendar` component is structured as follows:

- **Props**: Defined by `ICalendarProps`, which includes various properties for managing dates, actions like setting dates, clearing dates, and custom handlers.
- **Component Logic**:
  - Utilizes custom hooks (`useMobileViewport` and `useStore`) to get phrases from the store and to determine if the device is mobile.
  - Uses `useRef` to reference the Flatpickr component.
  - `useMemo` is used to calculate default and dynamic dates like `minDate` and `maxDate`.
  - The component conditionally renders either `CalendarDesktop` or `CalendarMobile` based on the viewport size.
- **Conditional Rendering**:
  - Returns `null` if the code is running on the backend.
  - Depending on whether the viewport is mobile-sized, it renders either the mobile or desktop version of the calendar.

## Logic

The component's logic revolves around handling date selections and interactions within a calendar UI:

- **Date Calculation**:
  - Calculates `minDate` and `maxDate` which are either provided through props or determined based on the current date and predefined logic.
  - Calculates `monthOptions` for the selection of months within the picker, based on the difference between `minDate` and `maxDate`.
- **Event Handling**:
  - `focusCalendar` function to focus the first available day in the calendar.
  - Propagates several event handlers such as `setDates`, `clearDates`, `confirmDates`, `onCloseClick`, `onContinueClick`, and `setPastHoliday`.
- **Labeling**:
  - Uses `getCountOfNightLabel` to generate a label for the number of selected nights, based on the `numberOfNights` prop and phrases obtained from the store.
- **Conditional Props**:
  - Passes additional props to the `CalendarDesktop` component such as `maxDate` which can be overridden by `desktopCalendarEndDate`.
- **Rendering Logic**:
  - Determines the type of calendar (`Modal` by default) and passes it along with other props to the child components.