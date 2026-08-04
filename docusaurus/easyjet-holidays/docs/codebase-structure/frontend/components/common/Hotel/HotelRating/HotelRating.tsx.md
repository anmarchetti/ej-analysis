## Imports

The `HotelRating` component utilizes several imports from various sources:

- **React and MobX**: 
  - `FunctionComponent` from `react` for defining functional components.
  - `observer` from `mobx-react` to make the component reactive to observable changes.

- **Utilities and Hooks**:
  - `classNames` for dynamically setting class names based on conditions.
  - `useStore` custom hook for accessing MobX stores.

- **Type Definitions**:
  - `IBookingInfo` and `IPreBookingInfo` from `models/data/IBookingInfo` for TypeScript interfaces representing booking information.

- **Components**:
  - `EcoCertifiedPill`, `StarRating`, and `TripadvisorInfo` from respective paths are imported to be used within the component to display various UI elements.

- **Utils**:
  - `getHotelMeta` function from `frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils` to extract specific metadata from the booking data.

- **Styling**:
  - CSS module from `./HotelRating.module.scss` to apply styles to the component.

## Structure

The `HotelRating` component is structured as follows:

- **Props**:
  - The component accepts a single prop `booking`, which can be of type `IBookingInfo` or `IPreBookingInfo`.

- **Component Definition**:
  - Defined as a functional component using `FunctionComponent` generic type from React, enhancing type safety by specifying the props structure.

- **Rendering**:
  - The component returns a `div` element containing:
    - `StarRating` component, which is always rendered with the `starRating` from the booking metadata.
    - `TripadvisorInfo` component, conditionally rendered if both `taRating` and `numberOfReviews` are available.
    - `EcoCertifiedPill`, conditionally rendered based on the presence of an eco facility and a tooltip, and also depends on a store value to check if eco certification is enabled on the hotel summary page.

- **Styling**:
  - Uses `classNames` to merge styles from the CSS module and a static class for additional styling.

## Logic

The component's functionality is primarily driven by the following logic:

- **Store Hook**:
  - `useStore` hook is used to extract `isEcoCertifiedEnabledOnHotelSummaryInViewBookingPage` from the `layoutStore`, determining if the eco-certified tooltip should be rendered.

- **Data Extraction**:
  - `getHotelMeta` is a utility function that extracts `starRating`, `numberOfReviews`, and `taRating` from the `booking` prop.

- **Conditional Rendering**:
  - `isRenderTA` checks if both `taRating` and `numberOfReviews` exist to decide whether to render the `TripadvisorInfo`.
  - `isRenderEcoTooltip` checks for the existence of `ecoFacility.name` and `ecoFacility.tooltip`, and additionally checks the store value to decide on rendering the `EcoCertifiedPill`.

- **Observability**:
  - The component is wrapped with `observer` from `mobx-react`, making it responsive to changes in MobX state used within the component, ensuring re-render when necessary, such as changes affecting the eco-certified tooltip visibility.

This technical documentation outlines the structure, import dependencies, and logical flow of the `HotelRating` component, providing a clear overview for developers and maintainers.