## Imports

The JavaScript file begins by importing various modules and components necessary for its functionality:

- `React, { FC }` from 'react': Imports React and its Functional Component type (FC) for creating functional components.
- `{ Placeholder }` from '@sitecore-jss/sitecore-jss-nextjs': Imports the Placeholder component from the Sitecore JSS package for Next.js applications, which is used to dynamically replace parts of the layout.
- `{ observer }` from 'mobx-react': Imports the observer function from MobX-React, which is used to make a React component reactive to state changes in MobX stores.
- `useStore` from 'frontend/hooks/useStore': A custom hook for accessing MobX stores.
- `{ IHolidaysStores }` from 'frontend/store/holidays': Import type definitions for the holiday stores.
- `{ PlaceholderNames }` from 'models/enum/PlaceholderNames': Imports an enumeration that defines names for dynamic placeholders in Sitecore.
- `{ ISitecoreComponent }` from 'models/sitecore/generic/ISitecoreComponent': Imports a type definition for generic Sitecore components.
- `{ ISitecoreField, ISitecoreImage }` from 'models/sitecore/generic/ISitecoreField': Imports type definitions for Sitecore fields, including a specific type for image fields.
- `ExpandableBanner` from 'frontend/components/common/ExpandableBanner/ExpandableBanner': Imports a reusable ExpandableBanner component.
- `styles` from './CancellationUnavailableBanner.module.scss': Imports SCSS module for styling specific to the CancellationUnavailableBanner component.

## Structure

The file defines a functional component `CancellationUnavailableBanner` that uses TypeScript for type safety. It utilizes destructuring to extract `fields` and `rendering` from its props.

### Component Props

- `ICallToActionBlockFields`: Defines the shape of expected fields for the component, which includes:
  - `Description`: A Sitecore field for text.
  - `Icon`: A Sitecore field for images.
  - `Title`: A Sitecore field for text.

### Type Definitions

- `TCancellationUnavailableBannerProps`: A type alias that extends `ISitecoreComponent` with `ICallToActionBlockFields`, specifying the props structure the component expects.

## Logic

The component begins by using the `useStore` hook to extract `booking` data from the MobX store.

### Conditional Rendering

- The component immediately returns `null` if:
  - `fields` is not available.
  - `booking.cancellationIsBlocked` is false.
  - `booking.isExternalAgency` is true.

This ensures that the banner is only rendered when necessary conditions about the booking are met.

### Component Composition

- The `ExpandableBanner` component is used to render the UI, passing `Title`, `Description`, and `Icon` from the `fields`.
- A `Placeholder` component is embedded within a `button` div to potentially show additional dynamic content based on the `PlaceholderNames.ContactUs` value.
- `dataTidPrefix` is used as a prefix for test identifiers, aiding in the identification of UI components during testing.

### Styling

- The `button` div uses styles from the imported SCSS module, applying specific styling to the button part of the banner.

### Reactivity

- The component is wrapped with `observer` from MobX-React, making it reactive to changes in the MobX store state, specifically to any updates in the `booking` object within the store. This ensures that the component re-renders when the relevant MobX state changes.