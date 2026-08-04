## Imports

The `RefundOptionPopup` component imports various modules and components to function properly:

- React related:
  - `FC` and `useState` from `react` for functional component creation and state management.
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields managed by Sitecore.

- Utility and custom hooks:
  - `TrailingZeroDisplay` from `code/currency` for formatting currency display options.
  - `Tokens` from `code/tokens` for handling token replacements in strings.
  - `useStore` from `frontend/hooks/useStore` for accessing the application's store.

- Store and models:
  - `IHolidaysStores` from `frontend/store/holidays` for typing the store structure related to holiday functionalities.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing dictionary values.

- Components:
  - `Button` and `PopupNew` from `frontend/components/common` for UI elements.
  - `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks` for rendering rich text with links.
  - `IExplanationPopup` from a specific rendering component path for typing the props.

- Styles:
  - `styles` from `./RefundOptionPopup.module.scss` for component-specific styling.

## Structure

The `RefundOptionPopup` is a functional component that accepts `IRefundOptionPopupProps` as props which includes a `fields` object. The component uses React's `useState` to manage the visibility of the popup (`isPopupShown`).

The component structure is as follows:

- Conditional rendering based on the `IsLinkVisible` field from `fields`.
- A button that toggles the visibility of the popup.
- The `PopupNew` component that appears based on the `isPopupShown` state. It includes:
  - A title (`Text` component).
  - Rich text content with potential token replacements (`RichTextWithLinks`).
  - A close button in the footer.

## Logic

The component's logic revolves around displaying and managing a popup with dynamic content:

1. **Initial Check**: If `IsLinkVisible` is not true, the component returns `null`, effectively rendering nothing.

2. **State Management**: The `isPopupShown` state is managed through a button click, toggling the popup's visibility.

3. **Content Handling**:
   - The `fields` object destructured to access specific text and title fields.
   - In non-edit mode, the component formats a money value (`depositPerPassenger`) with currency formatting and replaces tokens in the text content for dynamic display. This involves:
     - Formatting the currency using `formatMoney` from the store.
     - Replacing price related tokens using `Tokenizer.replaceToken`.

4. **Popup Content**:
   - The popup includes a title and rich text content that may include dynamic token-replaced strings.
   - A close button that also toggles the visibility state (`isPopupShown`) to false.

This component is designed to be reusable wherever a refund option needs to be explained with dynamic content based on the application's state and provided props.