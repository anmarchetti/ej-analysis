## Imports

The `ExtrasLayout` component and related sub-components use a variety of imports from internal and external libraries:

- **React and Related Libraries**:
  - `FC`, `FunctionComponent` from `react` for functional component types.
  - `observer` from `mobx-react` for making the component reactive to MobX state changes.

- **Sitecore JSS**:
  - `RichText` from `@sitecore-jss/sitecore-jss-nextjs` for rendering rich text fields from Sitecore.

- **Styling and Class Management**:
  - `classNames` for conditional class name management.

- **Utility and Hooks**:
  - Various utility functions and hooks like `useStore`, `usePoster`, `useSelectedTransfers`, and functions from `date.utils` and `luggage.utils`.

- **Constants and Models**:
  - `DATE_FORMATS`, `Tokens` for constants.
  - `ITradePortalStores`, `IPreBookingInfo`, `ISitecoreField`, `IExportHolidayQuoteFields` for TypeScript interfaces to ensure type safety.

- **Components**:
  - Several internal components such as `LuxuryWrapper`, `BookingQuoteLogos`, `TradePortalViewBookingQuote`, `BookingDetailsQuote`, and `PriceSummary`.

- **Styles**:
  - `styles` from `./ExtrasLayout.module.scss` for component-specific styling.

## Structure

The file defines two main React components:

- **`ExportHolidayFooter`**:
  - A functional component that takes `footerContent`, `offerTime`, and `offerDate` as props.
  - Uses the `Tokenizer` utility to replace tokens in the `footerContent`.

- **`ExtrasLayout`**:
  - A functional component that serves as the main layout component for displaying booking details.
  - Utilizes several hooks to fetch data from MobX stores and context.
  - Conditionally renders content based on the availability of required data fields.
  - Composes the UI using several smaller components and utility functions to manage and display complex data structures related to a booking.
  - Uses conditional styling based on the type of package (luxury or standard).

## Logic

- **Data Fetching and Management**:
  - `useStore` hook is extensively used to extract data from MobX stores. Data related to bookings, user, and layout configurations are pulled in from various stores.
  - `usePoster` and `useSelectedTransfers` hooks are used for managing poster metadata and transfer options respectively.

- **Conditional Rendering**:
  - The component returns `null` early if essential data like `fields`, `hotelInfo`, `offer.hotel`, or `packageInfo` is missing, ensuring that the component does not proceed to render with incomplete data.

- **Data Transformation**:
  - Dates are parsed and formatted using utility functions.
  - Booking information is assembled into a structured object (`IPreBookingInfo`) that is then passed down to child components.
  - Token replacement in the footer content is handled to dynamically insert dates and times.

- **Component Composition**:
  - The layout is composed of several smaller components each responsible for rendering specific parts of the booking details (e.g., logos, quotes, price summaries).
  - `LuxuryWrapper` is conditionally used to wrap content in a luxury-specific styling if the package is marked as luxury.

This structure and logic ensure that the `ExtrasLayout` component is both modular and maintainable, with clear responsibilities separated among smaller sub-components and utility functions.