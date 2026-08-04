## Imports

The `OfferExtras` component uses several imports categorized as follows:

### React and Third-party Libraries
- `FunctionComponent` from `react` for typing the functional component.
- `React` for using React functionalities.
- `classNames` for conditionally joining class names together.

### Utility Functions and Hooks
- `useMobileViewport` from `frontend/hooks/useMediaQuery` to determine if the viewport is of a mobile device.
- `getRoomName` and `roomTitleNormalize` from utility files to manipulate string values related to room names.

### Components and Icons
- `EcoCertifiedPill`, `ImageWithFilter`, `UrgencyMessage`, and various icon components are imported from the `frontend/components` directory for displaying specific UI elements.

### Models
- `IBoardType`, `IRoomType`, and `ITransfer` interfaces from the `models/data` directory to type the props accurately.

### Styles
- Styles specific to the `OfferExtras` component are imported from `OfferExtras.module.scss`.

### Other
- `cmsUrls` from `code/endpoints` for constructing URLs to media resources.

## Structure

The `OfferExtras` component is structured as follows:

### Props
The component accepts `IOfferExtrasProps`, which includes:
- `boardType`: Information about the board type.
- `roomType`: Details of the room type.
- `transfer`: Transfer details.
- `avail`: Availability count, optional.
- `className`: Additional CSS class names, optional.
- `ecoFacility`: Eco certification details, optional.
- `isUrgencyMessageVisible`: Flag to control the visibility of the urgency message, optional.

### Render Logic
- **Eco Certification**: Conditionally rendered if the `ecoFacility` prop is provided and the viewport is mobile.
- **Room Details**: Displays the normalized room name with an icon. If urgency messages are enabled and applicable, they are displayed alongside the room details.
- **Board Type**: Shows the board type with an icon.
- **Transfer Details**: Rendered if transfer data is available, including a potentially grayscale image of the transfer icon and the transfer name.

## Logic

### Urgency Message
- The `useUrgencyMessageText` hook is utilized to obtain text and tooltip for the urgency message based on the `avail` prop.

### Mobile Viewport
- The `useMobileViewport` hook checks if the current viewport matches mobile dimensions, influencing how certain components are rendered (e.g., the eco certification pill).

### Conditional Classes and Rendering
- `classNames` is used extensively to conditionally apply CSS classes based on the component state, such as whether the urgency message should be rendered.

### Data Handling
- Room and board type details are normalized and managed using utility functions to ensure consistent formatting across the component.

This component effectively combines responsive design, conditional rendering, and data normalization to provide a detailed view of offer-related extras in a travel or booking application interface.