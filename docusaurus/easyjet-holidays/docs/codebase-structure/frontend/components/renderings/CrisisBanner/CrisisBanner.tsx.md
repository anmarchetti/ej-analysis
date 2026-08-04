### Imports

The CrisisBanner component imports several modules and components:

- **React Hooks and Functionalities**: `FC` (Functional Component) and `useState` from the `react` package are used for defining the functional component and managing state within it.
- **MobX**: `observer` from `mobx-react` for making the component reactive to observable changes in state.
- **Type Definitions and Interfaces**:
  - `ISitecoreComponent` from `models/sitecore/generic/ISitecoreComponent` for typing the props of the component based on Sitecore's component structure.
  - `ISitecoreField` and `ISitecoreCompositeField` from `models/sitecore/generic/ISitecoreField` for defining the structure of individual fields received from Sitecore.
  - `ISitecoreAirport` from `models/sitecore/IAirportsData` for typing the data structure related to airports.
- **Components**:
  - `BookingAlert` from `frontend/components/common/Booking/BookingAlert/BookingAlert` for displaying alert messages.
  - `CrisisBannerPopup` from local `components/CrisisBannerPopup/CrisisBannerPopup` for handling the popup functionality within the banner.
- **Custom Hook**: `useCrisisBanner` from local `hooks/useCrisisBanner` for business logic related to determining the visibility of the crisis banner based on certain conditions.
- **Styling**: `styles` from `frontend/components/common/Booking/BookingAlert/BookingAlert.module.scss` for applying CSS modules styling to the component.

### Structure

The component is structured as follows:

- **Interface Definition (`ICrisisBannerFields`)**: This interface specifies the shape of the data expected by the CrisisBanner component, including various fields like `AlwaysVisible`, `CTAButtonLabel`, and `ImpactedAirports`, among others.
- **Type Definition (`TCrisisBannerProps`)**: A type alias that combines the `ISitecoreComponent` generic type with the `ICrisisBannerFields` interface, effectively typing the component's props.
- **Functional Component (`CrisisBanner`)**: The main functional component that utilizes destructuring to extract `fields` from its props and employs the `useState` hook for managing the visibility state of the popup (`isPopupShown`). The component returns JSX based on the conditions evaluated within it.

### Logic

The component's logic revolves around several key functionalities:

- **State Management**: Utilizes `useState` to manage the visibility of the popup (`isPopupShown`).
- **Custom Hook Usage**: The `useCrisisBanner` hook is used to determine if the booking is impacted based on the `alwaysVisible` and `impactedAirports` fields. This determines the overall rendering and behavior of the component.
- **Conditional Rendering**: The component only renders if `fields` exist and the booking is impacted. Otherwise, it returns `null`.
- **Content Generation**: A helper function `renderContent` is defined to render the `BookingAlert` component. It accepts a boolean `isInPopup` to customize the rendering based on whether the content is shown within a popup.
- **Popup Handling**: The `CrisisBannerPopup` component is used for showing detailed information in a modal-style popup. It incorporates close functionality (`onClose`) that updates the `isPopupShown` state to `false`.

Overall, the `CrisisBanner` component integrates data handling, business logic, and presentation seamlessly to provide a responsive UI element that reacts to changes in the application state, particularly in relation to crisis situations impacting airport bookings.