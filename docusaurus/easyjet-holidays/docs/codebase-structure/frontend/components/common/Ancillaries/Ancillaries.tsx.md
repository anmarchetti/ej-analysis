## Imports

The component imports several modules and components to create a comprehensive UI structure:

- **React Imports**: 
  - `FC` (Function Component) and `ReactNode` from `react` for typing components and their props.
  
- **Utility Imports**: 
  - `classNames` from `classnames` for conditional class assignment.
  - `observer` from `mobx-react` for making the component reactive to MobX state changes.
  
- **Custom Hooks and Store**:
  - `useStore` from `frontend/hooks/useStore` to access MobX stores.
  - `TStores` type from `frontend/store/IStores` representing the store types used in the component.
  
- **Model Imports**:
  - `ISitecoreField` and `ISitecoreImage` from `models/sitecore/generic/ISitecoreField` for typing Sitecore managed fields.
  
- **Component Imports**:
  - `OutlineBanner` from `frontend/components/common/OutlineBanner/OutlineBanner`.
  - `AncillariesHeader`, `AncillariesMainContent`, and `AncillariesRoute` from local sub-components for structured display of ancillary information.
  
- **Styles**:
  - SCSS module `styles` from `./Ancillaries.module.scss` for styling the component.

## Structure

The `Ancillaries` component is structured to accept various props that influence its rendering and behavior:

- **`IAncillariesProps`**:
  - Includes nodes like `actionPanel`, `children`, `inboundSelection`, `outboundSelection`, and optional `banners`.
  - Contains `fields` of type `IAncillariesFields` which include `Icon`, `Title`, and optionally `OutlineBannerTextContent`.
  - Accepts `params` of type `IAncillariesParams` which currently includes only `Color`.
  - Boolean `isCabinBags` and optional text fields `Description` and `Subtitle`.

- **Sub-components Usage**:
  - `AncillariesHeader` for displaying the header section.
  - `AncillariesMainContent` for the main content display including description, icon, and subtitle.
  - `AncillariesRoute` for handling route-specific displays both outbound and inbound.

- **Conditional Styling**:
  - Uses `classNames` to conditionally apply styles based on the state like `isPostBookingPages`, `isCabinBags`, and `isViewBookingPage`.

## Logic

- **Store Usage**:
  - The component uses `useStore` hook to derive state from `layoutStore` and `bookingStore`. It checks various conditions like if the current page is a booking view page, confirmation page, amend payment page, post-booking pages, flight external status, and extras page.

- **Conditional Rendering**:
  - The header and main content display conditions are based on the page type (`isConfirmationPage`, `isAmendPaymentPage`, `isFlightExternal`, `isExtrasPage`).
  - The layout changes dynamically based on whether it is a post-booking page or during amendment of payment.

- **Passing Props to Sub-components**:
  - Props like `Description`, `Icon`, `Subtitle` are passed to `AncillariesMainContent`.
  - The `AncillariesRoute` component is used twice for displaying outbound and inbound selections with respective fields.

- **Dynamic Class Assignment**:
  - Multiple classes are applied conditionally to handle different layouts and styles based on the current state of the booking or page type.

This documentation provides a high-level overview of the `Ancillaries` component focusing on its imports, structure, and logic, highlighting how it dynamically renders based on the provided props and the application state.