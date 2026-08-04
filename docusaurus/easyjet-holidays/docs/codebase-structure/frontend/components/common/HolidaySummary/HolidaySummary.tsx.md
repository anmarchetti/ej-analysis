## Imports

The `HolidaySummary` component imports a variety of dependencies to function properly:

- **React and Hooks**: Utilizes `FunctionComponent` from React and `useMemo` for memoizing calculations.
- **Classnames**: A utility to conditionally join classNames together, imported as `classNames`.
- **Custom Hooks and Utilities**:
  - `useStore`: A custom hook for accessing the Redux store state.
  - Utility functions like `getAccommodationGuestsCount` and `getGuestsAmountByType` to compute specific data related to the booking.
- **Type Definitions**:
  - Various TypeScript interfaces such as `IBookingInfo`, `IAccomData`, `ITransport`, `IUnit`, `ISelectedSeat`, `ITransfer`, `IExtraLuggageInfo` from the `models/data` directory to type the data structures used.
  - Enums like `GuestType` and `TransferType` for defining constants.
- **Component Imports**:
  - Several components like `HolidaySummaryFlights`, `HolidaySummaryBags`, etc., which represent different sections of the holiday summary.
- **Utilities and Styles**:
  - `createDataTid` function and `SummaryInfo` enum from `HolidaySummary.utils` to handle data attributes and manage component rendering order.
  - SCSS module for styling, imported as `styles`.

## Structure

The `HolidaySummary` component is structured as follows:

- **Props**: Defined by `IHolidaySummaryProps` interface, which includes all possible props that can be passed to the component such as `booking`, `flights`, `transfer`, etc.
- **Component Function**:
  - Utilizes the `useStore` custom hook to fetch the total number of hold luggage items from the store.
  - Defines local variables and memoized values like `hotelMeta`, `guestsAmountByType`, and `resolvedTransfer` to manage the display logic based on the props provided.
  - The main return block contains a `div` that maps over `summaryInfoOrder` to conditionally render child components based on the specified order and conditions.
- **Child Components Rendering**:
  - Depending on the value of `component` in the `summaryInfoOrder` array, different components are rendered with specific props passed down to handle various parts of the holiday summary like flights, luggage, transfers, etc.

## Logic

The logical flow of the `HolidaySummary` component involves several key operations:

- **Data Fetching and Memoization**:
  - Fetches data from the store related to luggage and uses `useMemo` to calculate the amounts of guests by type only when `booking` or `accom` changes.
- **Conditional Rendering**:
  - Based on the conditions such as whether there is a transfer, hold luggage, or if the package includes free kids, different sections of the summary are rendered.
  - Uses the `classNames` utility to conditionally apply CSS classes for styling based on the presence of certain props.
- **Dynamic Component Rendering**:
  - Uses a switch-case within the `.map()` function to determine which components to render based on the `summaryInfoOrder` prop, which allows for customizable ordering of the summary sections.
- **Utility Functions**:
  - Utilizes helper functions like `createDataTid` to generate consistent `data-tid` attributes for testing and styling purposes.

This component is designed to be highly customizable and responsive to the provided props, making it versatile for different booking scenarios in a travel booking application.