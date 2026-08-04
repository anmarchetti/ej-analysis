## Imports

The `ContactUsBanner` component utilizes several imports from various modules:

- **React and MobX**: 
  - `FC` (Function Component) and `useState` are imported from `react` for building functional components and managing state, respectively.
  - `observer` from `mobx-react` is used to make the component reactive to MobX store changes.

- **Custom Hooks and Utilities**:
  - `useStore` is a custom hook from `frontend/hooks/useStore` for accessing MobX stores.
  - `isSitecoreCheckboxSelected` is a utility function from `frontend/utils/sitecore.utils` that helps in checking the state of checkboxes managed by Sitecore.

- **Type Definitions**:
  - Several interfaces and types are imported from `models/sitecore/generic` to define the structure of the Sitecore data passed to the component.

- **UI Components**:
  - `ActionCard` and `Button` from `frontend/components/common` are React components used for rendering UI elements.
  - `SvgSupport` from `frontend/components/icons-new/Support` is an SVG icon component.

- **Sub-components**:
  - `ContactUsPopup` from `./components/ContactUsPopup/ContactUsPopup` is a sub-component used for displaying a modal popup.

- **Styling**:
  - `styles` from `./ContactUsBanner.module.scss` contains module-specific styles.

## Structure

The `ContactUsBanner` component is defined as a functional component that accepts props of type `TContactUsBannerProps`. This type combines Sitecore component-specific fields and rendering parameters with an optional `isOutlined` boolean flag.

### Interfaces and Types

- **`IContactUsBannerRenderingParameters`**: Defines whether to show only a button based on the `ShowButtonOnly` Sitecore checkbox field.
- **`IContactChannelFields` and `IContactUsBannerFields`**: Define the structure of data fields expected from Sitecore for the banner and its contact channels.
- **`TContactUsBannerProps`**: A type that extends the generic Sitecore component structure to include specific fields and rendering parameters for the banner.

## Logic

### State Management

- `isPopupShown`: A state managed by `useState` to control the visibility of the `ContactUsPopup` component.

### Computed Values and Conditions

- The component uses the `useStore` hook to derive values from the MobX store, such as booking details and flags indicating the type of booking or portal.
- `hideOnCancelledBookingPage`: A boolean that determines if the banner should be hidden based on the booking status and page type.

### Rendering Logic

- The component early returns `null` if required fields or conditions are not met (e.g., no fields data, no booking, or specific page conditions).
- Depending on the `ShowButtonOnly` parameter, it conditionally renders either a `Button` or an `ActionCard` that contains a `Button`.
- The `getContactChannel` function determines which set of contact channels to use based on the booking's characteristics.
- The `ContactUsPopup` is rendered with props passed down from the `ContactUsBanner`'s state and calculated values.

### Event Handlers

- `togglePopup`: A function to toggle the visibility of the `ContactUsPopup`.

This component integrates tightly with Sitecore-managed data and MobX state management to provide a dynamic, conditionally rendered UI based on the backend data and user interactions.