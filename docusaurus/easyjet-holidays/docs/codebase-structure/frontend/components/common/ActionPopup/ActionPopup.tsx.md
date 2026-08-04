## Imports

The `ActionPopup` component uses several imports to function correctly:

- `FC` from `react`: This is the `FunctionComponent` type from React, used for typing the component.
- `Text` from `@sitecore-jss/sitecore-jss-nextjs`: This is a component from the Sitecore JSS library for rendering text fields that are managed in Sitecore.
- `classNames` from `classnames`: A utility function to conditionally join class names together.
- `Button` from `frontend/components/common/Button`: A custom button component used within the popup.
- `Popup` from `frontend/components/common/Popup`: A custom popup/modal component used as the container for the action popup.
- `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks`: A custom component to render rich text content which might include links.
- `styles` from `./ActionPopup.module.scss`: Module CSS for styling the `ActionPopup` component.

## Structure

The `ActionPopup` component is defined as a functional component using React's FunctionComponent type (`FC`). It accepts props defined by the `IActionPopupProps` interface, which includes:

- `onCancel`: Function to call when the cancel button is clicked.
- `onContinue`: Function to call when the continue button is clicked.
- `cancelLabel`: Optional string for the cancel button text.
- `continueLabel`: Optional string for the continue button text.
- `isBigWrapper`: Optional boolean to determine if a larger wrapper class should be applied.
- `isInnerPopup`: Optional boolean to specify if the popup is nested inside another.
- `onClose`: Optional function to call when the popup attempts to close.
- `subtitle`: Optional string for the subtitle text.
- `title`: Optional string for the title text.

The component structure includes:
- A `Popup` component wrapping the entire content.
- A `Text` component for rendering the title.
- A `RichTextWithLinks` component for rendering the subtitle.
- Two `Button` components for the actions (continue and cancel), with text rendered using the `Text` component.

## Logic

The `ActionPopup` component is primarily a presentational component but includes some logic for handling user interactions and conditional styling:

- **Conditional Classes**: Uses the `classNames` utility to conditionally apply the `bigWrapper` style based on the `isBigWrapper` prop.
- **Event Handling**: The component handles user interactions through the `onContinue` and `onCancel` functions passed as props. These functions are triggered when the respective buttons are clicked.
- **Conditional Rendering**: The popup's appearance and behavior can be modified with the `isInnerPopup` and `onClose` props, allowing it to adapt based on its usage context (e.g., as a nested popup).
- **Text Management**: Utilizes the `Text` and `RichTextWithLinks` components for managing and displaying dynamic text content, ensuring that text can be easily managed via Sitecore.

This component is designed to be reusable and adaptable for various scenarios where a user might need to confirm an action or cancel it.