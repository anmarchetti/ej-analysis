### Imports

The module imports several dependencies:

- `React` from the `react` package, which is the core library necessary for building React components.
- `SitecoreDictionary` from `models/enum/SitecoreDictionary`, likely a custom module that provides dictionary constants for text values such as labels or button texts.
- `SvgChevronLeft` and `SvgChevronRight` from `frontend/components/icons-new`, which are React components representing left and right chevron icons, respectively.
- `GraphNavigationButton` from the current directory, a presumably custom React component for rendering navigation buttons.
- `styles` from `./GraphNavigation.module.scss`, which contains CSS module styles specific to this component.

### Structure

The file defines a single React functional component named `GraphNavigation`. This component accepts props structured as `IGraphNavigationProps`, which is an interface that includes:

- `isNextDisabled`: A boolean indicating whether the "next" navigation button should be disabled.
- `isPrevDisabled`: A boolean indicating whether the "previous" navigation button should be disabled.
- `showNextDates`: A function to be called when the "next" button is clicked.
- `showPrevDates`: A function to be called when the "previous" button is clicked.

The `GraphNavigation` component returns a React fragment (`<>...</>`) containing two `GraphNavigationButton` components:

1. **Previous Button**:
   - Uses `SvgChevronLeft` as the icon.
   - Disabled state controlled by `isPrevDisabled`.
   - Triggers `showPrevDates` function on click.
   - Uses a `dataTid` attribute for testing purposes, set to 'prev-dates-btn'.
   - Label fetched from `SitecoreDictionary.PriceGraphButtonsPreviousDates`.

2. **Next Button**:
   - Uses `SvgChevronRight` as the icon.
   - Disabled state controlled by `isNextDisabled`.
   - Triggers `showNextDates` function on click.
   - Additional CSS class applied from `styles.next`.
   - Uses a `dataTid` attribute for testing purposes, set to 'next-dates-btn'.
   - Label fetched from `SitecoreDictionary.PriceGraphButtonsNextDates`.

### Logic

The component's logic primarily revolves around conditional rendering and event handling:

- **Conditional Rendering**: Both navigation buttons check their respective `isDisabled` prop to determine if they should be disabled. This is useful for preventing user interaction when there are no more data points to navigate through (e.g., reaching the end or start of a dataset).
  
- **Event Handling**: Each button has an `onClick` handler that invokes either the `showNextDates` or `showPrevDates` function passed via props. These functions are intended to modify the state outside of the component, likely to update the dataset being displayed in a graph.

This component is designed to be reusable and adaptable to various parts of the application where date-based navigation is required, leveraging external control through props for maximum flexibility.