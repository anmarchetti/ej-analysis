## Imports

The `YearSwitcher` component uses several imports to function properly:

- **React and TypeScript Types:**
  - `FC` (Function Component) from `react` for typing the component.
  - `ReactDatePickerCustomHeaderProps` from `react-datepicker/dist/calendar` provides specific types for handling the custom header props of the date picker.

- **Utility and Styling:**
  - `classNames` function from `classnames` is used to conditionally join class names together.
  - `DATE_FORMATS` from `code/dates` to access date format constants.
  - `formatDateL10n` from `frontend/utils/date.utils` for formatting dates based on localization.

- **Components:**
  - `Button` from `frontend/components/common/Button` is used for creating button elements.
  - `SvgArrow` from `frontend/components/icons-new/Arrow` to display arrow icons in the buttons.

- **CSS Module:**
  - `styles` from `./YearSwitcher.module.scss` for scoped CSS styling of this component.

## Structure

The `YearSwitcher` component is defined as a functional component using TypeScript. It accepts props of type `TYearSwitcherProps`, which is a combination of selected properties from `ReactDatePickerCustomHeaderProps` and optional custom class names (`className` and `labelClassName`).

### Props Structure (`TYearSwitcherProps`):
- Inherits `monthDate`, `decreaseYear`, `increaseYear`, `prevYearButtonDisabled`, `nextYearButtonDisabled` from `ReactDatePickerCustomHeaderProps`.
- `className` (optional): Additional CSS class for the root element.
- `labelClassName` (optional): Additional CSS class for the label displaying the year.

## Logic

The component renders a UI element to switch years in a date picker interface:

- **Wrapper Element:** A `div` element that uses `classNames` to combine `styles.wrapper` with any custom class passed as `className`.

- **Previous Year Button:**
  - A `Button` component with an `aria-label` of 'Previous Year'.
  - It uses an `onClick` event linked to the `decreaseYear` function.
  - The button is disabled based on `prevYearButtonDisabled`.
  - Includes an `SvgArrow` icon.
  - Uses `dataTid` attribute for testing identification.

- **Current Year Label:**
  - A `div` displaying the current year formatted by `formatDateL10n` using the `DATE_FORMATS.year` format.
  - It also uses `classNames` to possibly add any custom class provided via `labelClassName`.
  - Includes a `data-tid` attribute for testing purposes.

- **Next Year Button:**
  - Similar to the previous year button but triggers `increaseYear` function on click.
  - Uses `nextYearButtonDisabled` to control the disabled state.
  - Also contains an `SvgArrow` icon and uses `dataTid` for testing identification.

This structure is designed to provide a simple and effective way to navigate between years in a date picker component, with clear visual indicators and accessibility features.