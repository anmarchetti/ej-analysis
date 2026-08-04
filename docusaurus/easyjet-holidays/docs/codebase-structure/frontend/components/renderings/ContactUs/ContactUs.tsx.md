## Imports

The `ContactUs` component imports a variety of dependencies to handle state management, UI rendering, validation, and more. Here's a breakdown of the key imports:

- **React-specific hooks and utilities**: `ChangeEvent`, `useEffect`, `useMemo`, `useState` from `react`.
- **Sitecore JSS**: `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields managed by Sitecore.
- **Classnames utility**: `classnames` for conditionally joining classNames together.
- **MobX**: `observer` from `mobx-react` for reactive components.
- **Configuration and hooks**: Various hooks like `useMoreThenMobileViewport`, `useReCaptcha`, and `useStore` for responsive design, reCAPTCHA integration, and state management respectively.
- **Validation and utility services**: `validationService` and `scrollToErrorBlock` from utility files to handle form validations and UI utilities.
- **Store and models**: Interfaces and enums such as `IHolidaysStores`, `ContactFormFields`, `IValidationError`, `KeyboardKey`, `SitecoreDictionary`, and `SiteSettings` to define types and constants used across the component.
- **UI components**: Various UI components like `Button`, `Checkbox`, `Drawer`, `PhonePrefix`, `RadioButton`, `RichTextWithLinks`, `ValidatableField`, and more for building the form interface.
- **Additional components and data**: Components like `CalendarWrapper`, `ContactFormDatePicker`, `CurrentlyOnHolidayPopUp`, and constants from `./data/constants` to handle specific form functionalities and data structures.

## Structure

The `ContactUs` component is structured as a functional React component utilizing hooks for state and effects management. It is wrapped in `withContactUsStore` and `observer` for MobX state management integration. The component structure is as follows:

- **State Initialization**: States are managed using `useState` for local component states like `phoneState` and `isBooked`.
- **Store Connection**: Uses `useContactUsStore` to connect to the MobX store for managing form states and actions such as `initialize`, `toggleDatePicker`, `submitContactForm`, etc.
- **Conditional Rendering**: Based on various conditions such as `isPreBookingQueryEnabled`, `contactQueryType`, `isScreenMedium`, and `isDatePickerOpen`, different parts of the form are rendered.
- **Event Handlers**: Various handlers like `onChangeDialingCode`, `onPhoneFocus`, `onPhoneBlur`, `handleChangeIsBooked`, and `onSubmitForm` to manage form interactions.
- **Utility Functions**: Functions like `scrollIntoErrors`, `phoneFilter`, and `phonePlaceholder` to assist with specific form functionalities.
- **Form Submission**: Handles form validation and submission logic within `onSubmitForm`.
- **Effect Hooks**: Uses `useEffect` for initializing the store state when the component mounts and for cleanup on unmount.

## Logic

The component logic primarily revolves around managing and submitting a contact form with various fields and validations:

- **Form Initialization**: On component mount, the `initialize` function is called with parameters based on the form configuration.
- **Responsive Handling**: Uses `useMoreThenMobileViewport` to determine if the screen size is larger than mobile for responsive layouts.
- **ReCAPTCHA**: Integration using `useReCaptcha` hook that enables reCAPTCHA based on the `isRecaptchaEnabled` flag.
- **Field Validations**: Utilizes `validationService` to check if fields are required and to validate fields on change or submission.
- **Dynamic Field Options**: `useMemo` is used to memoize options for select fields based on the form state.
- **Date Handling**: Special components and logic for handling date selection through a custom date picker.
- **Error Handling**: On form submission, if errors are present, the form scrolls to the error block after toggling error visibility.
- **MobX Actions**: Actions like `toggleDatePicker`, `clearDates`, `submitContactForm`, and more are dispatched based on user interactions.

This component is a comprehensive example of a complex form handling scenario in a modern React application with integrations like Sitecore, MobX, and responsive design considerations.