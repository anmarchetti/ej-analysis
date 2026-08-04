## Imports

The `ComparisonTable` component uses a variety of imports from internal and external modules:

- **React and Hooks**: Imports `React` and the `useEffect` hook from the `react` package.
- **Sitecore JSS**: Utilizes `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields managed by Sitecore.
- **Custom Hooks and Utilities**:
  - `useStore` custom hook for accessing the React context.
  - `getActualPrice` and `getTouristTaxFieldsFromOffer` utility functions for calculating prices and tax-related data.
- **Models and Types**:
  - `TStores` from `frontend/store/IStores` for type definitions related to stores.
  - `CompareOption` and `IComparisonTableFields` from `models/data/IComparison` for type definitions used in the comparison table.
  - `SitecoreDictionary` and `SiteSettings` enums for configuration values and dictionary keys.
- **Components**:
  - `Button`, `HotelImage`, and various specific components like `OfferCardPriceItem`, `CompareOfferButton`, and `DynamicCell`.
  - `SVGCross` icon component for rendering a cross icon.
- **Store Usage**:
  - `useCompareStore` from `frontend/components/renderings/CompareDeals/stores/createCompareLocalStore` manages the state related to the comparison functionality.
- **Styles**:
  - Styles for the component are imported from `ComparisonTable.module.scss`.

## Structure

The `ComparisonTable` is a functional React component structured as follows:

- **Component Definition**: Defined as a functional component using the `FC` type from React, with props typed as `IComparisonTableFields`.
- **Hooks Usage**:
  - `useStore` to retrieve settings from a global store.
  - `useCompareStore` to access and manipulate the comparison list and overlay state.
  - `useEffect` to handle side effects, specifically for closing the comparison overlay if the minimum items condition is not met.
- **JSX Structure**:
  - The main JSX layout is a `<table>` element wrapped in a `<div>`.
  - The table consists of multiple rows (`<tr>`) for displaying hotel names, prices, images, and dynamic comparison criteria.
  - Each row uses a map function to iterate over `comparisonList` and render cells (`<td>`) with specific data.
- **Dynamic Content Rendering**:
  - Hotel names and removal buttons.
  - Price information or fallback text.
  - Hotel images with fallback handling.
  - Dynamically generated rows based on `ComparisonCriteria`, utilizing the `DynamicCell` component.

## Logic

The component's logic revolves around displaying and managing a comparison table for hotel offers:

- **State Management**:
  - Uses custom hooks (`useStore` and `useCompareStore`) for managing and accessing global and local state.
  - `comparisonList` contains the list of offers being compared.
  - `hasMinItemsToCompare` is a boolean to check if the minimum number of items required for comparison is met.
- **Effect for Overlay Management**:
  - An effect hook automatically closes the comparison overlay if there are not enough items to compare.
- **Event Handlers**:
  - `removeOfferFromComparison` is a function to handle the removal of an offer from the comparison list, triggered by a button click.
- **Conditional Rendering**:
  - Each cell in the price row checks if `pricePPExcludingTouristTax` exists to decide between displaying price details or a fallback text.
  - The image cell conditionally uses a fallback image if necessary.
- **Dynamic Row Generation**:
  - Rows for additional comparison criteria are generated based on `ComparisonCriteria`, with each cell rendering based on the type of data associated with that criterion.