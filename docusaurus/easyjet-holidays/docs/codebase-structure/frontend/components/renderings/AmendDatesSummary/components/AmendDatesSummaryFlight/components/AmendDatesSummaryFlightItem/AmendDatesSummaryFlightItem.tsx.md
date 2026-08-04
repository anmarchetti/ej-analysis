## Imports

The component `AmendDatesSummaryFlightItem` utilizes several imports:

- `FunctionComponent` from `react`: This is used to type the functional component.
- `classNames` from `classnames`: A utility function to conditionally join class names together.
- `IRoute` from `models/data/IRoute`: An interface representing the route data structure.
- `getFormattedDate` from `./AmendDatesSummaryFlightItem.utils`: A utility function to format the date details of the route.
- `styles` from `./AmendDatesSummaryFlightItem.module.scss`: Module CSS for styling the component, scoped locally to prevent conflicts.

## Structure

The component `AmendDatesSummaryFlightItem` is structured as follows:

- **Interface `IAmendDatesSummaryFlightItemProps`**: Defines the props for the component, which includes `previousRoute` and `route`, both of type `IRoute`.
- **Functional Component Definition**: The component uses destructuring to extract `route` and `previousRoute` from its props.
- **JSX Structure**:
  - A `div` element with a class `item` from `styles` serves as the container.
  - Inside the `div`, there are multiple child elements displaying the route information:
    - An `h4` element displaying the formatted date of the current route.
    - A `span` element showing the formatted departure and arrival times of the current route.
    - Another `span` detailing the departure and arrival airports.
    - Additional `span` elements showing the previous route's date and time for comparison, styled differently using `classNames` to merge styles.

## Logic

The component's logic primarily revolves around formatting and displaying data:

- **Date Formatting**: The `getFormattedDate` function is called twice, once for `route` and once for `previousRoute`, to extract formatted `date`, `departureTime`, and `arrivalTime`.
- **Data Display**:
  - Current route details are displayed prominently.
  - Previous route details are shown for comparison, using a slightly different style to distinguish them from the current details.
- **Styling Logic**:
  - The `classNames` utility is used to dynamically assign classes to the previous route details, combining `previousDetail` with either `previousDate` or a default style to indicate a visual difference between the current and previous route details.