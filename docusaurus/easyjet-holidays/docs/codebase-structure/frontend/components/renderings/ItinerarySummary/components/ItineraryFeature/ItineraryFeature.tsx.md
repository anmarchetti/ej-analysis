## Imports

The `ItineraryFeature` component uses several imports:

- **React and Sitecore JSS**: 
  - `FC` from `react` for typing the functional component.
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.

- **Utilities and Styling**:
  - `classNames` from `classnames` to conditionally join class names together.
  - `styles` from `./ItineraryFeature.module.scss` for module-specific styles.

- **Type Definitions**:
  - `ISitecoreField` and `ISitecoreImage` from `models/sitecore/generic/ISitecoreField` for typing the Sitecore fields.

- **Components**:
  - `JSSImageNext` from `frontend/components/common/JSSImageNext/JSSImageNext` for rendering images with next.js optimizations.
  - `Tooltip`, `TooltipTrigger`, `TooltipContent` from `frontend/components/common/Tooltip` for displaying tooltips.

## Structure

The `ItineraryFeature` component is defined as a functional component using TypeScript. It accepts props defined by the `IItineraryFeatureProps` interface:

- **Props**:
  - `dataTid`: A unique identifier for test identification.
  - `description`: A Sitecore text field for the feature description.
  - `icon`: A Sitecore image field for the feature icon.
  - `title`: A Sitecore text field for the feature title.
  - `className`: Optional string for additional CSS class names.
  - `isExpanded`: Boolean to toggle expanded state.
  - `tooltipText`: Optional text for the tooltip.

The component structure consists of a main `div` that uses `classNames` to conditionally apply CSS classes based on the `isExpanded` prop. It includes two main sub-components:

- **Image and Title Section**:
  - An image rendered by `JSSImageNext`.
  - The title rendered as a `span` using the `Text` component from Sitecore JSS.
  - A conditional `Tooltip` if `isExpanded` and `tooltipText` are provided.

- **Description Section**:
  - Conditionally rendered based on `isExpanded`.
  - The description is rendered as a `span` using the `Text` component.

## Logic

- **Conditional Class Application**:
  - The main `div` and its child elements use the `classNames` utility to apply CSS classes dynamically based on the `isExpanded` state.

- **Conditional Rendering**:
  - The tooltip and description text are only rendered if `isExpanded` is `true`. Additionally, the tooltip requires `tooltipText` to be non-null.

- **Data Attributes**:
  - `data-tid` attributes are used for testing purposes, constructed using the provided `dataTid` prop to ensure unique identifiers within the DOM.

This component effectively demonstrates how to utilize conditional rendering and class application in React using TypeScript, Sitecore JSS, and SCSS modules.