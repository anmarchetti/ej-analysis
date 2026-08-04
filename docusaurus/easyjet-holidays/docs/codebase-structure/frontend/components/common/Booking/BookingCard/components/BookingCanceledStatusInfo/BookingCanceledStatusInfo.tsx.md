## Imports

The code snippet begins with several import statements to include various modules and components required for the `BookingCanceledStatusInfo` component:

- `React, { FC }`: Imports React and its Functional Component type (FC) from the 'react' library, which is essential for defining the component.
- `classNames`: A utility function from 'classnames' that conditionally joins class names together. It is useful for applying multiple class names to a component based on certain conditions.
- `inject`: A function from 'mobx-react' used for injecting MobX stores into React components.
- `IHolidaysStores`: A TypeScript interface imported from 'frontend/store/holidays' that likely defines the structure for the holiday-related MobX stores.
- `SitecoreDictionary`: A module from 'models/enum/SitecoreDictionary' that probably contains constants or keys for translation phrases.
- `IComponentWithDictionary`: An interface from 'models/sitecore/generic/IComponentWithDictionary', which might be used to type components that require access to a translation dictionary.
- `SvgWarningFilled`: A React component representing a filled warning icon, imported from 'frontend/components/icons-new/WarningFilled'.
- `styles`: The specific module CSS imported from './BookingCancelledStatusInfo.module.scss', which contains styles specific to this component.

## Structure

The `BookingCanceledStatusInfo` component is defined as a functional component using React's Functional Component (FC) pattern. It utilizes TypeScript for prop typing and integrates with Sitecore's dictionary for localization:

- **Component Definition**: The component is defined as `BookingCanceledStatusInfo` and is typed with `IBookingCanceledStatusInfoProps` which extends `IComponentWithDictionary`. This setup indicates that the component expects props that include methods and properties from the `IComponentWithDictionary` interface.
- **Props**: The component accepts `displayOnMobile` as an optional boolean prop and utilizes `getPhrase` from its props for fetching localized text.
- **JSX Structure**: The component returns a `<span>` element with conditional class names based on the `displayOnMobile` prop. Inside the span, there is an icon (`<SvgWarningFilled />`) followed by a localized text fetched using `getPhrase` function with a key from `SitecoreDictionary`.

## Logic

- **Conditional Styling**: The `classNames` function is used to toggle between `styles.mobile` and `styles.desktop` based on the `displayOnMobile` prop. This helps in applying responsive styles to the component.
- **Localization**: The `getPhrase` function is used to retrieve a localized string for "Holiday Canceled" using a key from `SitecoreDictionary`. This ensures that the component can support multiple languages or locales, as managed by the Sitecore infrastructure.
- **MobX Store Injection**: The `inject` function is used at the end of the file to connect the component with MobX stores. It specifically maps `stores.layoutStore.getPhrase` to the `getPhrase` prop of the component, facilitating the component's access to the localized phrases stored in the MobX store.

This setup demonstrates a clean integration of React functional components with MobX for state management and Sitecore for localization, all while maintaining a responsive and conditional style application.