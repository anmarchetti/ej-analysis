## Imports

The `DatePickerButtons` component utilizes several imports:

- `useStore`: A custom hook from `frontend/hooks/useStore` for accessing the global store state.
- `TStores`: A TypeScript type from `frontend/store/IStores`, defining the structure of the stores used in the application.
- `SitecoreDictionary`: An enumeration from `models/enum/SitecoreDictionary` which contains keys for translation phrases.
- `Button`: A common button component imported from `frontend/components/common/Button`.

These imports are critical for the component's functionality, providing access to state management, utility functions, and UI components.

## Structure

The `DatePickerButtons` component is defined as a functional component in React, utilizing TypeScript for type safety. The component accepts props defined by the `IDatePickerButtonsProps` interface:

- `clearDate`: A function to clear selected dates.
- `currentDates`: An array of `Date` objects representing the currently selected dates.
- `nightsSelectedLabel`: A nullable string that provides a label for the number of selected nights.
- `numberOfNights`: The number of nights selected.
- `onApply`: A function to be called when the apply button is clicked.
- `onCloseClick`: A function to be called when the close button is clicked.

The component's JSX structure comprises two main sections within a wrapper div:
1. A div for the clear button which conditionally renders based on screen size and if dates are selected.
2. A div for the close and apply buttons.

## Logic

The component leverages the `useStore` hook to extract `getPhrase` and `isScreenMedium` methods from the global store:

- `getPhrase`: A method to retrieve localized phrases using keys from the `SitecoreDictionary`.
- `isScreenMedium`: A boolean value indicating if the current screen size is medium.

The rendering logic includes:
- **Clear Button**: This button appears if the screen is not medium-sized or if any dates are currently selected. It utilizes the `clearDate` function on click.
- **Nights Selected Label**: This label is displayed only if the screen is not medium-sized and more than zero nights are selected.
- **Close Button**: Always present, allowing the user to close the current view using the `onCloseClick` function.
- **Apply Button**: Enabled only when exactly two dates are selected, calling the `onApply` function on click.

This setup ensures that the component adapts to different screen sizes and states of date selection, providing a responsive and interactive user experience.