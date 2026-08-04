## Imports

The `FlightDurationCounter` component imports several modules and assets to function properly:

- **React Functional Component**: `FC` from `react` for defining functional components.
- **Custom Hook**: `useStore` from `frontend/hooks/useStore` to access the application's store.
- **Constants**: `MAX_FLIGHT_DURATION` from `frontend/store/base/search/BaseSearchFilterStore` which defines the maximum value for flight duration.
- **Type Definitions**: `TStores` from `frontend/store/IStores` which provides typings for the store used in the `useStore` hook.
- **Enumerations**: `SitecoreDictionary` from `models/enum/SitecoreDictionary` for using dictionary keys that map to specific text values in different languages.
- **SVG Components**: `SvgMinus` and `SvgPlus` from `frontend/components/icons-new`, which are React components representing minus and plus icons respectively.
- **CSS Module**: `styles` from `./FlightDuration.module.scss` for scoped CSS styling of this component.

## Structure

The `FlightDurationCounter` is a functional component that accepts props defined by the `IFlightDurationCounterProps` interface:

- `ariaLabel`: Enum value from `SitecoreDictionary` to provide accessibility labels.
- `isDecreaseDisabled`: Boolean to disable the decrement button.
- `isIncreaseDisabled`: Boolean to disable the increment button.
- `onChange`: Function to handle changes in the value.
- `step`: Number indicating the increment/decrement step for the counter.
- `value`: Current value of the counter.

The component structure includes:

- **Decrement Button**: A button element that decreases the counter value by `step` when clicked. It's disabled based on `isDecreaseDisabled`.
- **Input Field**: A read-only input field that displays the current value of the flight duration. If the value equals `MAX_FLIGHT_DURATION`, it appends a '+' to indicate values beyond this point.
- **Increment Button**: A button element that increases the counter value by `step` when clicked. It's disabled based on `isIncreaseDisabled`.

## Logic

1. **Store Access**: The component uses the `useStore` hook to access `layoutStore.getPhrase`, a method used for retrieving localized phrases based on keys from `SitecoreDictionary`. This is used to set `aria-label` attributes for accessibility.

2. **Value Formatting**: The `updatedValue` variable is computed to check if the current `value` equals `MAX_FLIGHT_DURATION`. If true, it formats the value as a string with a '+' sign to indicate that the duration can be more than the displayed value.

3. **Event Handling**: The increment and decrement buttons have `onClick` handlers that call the `onChange` prop with the new value (`value + step` or `value - step`). The buttons are also individually disabled based on the `isIncreaseDisabled` and `isDecreaseDisabled` props to prevent changes beyond specified limits.

4. **Accessibility**: `aria-label` for each button is dynamically set using `getPhrase` to ensure the component is accessible, with labels derived from `SitecoreDictionary`.

This component effectively allows users to adjust a numeric value within defined limits, with visual feedback and full accessibility support.