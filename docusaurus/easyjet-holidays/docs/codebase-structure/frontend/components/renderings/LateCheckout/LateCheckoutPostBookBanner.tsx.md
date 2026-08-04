## Imports

The component imports several modules and components to function properly:

- **React and useState**: From the `react` package, used for creating the component and managing state.
- **Text**: From `@sitecore-jss/sitecore-jss-nextjs`, used for rendering text fields from Sitecore.
- **useStore**: A custom hook from `frontend/hooks/useStore` for accessing the Redux store state.
- **ISitecoreComponent, ISitecoreField, ISitecoreImage**: Interfaces from `models/sitecore/generic` to type-check the data received from Sitecore.
- **Button**: A common button component from `frontend/components/common`.
- **JSSImage**: A component from `frontend/components/common` for rendering images using Sitecore JSS.
- **RichTextWithLinks**: A component from `frontend/components/common` for rendering rich text content with embedded links.
- **LateCheckoutPopup and ILateCheckoutPopupFields**: A component and its interface from the current directory's `components` folder, specifically for handling the late checkout popup logic.

## Structure

The component `LateCheckoutPostBookBanner` is structured as follows:

- **Interfaces**:
  - `ILateCheckoutPostBookBannerFields`: Extends `ILateCheckoutPopupFields` to include additional fields such as `CTA`, `Description`, `Icon`, and `Title`.
  - `TLateCheckoutPostBookBannerProps`: A type definition that uses `ISitecoreComponent` with `ILateCheckoutPostBookBannerFields` to define the props of the component.

- **Component Definition**:
  - Utilizes functional component structure with hooks.
  - Uses `useState` to manage the visibility of the `LateCheckoutPopup`.
  - Uses `useStore` to extract specific values from the Redux store.

- **Conditional Rendering**:
  - The component returns `null` if required fields are not available or if the feature is disabled by Sitecore settings.

- **JSX Structure**:
  - Contains an image, title, description, and a call-to-action (CTA) button.
  - The CTA button toggles the visibility of the `LateCheckoutPopup`.
  - The `LateCheckoutPopup` component is included and controlled by local state.

## Logic

- **State Management**:
  - `isLateCheckoutPopupShown`: A boolean state that controls the visibility of the `LateCheckoutPopup`.

- **Store Data Extraction**:
  - `isConfirmationPage` and `isLateCheckoutEnabledBySitecore` are extracted from the Redux store using the `useStore` hook.

- **Conditional Rendering Logic**:
  - The component renders content based on the availability of the `fields` prop and the `isLateCheckoutEnabledBySitecore` flag.
  - The CTA button is only rendered if the user is not on the confirmation page.

- **Event Handlers**:
  - The CTA button has an `onClick` handler that sets `isLateCheckoutPopupShown` to `true`, triggering the display of the popup.
  - The `LateCheckoutPopup` receives a `closePopup` function prop that sets `isLateCheckoutPopupShown` to `false`, hiding the popup.

This component integrates tightly with Sitecore data and Redux state to dynamically render content and manage interactions based on the application's state and the user's navigation flow.