## Imports

The `HolidaysUnder` component imports various libraries, utilities, models, and other components to facilitate its functionality:

- **React and Text Component**: Utilizes `React` for component structure and lifecycle features, and `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.
- **Classnames Utility**: Imports `classnames` for dynamically setting CSS class names based on conditions.
- **Custom Hooks and Utilities**:
  - `useStore`: A custom React hook for accessing the application's store.
  - `getCustomisableTitleClassName` and `getPaddingSizeClassName`: Utility functions for generating class names based on component parameters.
  - `buildSitecoreLinkFullUrl`: A utility for building full URLs from Sitecore link fields.
- **Models**:
  - Various interfaces such as `ICustomisableComponentParams`, `IComponentWithDictionary`, `ISitecoreComponent`, `ISitecoreField`, and `ISitecoreLink` define the types used in the component.
  - Enumerations like `SitecoreDictionary` and `EventTypes` provide predefined constants.
- **Components**:
  - `PriceLabel` and `RouterLink` are reusable UI components.
  - `IconChevronRight` is an icon component used within the UI.
- **Styles**: Imports SCSS module `styles` from `./HolidaysUnder.module.scss` for component styling.

## Structure

The component structure includes several TypeScript interfaces and the main functional component:

- **Interfaces**:
  - `IHolidaysUnderPillFields`: Defines the fields for each pill, including boolean, link, and price.
  - `IHolidaysUnderPill`: Extends `ISitecoreComponent` with the pill-specific fields and an `id`.
  - `IHolidaysUnderFields`: Represents the main fields of the component including description, pills, and title.
  - `IHolidaysUnderProps`: Combines multiple interfaces to define the props of the component.
  
- **Functional Component (`HolidaysUnder`)**:
  - Accepts props of type `IHolidaysUnderProps`.
  - Uses the `useStore` hook to access specific methods and data from the global store.
  - Conditionally renders based on the existence of fields and their values.
  - Maps over the `Pills` array to render individual pills, each encapsulated within a `RouterLink` component.

## Logic

The component's logic handles conditional rendering and event tracking:

- **Conditional Rendering**:
  - The component early returns `null` if `fields` are not provided.
  - Renders a title and description if they exist.
  - Maps through the `Pills` array to render each pill only if the necessary fields (`Link` and `Price`) are available.

- **Event Tracking**:
  - When a pill is clicked, an event is tracked using `trackEventWithParams` from the store. This event logs various details like the location, destination URL, position in the list, and the price name.
  - The destination URL for tracking is built using `buildSitecoreLinkFullUrl`, which combines the link field and the site path.

- **Dynamic Class Names**:
  - Uses `classnames` and utility functions to dynamically set class names based on component parameters and styles, enhancing the flexibility and customization of the component's appearance.

This documentation encapsulates the primary aspects of the `HolidaysUnder` component, focusing on its dependencies, structural elements, and logical operations.