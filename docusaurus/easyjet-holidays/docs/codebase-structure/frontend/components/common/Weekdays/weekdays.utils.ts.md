### Imports

The code imports the `dayjs` library, which is a popular lightweight JavaScript library used to manipulate, parse, and format dates. This library is used to retrieve localized weekday names in various formats.

```javascript
import dayjs from 'dayjs';
```

### Structure

#### Enum: `WeekDayFormat`

Defines the format for displaying weekdays:

- `Min`: Abbreviated, three-letter weekday (e.g., 'Mon').
- `Short`: Shortened, two-letter weekday (e.g., 'Mo').
- `Full`: Full weekday name (e.g., 'Monday').
- `Single`: First letter of the weekday (e.g., 'M').

```javascript
export enum WeekDayFormat {
    Min = 'min',
    Short = 'short',
    Full = 'full',
    Single = 'single',
}
```

#### Constants

A constant representing the number of days in a week:

```javascript
const NUMBER_OF_DAYS_IN_WEEK = 7;
```

#### Functions

1. **getOriginalWeekdays**
   - Parameters: `format` (type: `WeekDayFormat`)
   - Returns: An array of weekday names according to the specified format.
   - Uses `dayjs` methods (`weekdaysMin`, `weekdaysShort`, `weekdays`) to fetch weekday names based on the format.

2. **getWeekdays**
   - Parameters:
     - `format` (type: `WeekDayFormat`): Format of the weekday names.
     - `weekStart` (type: `number`, optional): Index of the day to start the week (0 for Sunday, 1 for Monday, etc.).
   - Returns: An array of reordered weekday names starting from the specified `weekStart`.
   - Implements a logic to reorder the weekday array so that it starts from the given `weekStart`.

### Logic

The core functionality is handled by two functions:

1. **getOriginalWeekdays**
   - Uses a `switch` statement to determine which `dayjs` method to use based on the `format` argument. It can return the weekday names in minimal, short, full, or single-letter formats.
   - For the `Single` format, it maps over the short names and extracts the first character of each.

2. **getWeekdays**
   - Retrieves the original list of weekdays in the specified format by calling `getOriginalWeekdays`.
   - If `weekStart` is provided, it reorders the array of days. This is done by mapping over the array and using modulo arithmetic to rotate the days so that the array starts from the `weekStart` index.
   - If `weekStart` is not provided, it returns the days as they are fetched from `getOriginalWeekdays`.

This structure and logic allow for flexible retrieval and display of weekday names starting from any day of the week, in various textual formats, which can be particularly useful for applications needing localized and customizable date representations.