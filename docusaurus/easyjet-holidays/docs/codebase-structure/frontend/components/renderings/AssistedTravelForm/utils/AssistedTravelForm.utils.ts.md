## Imports

The code imports several TypeScript interfaces and types to ensure type safety and clarity in the functionality that handles popup interactions within the Assisted Travel Form component.

- `IPopupProps`: Interface defining the properties expected by the Popup component.
- `IAssistedTravelFormFields`: Interface defining the structure for the fields used in the Assisted Travel Form.
- `PopupType`, `Screen`: Enums used to manage various popup types and screen navigation within the form.

These imports are sourced from specific paths within the project, indicating a structured project directory focusing on modularity and separation of concerns.

## Structure

The code consists of two main exported functions:

1. **createOnContactUsClick**: A higher-order function that returns an event handler function for handling clicks related to the 'Contact Us' button. It utilizes closure to retain a reference to the `togglePopup` function.

2. **getPopupProps**: A function that takes several parameters including the current visible popup type, form fields, and functions to manage popup state and navigation. It returns properties for the Popup component based on the current popup type.

### Function Details

- **createOnContactUsClick**:
  - **Parameters**: `togglePopup` - a function that changes the current visible popup.
  - **Returns**: A function that handles mouse click events, specifically checking if the clicked element is the 'contact-us-btn'. If so, it prevents the default action and triggers the `togglePopup` function with the 'ContactUs' type.

- **getPopupProps**:
  - **Parameters**: Includes the current visible popup type, form field data, functions for toggling popups, and navigation functions.
  - **Returns**: Depending on the `visiblePopup` parameter, it returns an object conforming to the `IPopupProps` interface or `undefined` if the popup type doesn't match any case.

## Logic

### Popup Handling

- **Popup Type Handling**: The `getPopupProps` function uses a `switch` statement to determine which set of properties to return based on the `visiblePopup` parameter. Each case in the switch corresponds to a different popup type, configuring properties such as fields to display and callback functions for button clicks.

### Callback Functions

- **Button Click Handlers**: Various callback functions are set based on the popup context, such as closing the popup, navigating to different screens, or starting processes over. Some popups also disable clicking outside the popup area to force a user decision.

### Navigation and State Management

- **State Changes**: Functions like `togglePopup`, `redirectToViewBookingPage`, `startFromTheBeginning`, `goToFormStart`, and `goToScreen` are used to manage application state and navigate between different views or states within the application.

### Conditional Rendering

- Each popup configuration optionally accesses specific fields from the `fields` parameter based on the popup type, which suggests that the form fields are contextually segmented within the `IAssistedTravelFormFields` structure.

This structure and logic ensure that the popup system within the Assisted Travel Form is both flexible and robust, capable of handling various scenarios and user interactions efficiently.