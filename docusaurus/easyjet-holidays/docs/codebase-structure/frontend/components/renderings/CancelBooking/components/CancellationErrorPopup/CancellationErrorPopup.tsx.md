## Imports

The `CancellationErrorPopup` component imports several libraries and components which are essential for its functioning:

- `React, { FC }` from `react`: Imports React and its functional component type (FC) for creating functional components.
- `Text` from `@sitecore-jss/sitecore-jss-nextjs`: Used to render text fields from Sitecore in a React application.
- `observer` from `mobx-react`: Enhances the component to react to changes in MobX stores.
- `useStore` from `frontend/hooks/useStore`: A custom hook for accessing MobX stores.
- `TStores` from `frontend/store/IStores`: Type definitions for the stores used in the application.
- `ISitecoreField` from `models/sitecore/generic/ISitecoreField`: Interface for Sitecore field types.
- `Button` and `FloatingPopup` from `frontend/components/common`: Reusable UI components for buttons and pop-up modals.
- `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks`: A component to render rich text with links.
- `styles` from `./CancellationErrorPopup.module.scss`: Module-specific styles for the `CancellationErrorPopup` component.

## Structure

The component defines two TypeScript interfaces for its props:

- `ICancellationErrorPopupFields`: Defines the structure for error popup related Sitecore fields.
- `IFailedToLoadPopupFields`: Defines the structure for failed to load popup related Sitecore fields.
- `TCancellationErrorPopupProps`: Combines both interfaces to form the complete props expected by the component.

The component `CancellationErrorPopup` is a functional component that uses destructuring to extract `fields` from its props. It utilizes the `useStore` hook to access specific methods and state from the MobX stores.

## Logic

The `CancellationErrorPopup` component performs the following logical steps:

1. **Store Access**: It uses the `useStore` hook to extract methods and state related to routing and holiday credit operations from MobX stores.
2. **Conditional Rendering**: The component checks if either `isCreditBookingFailed` or `isCancellationSummaryFailed` is true. If neither condition is met, it returns `null`, preventing the popup from rendering.
3. **Dynamic Content Selection**:
   - Based on the failure type (`isCancellationSummaryFailed`), it decides which set of fields to display (either related to general errors or specific load failures).
   - It selects the appropriate title, description, and button label based on the type of error encountered.
4. **Rendering**:
   - The `FloatingPopup` component is used to render the popup modal, which takes a button and rich text content.
   - The `Button` component is rendered within the footer of `FloatingPopup`, and it triggers `redirectToViewBookingPage` when clicked.
   - The `Text` component displays the dynamic title, and `RichTextWithLinks` renders the description content.

The component is wrapped with `observer` from MobX, making it reactive to changes in the state accessed via the `useStore` hook, ensuring the UI updates appropriately when state changes related to booking failures occur.