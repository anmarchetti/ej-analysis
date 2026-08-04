### Imports

The `ContactUsPopup` component imports various libraries, hooks, components, and types:

- **React and MobX libraries:**
  - `FC` from `react` for typing the functional component.
  - `observer` from `mobx-react` for making the component reactive to observable changes in MobX stores.

- **Sitecore JSS:**
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields managed by Sitecore.

- **Custom Hooks:**
  - `useMobileViewport` from `frontend/hooks/useMediaQuery` to check if the viewport is mobile-sized.
  - `useStore` from `frontend/hooks/useStore` for accessing MobX stores.

- **Types and Interfaces:**
  - `IHolidaysStores` from `frontend/store/holidays` for typing the stores related to holiday functionalities.
  - `ISitecoreField` and `TSitecoreMultiList` from `models/sitecore/generic/ISitecoreField` for typing fields managed by Sitecore.
  - `IComponentWithRerenderProps` from `frontend/components/hoc/withRerender` for typing props when the component needs re-render functionalities.

- **Components:**
  - `Button` and `FloatingPopup` from `frontend/components/common` for common UI elements.
  - `SvgSupport` from `frontend/components/icons-new/Support` for rendering an SVG icon.
  - `ContactUsChannel` from `frontend/components/renderings/ContactUsBanner/components/ContactUsChannel` for rendering individual contact channels.

- **Styles:**
  - CSS module `styles` from `./ContactUsPopup.module.scss` for scoped styles specific to this component.

### Structure

The `ContactUsPopup` component is structured as follows:

- **Props:**
  Defined by the `IContactUsPopupProps` interface which extends `IComponentWithRerenderProps`. It includes:
  - `contactChannels`: A list of contact channel data.
  - `ctaCloseButtonLabel` and `ctaCloseButtonScreenReaderLabel`: Text fields for accessibility and labeling of the close button.
  - `isPopupShown`: Boolean to control the visibility of the popup.
  - `onClose`: Function to call when the popup needs to be closed.
  - `title`: The title text of the popup.

- **Component Logic:**
  - Uses `useStore` to access and destructure `booking` and `isInDestinationPage` from the holiday stores.
  - Uses `useMobileViewport` to determine if the device is mobile-sized.
  - Filters `contactChannels` based on the country code of the hotel in the booking.
  - Conditionally renders the popup based on `isPopupShown`.

- **Rendering:**
  - The component returns `null` if `isPopupShown` is false.
  - Renders a `FloatingPopup` with a header (including an icon and title), and dynamically generated `ContactUsChannel` components based on `filteredContactChannels`.
  - Includes a close button in the popup footer if `ctaCloseButtonLabel` is provided.

### Logic

The core functional logic of the `ContactUsPopup` component includes:

- **Visibility Control:**
  - The popup is only rendered if `isPopupShown` is `true`.

- **Contact Channels Filtering:**
  - Filters the `contactChannels` based on the display countries associated with each channel and the current booking's hotel country code.

- **Responsive Behavior:**
  - Determines if the footer should have a shadow based on whether the device is mobile and if the current page is a destination page.

- **Accessibility:**
  - The close button includes an `aria-label` for screen readers, which is sourced from `ctaCloseButtonScreenReaderLabel`.

This component is wrapped with `observer` from MobX, making it reactive to changes in the relevant MobX stores' observables, thus ensuring the UI updates when underlying state changes.