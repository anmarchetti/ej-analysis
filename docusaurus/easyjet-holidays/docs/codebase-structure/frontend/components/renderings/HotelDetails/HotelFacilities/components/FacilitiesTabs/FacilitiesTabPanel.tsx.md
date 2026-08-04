## Imports

The `FacilitiesTabPanel` component imports several modules and components to function properly:

- **React and Sitecore JSS**: 
  - `React` is used for building the component with its `FunctionComponent` type.
  - `ComponentRendering` and `Placeholder` are imported from `@sitecore-jss/sitecore-jss-nextjs` for rendering Sitecore components and placeholders.

- **Utilities and Settings**:
  - `settings` from `code/settings` to access global settings.
  - `useStore` from `frontend/hooks/useStore` for accessing the global state store.
  - `shouldRenderFacilityItems` from `frontend/utils/facilities.utils` to determine if facility items should be rendered.

- **Models**:
  - Various models and enums (`IFacilityGroup`, `ImageSize`, `PlaceholderNames`, `SitecoreDictionary`, `VirtualFacilityGroupCode`) are imported to type-check the data and manage constants.

- **Components**:
  - `HotelImage` and `RichTextWithLinks` from `frontend/components/common` are used to render specific UI elements.
  - `FacilityGroupItems` from the current directory to render a list of facility items.

- **Styling**:
  - `styles` from `./FacilitiesTabPanel.module.scss` for CSS module styling.

## Structure

The `FacilitiesTabPanel` component is defined as a functional component using React's `FunctionComponent` type with `IFacilitiesTabPanelProps` as its props type. The props include:

- `facilityGroup`: Object containing details about the facility group.
- `isActive`: Boolean indicating if the current tab is active.
- `isShowEcoFacilityPlaceholder`: Optional boolean to show a specific placeholder.
- `rendering`: Optional `ComponentRendering` object from Sitecore JSS.

The component structure is primarily a `div` element with several nested elements:

- A heading (`h3`) displaying the facility group's title or name.
- A body section (`div`) that may include:
  - A rich text description.
  - A conditional Sitecore placeholder for eco-certified facilities.
  - A list of facility items if applicable.
  - An image related to the facility group.
- A disclaimer section at the bottom which displays a localized string fetched from the store.

## Logic

The component's logic can be broken down into several key functional areas:

- **Conditional Rendering**:
  - The main `div` uses `classNames` to conditionally apply the `d-none` class if `isActive` is false, effectively hiding the component when it is not active.
  - The description and the eco-certified placeholder are conditionally rendered based on the presence of data and specific conditions.

- **Data Handling**:
  - The `getPhrase` function is used to fetch localized text from the store, demonstrating integration with a global state management system.

- **List Handling**:
  - `FacilityGroupItems` is rendered if `shouldRenderFacilityItems` returns true. It passes down props like `items` and conditional flags for rendering styles (`isMultiColumnList`, `isTopFacilitiesList`), which are determined based on the number of items and specific codes.

- **Styling**:
  - CSS modules are used for styling individual components and elements, ensuring that styles are scoped locally to the component, preventing unwanted side effects in other parts of the application.