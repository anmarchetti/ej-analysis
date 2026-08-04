## Imports

The `BookingDownloadBanner` component utilizes several imports from various libraries and local modules:

- **React and MobX**: 
  - `FC` (Function Component) from `react` for typing the component.
  - `observer` from `mobx-react` for making the component reactive to MobX state changes.

- **Hooks and Utilities**:
  - `useMobileViewport` from `frontend/hooks/useMediaQuery` to check if the viewport is mobile-sized.
  - `useStore` custom hook from `frontend/hooks/useStore` for accessing MobX stores.
  - Utility functions like `getPdfLinks`, `getPdfRequestBody`, and `getBookingPdfFileName` from `frontend/utils/viewBooking.utils` for handling PDF file operations.
  - Constants and types from `frontend/utils/tracking/viewBooking.utils` for tracking events.

- **Models**:
  - `FileType` enum from `models/enum/FileType`.
  - Interfaces `ISitecoreComponent` and `ISitecoreField` from `models/sitecore/generic` for typing Sitecore related props and fields.

- **Components**:
  - `PrintButton`, `FileDownload`, `StickyBox`, `TruncatedTooltip` from various paths under `frontend/components/common` for UI elements.
  - `SvgDownloadApp` from `frontend/components/icons-new/DownloadApp` for displaying an SVG icon.
  - `BookingReferencesDropdown` from a local relative path, a component specific to this feature.

- **Styles**:
  - `styles` from `./BookingDownloadBanner.module.scss` for component-specific styling.

## Structure

The `BookingDownloadBanner` component is structured as follows:

- **Type Definitions**:
  - `TBookingDownloadBannerFields` and `TBookingDownloadBannerProps` define the types for the component's expected props, based on the Sitecore fields and component structure.

- **Functional Component**:
  - The component is defined as a functional component using React's `FC` type, wrapped in MobX's `observer` to react to state changes.
  - It uses destructuring to extract `fields` from the component props.

- **Render Logic**:
  - Early return of `null` if essential props like `booking` or `fields` are missing.
  - The main render block is wrapped inside a `StickyBox` component, which conditionally applies stickiness based on the viewport size.
  - Inside, it renders a navigation bar (`nav` element) which contains:
    - `BookingReferencesDropdown` for displaying booking references.
    - Conditional rendering of `PrintButton` and `FileDownload` based on user's permissions and roles.
  - Uses a `TruncatedTooltip` for tooltips and a conditional rendering strategy for showing different buttons based on the user's role and device type.

## Logic

- **Store Integration**:
  - Uses `useStore` to extract `booking` and `fireViewBookingTrackingEvent` from MobX stores. It conditionally assigns the tracking event dispatcher based on whether the store is identified as a holiday store.

- **Responsive Behavior**:
  - Uses `useMobileViewport` to determine if the device is mobile and adjusts UI elements accordingly.

- **Event Handling**:
  - `fireTrackingDownloadEvent` is a curried function that prepares to dispatch tracking events when document-related actions (like printing) are initiated.

- **PDF Handling**:
  - Constructs links and request bodies for PDF downloads using utility functions tailored to the booking data.

- **Conditional Rendering**:
  - Several elements in the UI, such as download buttons and tooltips, are conditionally rendered based on the user's roles, device type, and whether certain data is available.

This component is a complex integration of user interface, state management, and responsive design, showcasing advanced patterns like conditional rendering, currying in event handlers, and integration with both local and global state.