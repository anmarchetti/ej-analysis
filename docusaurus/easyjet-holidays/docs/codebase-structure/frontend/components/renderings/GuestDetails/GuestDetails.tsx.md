### Imports

The `GuestDetails` component relies on several imports, categorized into external libraries, model types, sub-components, utility functions, and styles:

- **External Libraries:**
  - `classnames`: A utility to conditionally join class names together.
  - `mobx-react`: Provides the `observer` function to make React components reactive when using MobX for state management.

- **Model Types:**
  - `ISitecoreComponent`: A generic interface from `models/sitecore/generic/ISitecoreComponent` that likely standardizes the structure of props for components integrated with Sitecore.
  - `IGuestPageFields`: Imported from `./GuestDetails.utils`, representing the specific shape of `fields` prop expected by the `GuestDetails` component.

- **Sub-components:**
  - `EmailVerificationSection`, `GuestDetailsFull`, `GuestDetailsSkeleton`, and `GuestPageInformation`: These are React components used within `GuestDetails` to render specific sections of the guest details page based on the state.

- **Utility Functions:**
  - `useGuestDetails`: A custom hook from `./GuestDetails.utils` that encapsulates the logic for determining the visibility and other properties of the guest details based on the input fields.

- **Styles:**
  - `styles`: Specific module CSS imported from `./GuestDetails.module.scss` to apply scoped styles to the component.

### Structure

The `GuestDetails` component is structured as follows:

- **Type Definitions:**
  - `TGuestDetailsProps`: A TypeScript type that extends the `ISitecoreComponent` interface with `IGuestPageFields`, defining the props type for the component.

- **Functional Component:**
  - `GuestDetails`: A functional component that utilizes destructuring to extract `fields` from its props.
  - Inside the component, the `useGuestDetails` hook is invoked with `fields` to derive various state properties such as `isDisplayed`, `pageTitle`, and others.

- **Conditional Rendering:**
  - The component immediately returns `null` if `isDisplayed` is false.
  - Uses the `classnames` library to conditionally apply CSS classes to the container `div`.
  - Conditionally renders sub-components and elements based on the state derived from `useGuestDetails`.

### Logic

The logical flow of the `GuestDetails` component is primarily managed through the `useGuestDetails` hook and conditional rendering statements:

- **useGuestDetails Hook:**
  - This hook processes the `fields` prop to determine various states like whether the page is visible (`isDisplayed`), whether to show email verification or guest information sections, etc.

- **Conditional Rendering:**
  - **Visibility Check:** If `isDisplayed` is false, the component renders nothing.
  - **Page Title:** Renders an `<h1>` element with the page title if `isPageTitleVisible` and `pageTitle` are truthy.
  - **Dynamic Sections:**
    - Displays a loading skeleton (`GuestDetailsSkeleton`) if `isHolidaysLoading` is true.
    - Shows the `EmailVerificationSection` if `isEmailVerificationShown` is true, passing `hasSignInPrompt` to it.
    - Renders full guest details (`GuestDetailsFull`) if `isGuestsInfoShown` is true.

- **Styling:**
  - Applies dynamic class names based on the `isAdvanced` flag using the `classnames` utility.

The component is wrapped with `observer` from `mobx-react` to ensure it reacts to changes in observable data used within `useGuestDetails`, making it responsive to state changes in MobX stores.