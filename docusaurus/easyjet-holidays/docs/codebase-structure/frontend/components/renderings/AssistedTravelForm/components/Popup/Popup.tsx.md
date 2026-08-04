### Imports

The code begins with importing necessary libraries and components:

- `FC` from `react` for typing the functional component.
- `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.
- Various custom components and utilities:
  - `Tokens` from `code/tokens` for using predefined tokens.
  - `Tokenizer` from `frontend/utils/tokenizer` for replacing tokens in strings.
  - `IPopupFields` from `models/data/BaseFields` for typing the `fields` prop.
  - `Button`, `FloatingPopup`, `JSSImageNext`, and `RichTextWithLinks` from `frontend/components/common` for UI components.
- `styles` from `./Popup.module.scss` for scoped CSS modules.

### Structure

The `Popup` component is defined as a functional component using React's `FC` type, with `IPopupProps` as its prop type. The props include callbacks, optional data fields, and flags to control behavior:

- `onSecondaryBtnClick`: Function to execute when the secondary button is clicked.
- `customerFullName`: Optional string for the customer's full name.
- `disableOutsideClick`: Boolean to enable or disable closing the popup by clicking outside.
- `emailAddress`: Optional string for the customer's email address.
- `fields`: Object containing data for rendering the popup, typed by `IPopupFields`.
- `onPrimaryBtnClick`: Optional function to execute when the primary button is clicked.

The component checks if `fields` is not provided and returns `null` if true, preventing the rendering of the component without necessary data.

### Logic

The main logic of the component involves rendering a `FloatingPopup` with various interactive elements:

1. **Token Replacement**: Uses the `Tokenizer.replaceTokens` utility to insert dynamic content (like `emailAddress` and `customerFullName`) into the `Description` field from `fields`.
   
2. **Conditional Rendering**: Both primary and secondary buttons are conditionally rendered based on the existence of their respective labels. This is handled using logical AND operations to check if the label values are provided.

3. **Accessibility and Data Attributes**: The buttons are equipped with `aria-label` for accessibility and `data-tid` for testing purposes.

4. **Styling and Structure**: The popup is structured into header and body sections. The header contains an icon and a title. The body contains a rich text field with the personalized description. CSS modules are used for styling specific elements like buttons, icon, title, and description areas.

5. **FloatingPopup Props**:
   - `onClose` is linked to `onSecondaryBtnClick`.
   - `disableOutsideClick` controls if clicking outside the popup should close it.
   - `bodyClass` and `footerClass` are set using styles from CSS modules.
   - `footerContent` contains the rendered buttons with their respective styles and functionalities.

This component is designed to be a reusable UI element for displaying information in a modal popup style, with support for personalization and accessibility.