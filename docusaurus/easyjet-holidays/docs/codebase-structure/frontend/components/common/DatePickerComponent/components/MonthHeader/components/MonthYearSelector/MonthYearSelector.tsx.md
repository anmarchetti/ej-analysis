## Imports

The component imports several modules and utilities to function correctly:

- **React Essentials**: Imports `FC`, `useEffect`, `useMemo`, and `useState` from `react` for functional component creation and state management.
- **React Select**: Utilizes `Select` from `react-select` for dropdown functionality.
- **Classnames**: Uses `classNames` to conditionally apply CSS classes.
- **Day.js**: Imports `dayjs` for date manipulation.
- **Utility Functions**: Includes several utilities from `frontend/utils/date.utils` such as `createDayjsDate`, `findClosestDate`, and `isPeriodOutOfRange` for date calculations.
- **Type Definitions**: Imports `IMonthHeaderProps`, `TMonthOption`, and `TYearOption` from model files for TypeScript type checking.
- **Local Utilities**: Brings in several helper functions from `./MonthYearSelector.utils` like `createMonthOption`, `createYearOption`, `getMonthsOptions`, `getYearsOptions`, and `isOptionDisabled`.
- **Styles**: Loads module-specific styles from `./MonthYearSelector.module.scss`.

## Structure

The `MonthYearSelector` is a functional component defined using React's Functional Component (FC) type, enhanced with TypeScript for props definition:

- **Props**: Accepts `IMonthHeaderProps` which includes:
  - `monthDate`: the currently selected month and year as a `dayjs` object.
  - `changeYear` and `changeMonth`: functions to handle year and month changes.
  - `maxDate` and `minDate`: the maximum and minimum dates available for selection.
  - `onChangeShownDates`: function to update the displayed date range.

- **State Management**:
  - `selectedMonth` and `selectedYear`: State hooks initialized based on the `monthDate` prop, storing the current selections for month and year.

- **Selectors**:
  - Two `Select` components from `react-select` are used to render the month and year dropdowns, with custom styling and behavior.

## Logic

### Initialization and Updates

- **useEffect**: Watches for changes in `monthDate` and updates the `selectedMonth` and `selectedYear` states accordingly.
- **useMemo**: Caches the options for months and years to avoid unnecessary recalculations.

### Event Handlers

- **monthChangeHandler**:
  - Updates the `selectedMonth` state.
  - Calculates the new date range and invokes the `onChangeShownDates` and `changeMonth` callbacks with the new month.

- **yearChangeHandler**:
  - Updates the `selectedYear` state.
  - Checks if the new date range is out of the allowed range (`minDate` to `maxDate`).
  - If out of range, finds the closest valid date and updates the month accordingly.
  - Invokes the `onChangeShownDates` and `changeYear` callbacks with the new year.

### Helper Functions

- **calculateIfOptionDisabled**: Determines if a month option should be disabled based on the selected year and the min/max date constraints.

### Rendering

- Renders two dropdown selectors for month and year with appropriate options and handlers.
- Uses `classNames` for conditional styling and ensures accessibility with `id` attributes for each selector.