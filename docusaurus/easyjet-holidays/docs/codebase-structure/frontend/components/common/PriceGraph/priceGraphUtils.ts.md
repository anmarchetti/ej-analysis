## Imports

The script imports various modules and utilities that are essential for its functionality:

- **Chart.js Contexts**: 
  - `ScriptableContext` from `chart.js` for handling context within chart configurations.
  - `Context` from `chartjs-plugin-datalabels` for managing data label configurations in charts.

- **Date Utilities**:
  - `DATE_FORMATS` constant from a custom module for predefined date formats.
  - `addDays`, `formatDateL10n`, and `getDate` functions from `frontend/utils/date.utils` to manipulate and format dates.

- **Data Models**:
  - `IAlternativeOffer` and `IPriceGraphBarConfig` interfaces from `models/data` to define the structure of the data used in the functions.

- **Graph Settings**:
  - `PriceGraphSettings` from a local constants module to standardize colors and other settings for the price graph.

## Structure

The script defines several utility functions and constants to manage and display data on a price graph:

- **Utility Functions**:
  - `isEndDate`: Determines if a given date is the end date based on the selected date and holiday duration.
  - `dateFormatter`: Converts an `IAlternativeOffer` data object into an `IPriceGraphBarConfig` object, including logic to handle start and end dates as well as pricing.
  - `getFormattedDates`: Transforms an array of `IAlternativeOffer` objects into an array of `IPriceGraphBarConfig` objects using the `dateFormatter` function.
  - `getEdgeAvailableDate`: Calculates a date offset by a specified number of days from a selected date, used for loading additional data.
  - `getHolidayDates`: Generates formatted strings for the departure and return dates of a holiday.

- **Chart.js Customization Functions**:
  - `getLabelColor`: Determines the color of data labels based on the data context.
  - `getBackgroundColor`: Sets the background color of bars in the chart based on their status (active, start date, etc.).

## Logic

### Date Handling

- **End Date Calculation**:
  The `isEndDate` function checks if a given date matches the end date calculated by adding the holiday duration to the selected start date.

- **Date Formatting**:
  The `dateFormatter` function processes individual data entries to calculate whether they represent start or end dates, adjust pricing based on conditions, and format the date for display.

### Graph Data Preparation

- **Mapping Data for Graph**:
  The `getFormattedDates` function maps over an array of offer data, transforming each entry into a format suitable for graph representation using the `dateFormatter`.

### Graph Appearance Customization

- **Dynamic Styling**:
  Functions like `getLabelColor` and `getBackgroundColor` use the context of the chart and the specific data point to dynamically set colors, enhancing the visual representation based on the data state (e.g., active, start date).

### Utility Functions

- **Date Calculation**:
  The `getEdgeAvailableDate` function is used to compute dates that are used to fetch additional data, adjusting the date by a specified number of days forward or backward.

- **Holiday Date Formatting**:
  The `getHolidayDates` function formats the selected start date and calculated return date into a user-friendly string format, using localized date formats.