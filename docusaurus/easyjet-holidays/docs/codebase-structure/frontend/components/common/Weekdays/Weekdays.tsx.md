## Imports

The `Weekdays` component uses several imports:

- `React, { useMemo }`: Imports React and the `useMemo` hook from the React library. `useMemo` is used for memoizing the list of weekdays to avoid unnecessary recalculations on re-renders.
- `classNames`: A utility function from the `classnames` package, used for conditionally joining class names together.
- `MONDAY`: A constant imported from a module located at `code/dates`. This constant likely represents the value `1`, used to set the default start of the week.
- `getWeekdays, { WeekDayFormat }`: Imports a utility function and a TypeScript type related to formatting weekdays. These are sourced from a local module `./weekdays.utils`.
- `styles`: Imports SCSS module for styling, scoped to the `Weekdays` component. This is imported from `./Weekdays.module.scss`.

## Structure

The `Weekdays` component is defined as a functional component using TypeScript. It accepts props defined by the `IWeekdaysProps` interface:

- `className (optional)`: A string that allows custom class names to be passed to the component for styling.
- `format (optional)`: An enum `WeekDayFormat`, which dictates the format in which weekdays should be displayed (e.g., abbreviated as 'Mon' or full as 'Monday'). Defaults to `WeekDayFormat.Min`.
- `weekStart (optional)`: A number indicating which day the week should start on (0 for Sunday, 1 for Monday, etc.). Defaults to `MONDAY`.

The component uses the `useMemo` hook to compute the weekdays based on the `format` and `weekStart` props. This computation is memoized to optimize performance by preventing unnecessary recalculations during re-renders unless `format` or `weekStart` changes.

## Logic

1. **Memoization of Weekdays Calculation**:
   - The `useMemo` hook is utilized to calculate the weekdays based on the given `format` and `weekStart`. This ensures that the calculation is only re-executed when either of these dependencies changes, which is efficient if the component re-renders for other reasons.

2. **Rendering**:
   - The component renders a `div` element with a dynamic class name combined from the imported `styles.weekdays` and any `className` provided via props. This is handled by the `classNames` utility.
   - Inside this `div`, the `weekdays` array (computed previously) is mapped over to create a `span` for each day. Each `span` displays a weekday and uses the day itself as a `key`, which should be unique assuming no two days are named the same in any locale.

3. **Default Props**:
   - Default values are provided for the `format` and `weekStart` props, ensuring the component behaves predictably even if these props aren't supplied. This encapsulation of default settings makes the component more robust and easier to use in various contexts without requiring extensive configuration.