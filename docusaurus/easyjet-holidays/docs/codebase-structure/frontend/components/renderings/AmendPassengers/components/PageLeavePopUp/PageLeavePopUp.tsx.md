### Imports

The code imports several modules and components that are essential for the functionality of the `PageLeavePopUp` component:

- **React Hooks**: `useEffect` from `react` for handling side-effects.
- **Sitecore JSS**: `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields with Sitecore integration.
- **Custom Hooks and Components**:
  - `useStore` from `frontend/hooks/useStore` to access the application's state management.
  - `Button`, `JSSImage`, and `Popup` from `frontend/components/common` which are reusable UI components.
  - `SvgChevronLeft` from `frontend/components/icons-new/ChevronLeft` for displaying a back icon.
- **Local Store Hook**: `useAmendPassengersLocalStore` from `frontend/components/renderings/AmendPassengers/stores/amendPassengerLocalStore` to manage state specific to the Amend Passengers component.
- **Models and Interfaces**:
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for referencing dictionary keys.
  - `IAmendPassengersFields` interface to type-check the properties related to passenger amendment fields.
- **Styles**: `styles` from `./PageLeavePopUp.module.scss` for component-specific styling.

### Structure

The `PageLeavePopUp` component is defined as a functional component that takes `IAmendGuestPopupProps` as props. The props include:

- `isLoading`: Boolean indicating if the component is in a loading state.
- `onCancel`: Function to call when the cancel action is triggered.
- `onClose`: Function to call when the close action is triggered.
- `onSave`: Function to call when the save action is triggered.
- `fields`: Optional `IAmendPassengersFields` containing various text fields and icons used within the popup.

The component structure includes:

- **Header Button**: A back button with an icon and text, conditional on `HeaderBackText.value`.
- **Title Section**: Displays a warning icon and a title, conditional on `PopupWarningIcon` and `UnsavedPopupTitle.value`.
- **Subtext**: A paragraph displaying additional information, conditional on `UnsavedPopupSubtext.value`.
- **Buttons Section**: Contains two buttons for cancelling changes and saving changes, with styling conditional on the screen size.

### Logic

The component utilizes several logical constructs:

- **useEffect Hook**: Used to trigger a tracking event when the component mounts, specifically if `UnsavedPopupSubtext.value` is available.
- **Responsive Button Styling**: The cancel button's style changes based on the screen size, checked by `isScreenLessMedium`.
- **Dynamic Text Retrieval**: Text for buttons is dynamically retrieved using `getPhrase` function, passing keys from `SitecoreDictionary`.
- **Conditional Rendering**: Several elements are conditionally rendered based on the existence of values in the `fields` prop.

The logic ensures that the component reacts appropriately to changes in its environment (like screen size) and internal state (like loading status), and integrates well with the broader application's state management and Sitecore's content management capabilities.