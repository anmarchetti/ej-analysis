## Imports

The `FeedbackSuccessPopup` component imports several modules and components to function properly:

- `React`: The core React library is imported to enable JSX syntax and React features.
- `useStore`: A custom React hook from `frontend/hooks/useStore` used for accessing the Redux store's state.
- `SitecoreDictionary`: An enumeration from `models/enum/SitecoreDictionary` which provides keys for translation phrases.
- `Button`: A reusable button component imported from `frontend/components/common/Button` for interactive elements in the UI.
- `Popup`: A component from `frontend/components/common/Popup` used to display modal content.

## Structure

The `FeedbackSuccessPopup` is a functional React component that receives `onClose` as a prop, which is a function meant to be called to close the popup.

### Component Props
- `onClose`: A function that gets triggered when the popup needs to be closed.

### Internal Variables
- `titleId` and `confirmButtonId`: Constants that store the IDs for HTML elements, aiding in accessibility and focus management.

### JSX Structure
The component returns a `Popup` element with several props configured for accessibility and behavior:
- `containerClass`: Adds custom styling classes.
- `isToastPopup`: A boolean that might control specific toast-like behavior (not shown in the provided code).
- `showCloseButton`: Enables a close button on the popup.
- `disableReturnFocusOnUnmount`: Prevents focus from returning to the element that had it before the popup when the popup unmounts.
- `initialFocus`: Sets the initial focus to the confirm button when the popup opens.
- `aria-labelledby`: Associates the popup with a label for accessibility purposes.

Inside the `Popup`, it includes:
- An `<h2>` element for the title, which displays a success message fetched from `SitecoreDictionary`.
- A `<p>` element for a subtitle, which provides additional information or description.
- A `Button` that when clicked, triggers the `onClose` function.

## Logic

The component uses the `useStore` hook to extract the `getPhrase` function from the `layoutStore`. This function is crucial for retrieving localized phrases for the UI elements:

- `getPhrase(SitecoreDictionary.FeedbackPopupLabelsSuccessMessageTitle)`: Fetches and displays the localized title for the success message.
- `getPhrase(SitecoreDictionary.FeedbackPopupLabelsSuccessMessageDescription)`: Fetches and displays the description for the success message.
- `getPhrase(SitecoreDictionary.FeedbackPopupButtonsBackToBooking)`: Fetches the text for the button that likely returns the user to a booking or previous page.

The `onClose` prop is used as the click handler for the `Button` component, ensuring that the popup closes when the user interacts with the button. This function is also passed to the `Popup` component's `onClose` prop to handle scenarios when the popup is closed using the close button or other means provided by the `Popup` component itself.