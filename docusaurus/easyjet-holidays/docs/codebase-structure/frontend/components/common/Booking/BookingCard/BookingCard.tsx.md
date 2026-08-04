## Imports

The `BookingCard` component utilizes a variety of imports from both internal and external sources:

- **React and Sitecore JSS**: 
  - `FC` from `react` for declaring the functional component.
  - `ComponentRendering` and `Text` from `@sitecore-jss/sitecore-jss-nextjs` for handling Sitecore components and text fields.

- **Utilities and Helpers**:
  - `classNames` from `classnames` for conditional class assignment.
  - `inject` from `mobx-react` for injecting MobX stores into the component.
  - Utility functions like `containsLuxuryPromoCode` from `frontend/utils/offer.utils` to determine if a booking includes a luxury promo code.

- **Data Models**:
  - `IBookingInfo` from `models/data/IBookingInfo` and other interfaces like `ISitecoreField` for type definitions.
  - Enums from `models/enum` like `SitecoreDictionary` and `SiteSettings` for standardized identifiers.

- **Components**:
  - `JSSImageNext`, `LuxuryWrapper`, `OfferCardSlider`, `PackageIcons` from various paths under `frontend/components/common` for reusable UI components.

- **Styles**:
  - `styles` from `./BookingCard.module.scss` for CSS module styles specific to the `BookingCard`.

## Structure

The `BookingCard` component is structured into several sub-components, each responsible for rendering different parts of the booking card:

- **Sub-components**:
  - `BookingCardDetails`, `BookingCardHead`, `BookingCardInfo`, `BookingCardOptions` from local paths, each handling specific aspects of the booking display.

- **Main Component**:
  - The `BookingCard` itself is a functional component that integrates the aforementioned sub-components and additional logic to manage how the booking information is displayed, particularly handling the luxury package distinction and conditional rendering based on booking status (upcoming or previous).

- **Luxury and Standard Display**:
  - The component conditionally wraps the booking card content in a `LuxuryWrapper` if the booking qualifies as a luxury package. Otherwise, it uses a standard `div` wrapper.

- **MobX Store Integration**:
  - The `BookingCard` is wrapped with `inject` to pull specific methods (`isPaymentReminderVisible`, `getSetting`, `getPhrase`) from MobX stores, facilitating dynamic data fetching and state management across the application.

## Logic

The logical flow of the `BookingCard` component is centered around the handling of booking data and UI presentation:

- **Luxury Package Detection**:
  - Utilizes `containsLuxuryPromoCode` to check if the booking's promo collections include a luxury code, affecting the rendering and styling of the card.

- **Fallback Image Configuration**:
  - Retrieves a fallback image URL from CMS settings which is used in the `OfferCardSlider` if the main images are unavailable.

- **Conditional Rendering**:
  - Elements like `PackageIcons` and `Pill` (a small icon and text component) are conditionally rendered based on the booking's data and type.

- **Data Preparation**:
  - Uses `usePreparedBookingData` hook to preprocess the booking data for optimal rendering, such as organizing images.

- **Dynamic Class Assignment**:
  - Uses `classNames` to dynamically assign CSS classes based on the booking's status and whether the payment reminder is visible, influencing the layout and styling dynamically based on state.

This structure and logic ensure that `BookingCard` is a robust, maintainable component capable of handling various states and data configurations, providing a consistent and dynamic user experience.