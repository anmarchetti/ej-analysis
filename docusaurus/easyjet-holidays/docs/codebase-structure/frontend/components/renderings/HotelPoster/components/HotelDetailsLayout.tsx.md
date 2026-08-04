## Imports

The component imports several helper functions, components, hooks, and styles from various parts of the application and libraries:

- **React and Libraries**: Imports `FC` (Function Component) from React for typing, `classNames` for conditional class names, and `observer` from `mobx-react` for making the component reactive to observable changes in MobX stores.
- **Hooks**: Utilizes the `useStore` custom hook to access MobX stores.
- **Utilities**: Includes utility functions like `getBgImage` and `getRoomName` for handling image backgrounds and room names, respectively, and poster-related utilities from `HotelPoster.utils`.
- **Models and Enums**: Imports types and enums such as `PackageIconTypes` and `SitecoreDictionary` for consistent reference to specific values, and interfaces like `ISitecoreField` and `ISitecoreImage` for typing Sitecore-related data.
- **Components**: Uses several common components like `HolidayPackageIcons`, `JSSImage`, `LuxuryWrapper`, `PriceLabel`, and `RichTextWithLinks` for constructing various parts of the layout.
- **Styles**: Imports SCSS module for styling the component.

## Structure

The `HotelDetailsLayout` component is structured as follows:

- **Props**: Defined by the `IHotelDetailsLayoutProps` interface, which includes properties such as logos, poster fields, and various boolean flags that control the rendering logic.
- **Component Function**: A functional component that uses destructuring to access props and the `useStore` hook to derive data from MobX stores.
- **Conditional Rendering**: Early returns `null` if essential fields or data are missing, ensuring that the component only renders when sufficient data is available.
- **JSX Structure**: The component is wrapped in a `LuxuryWrapper` which conditionally renders children based on the `showLuxuryWrapper` flag. Inside, it organizes the layout into logical sections like header, body, and includes various sub-components for displaying specific pieces of information like hotel name, location, price, etc.
- **Dynamic Styling**: Uses `classNames` to apply conditional styles based on the props and state derived from the stores.

## Logic

The component's logic revolves around several key functionalities:

- **Store Data Extraction**: Uses the `useStore` hook to pull relevant data from multiple MobX stores, such as phrases, currency formatting, package details, and flags like `isLuxuryPackage`.
- **Poster Metadata**: Computes metadata for the poster using `getPosterMeta` which gathers necessary details like hotel location, departure date, and more from the props and store data.
- **Background Image**: Determines the background image of the hotel using `getBgImage`.
- **Tourist Tax Label**: Optionally computes a label for tourist tax if enabled.
- **Luxury Collection Logic**: Determines whether to show the luxury wrapper and additional icons based on the type of package and presence of specific logos.
- **Price Formatting**: Uses the `formatMoney` method from the store to format the price display based on the provided currency and settings.

This component effectively integrates various data sources and helpers to present a detailed and interactive hotel details poster, adhering to both functional and aesthetic requirements.