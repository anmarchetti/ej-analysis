## Imports

The `CheckInBanner` component utilizes several imports which are categorized into React and utility libraries, Sitecore JSS, MobX, Next.js, custom hooks, utility functions, enums, models, components, and styles:

1. **React and Libraries**:
   - `FC` from `react`: Function Component type for TypeScript.
   - `classNames` from `classnames`: A utility to conditionally join class names together.

2. **Sitecore JSS**:
   - `Text` from `@sitecore-jss/sitecore-jss-nextjs`: A helper component for rendering text fields from Sitecore JSS.

3. **MobX**:
   - `observer` from `mobx-react`: A higher-order component for reacting to changes in MobX store state.

4. **Next.js**:
   - `Link` from `next/link`: A component for client-side transitions between routes.

5. **Custom Hooks**:
   - `useStore` from `frontend/hooks/useStore`: A custom hook for accessing MobX stores.

6. **Utility Functions**:
   - `getFlightsReferences` from `frontend/utils/route.utils`: Utility to parse flight references from routes.
   - `getCheckInLink` from `frontend/utils/viewBooking.utils`: Utility to generate a check-in URL based on booking details.

7. **Enums**:
   - `BookingStatus` from `models/enum/BookingStatus`: Enum for different statuses of a booking.

8. **Models**:
   - `ISitecoreComponent` and `ISitecoreField` from `models/sitecore/generic`: Interfaces defining the structure for Sitecore components and fields.

9. **Components**:
   - `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks`: A component to render rich text content with embedded links.

10. **Styles**:
    - `styles` from `./CheckInBanner.module.scss`: Module CSS for styling the component.

## Structure

The `CheckInBanner` component is defined as a functional component using TypeScript. It accepts props of type `TCheckInBannerProps`, which is an extension of the `ISitecoreComponent` interface with specific fields (`CTALabel`, `Subtext`, `Title`) defined in the `ICheckInBannerFields` interface.

The component structure includes:
- Conditional rendering based on the availability of necessary data and conditions (e.g., booking status and check-in link).
- A main container div with nested elements for the title, subtext, and a call-to-action (CTA) button.
- Use of the `Text` and `RichTextWithLinks` components from Sitecore JSS and the custom component library respectively, for rendering content.
- A `Link` component from Next.js for the CTA button, facilitating client-side navigation.

## Logic

The component's logic revolves around several key functionalities:

1. **Store Access**:
   - Using the `useStore` hook, the component subscribes to relevant MobX stores (`viewBookingStore`, `layoutStore`, `bookingStore`) to access booking data, settings, and check-in availability.

2. **Data Handling and Conditions**:
   - Extracts flight routes from the booking and computes references using `getFlightsReferences`.
   - Checks multiple conditions to determine if the banner should be rendered, including whether the booking is canceled, if check-in is available, if there are multiple flight references, and if a valid check-in link exists.

3. **Rendering**:
   - If conditions are met, renders the UI elements with appropriate styling and data attributes for testing (`data-tid`).
   - Dynamically sets class names using the `classNames` utility based on conditions or styles configuration.

This component efficiently handles conditional rendering and integrates various functionalities from external utilities and hooks to present a dynamic check-in banner based on the booking context.