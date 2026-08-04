### Imports

The component imports several modules and assets:

- `React` and `FC` (Functional Component) from `react` for creating the functional component.
- Several utility functions and hooks such as `Tokens` from `code/tokens`, `useStore` from `frontend/hooks/useStore`, and `isBookingFlow` from `frontend/utils/buildSitecorePath`.
- `Tokenizer` for replacing tokens in strings, from `frontend/utils/tokenizer`.
- `SitecoreDictionary` which likely contains constants or identifiers for various text strings, from `models/enum/SitecoreDictionary`.
- `Button`, a reusable button component from `frontend/components/common/Button`.
- `styles` from a local SCSS module for styling, `./AfterResetMessage.module.scss`.

### Structure

The `AfterResetMessage` component is defined as a functional component using React's Functional Component (FC) type, with `IAfterResetMessageProps` describing its props:

- `email`: a string representing the user's email.
- `onClosePopup`: a function to be called when the popup needs to be closed.
- `afterReset`: an optional function that takes an email string and is executed after a reset action.

Inside the component:

1. **State and Context**: Utilizes the `useStore` custom hook to retrieve the `getPhrase` function from the `layoutStore`. This function is used to fetch localized phrases from the store.

2. **Event Handlers**: Defines `onLogInClick`, a function that closes the popup and optionally calls the `afterReset` function with the provided email.

3. **Rendering**: The component returns a div structure containing:
   - A main text div that displays a message indicating an email has been sent. This message is dynamically generated using the `Tokenizer.replaceToken` method to insert the user's email into the phrase.
   - An additional text div that displays a message depending on whether the current flow is a booking flow, determined by the `isBookingFlow` utility.
   - A `Button` component that allows the user to confirm they have updated their password, triggering `onLogInClick` when clicked.

### Logic

- **Phrase Retrieval**: Uses `getPhrase` from the layout store to dynamically fetch text based on the `SitecoreDictionary` keys, ensuring the component supports internationalization and can be easily adapted to different languages or text.
  
- **Conditional Text**: The message in the `additionalText` div changes based on the result of the `isBookingFlow` check, showing different messages for users inside or outside a booking flow. This is useful for providing context-specific instructions or information.

- **Dynamic Text Replacement**: Uses the `Tokenizer` utility to dynamically insert the user's email into the email sent confirmation message, enhancing the personalization of the message.

- **Event Handling**: `onLogInClick` handles user interaction by closing the modal and executing an optional callback, which is crucial for managing state transitions and user flows in the application.

This component is designed to provide a user-friendly, informative response after a password reset, with considerations for different user states and flows, and is styled and localized accordingly.