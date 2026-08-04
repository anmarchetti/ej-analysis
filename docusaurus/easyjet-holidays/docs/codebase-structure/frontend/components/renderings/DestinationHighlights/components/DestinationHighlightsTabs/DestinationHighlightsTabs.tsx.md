## Imports

The code imports several libraries and components that are essential for its functionality:

- `React, { FC }` from 'react': Imports React and its Functional Component type (FC) for creating the component.
- `{ Text }` from '@sitecore-jss/sitecore-jss-nextjs': Imports the Text component from the Sitecore JSS library for Next.js, used for rendering text fields from Sitecore.
- `classNames` from 'classnames': A utility function to conditionally join class names together.
- `{ cmsUrls }` from 'code/endpoints': Likely a custom module that contains URLs or endpoints for CMS operations.
- `{ IDestinationHighlightTabItem }` from 'models/data/IDestinationHighlightTabItem': Imports a TypeScript interface that defines the structure of props expected for each tab item.
- `ImageWithFilter, { SVGFilterMatrix }` from 'frontend/components/common/ImageWithFilter/ImageWithFilter': Imports a custom React component and a constant that provides SVG filter configurations.
- `styles` from './DestinationHighlightsTabs.module.scss': Module CSS for styling the component using SCSS.

## Structure

The component `DestinationHighlightsTabs` is defined as a functional component using TypeScript. It accepts props of the type `IDestinationHighlightsTabsProps`, which includes:

- `setActiveTabId`: A function to update the state of the active tab.
- `tabs`: An array of tab items, where each item adheres to the `IDestinationHighlightTabItem` interface.
- `activeTabId`: An optional string that indicates the currently active tab.

The component structure consists of a `<div>` wrapper that contains a list of `<button>` elements, each representing a tab. Each tab can potentially have an icon and a title, controlled by the `tab.fields` object.

## Logic

1. **Tab Activation**:
   - The `onTabClick` function handles the click event on any tab, preventing the default action, and sets the active tab using `setActiveTabId` passed from the props.

2. **Rendering Tabs**:
   - The tabs are mapped over to generate a list of `<button>` elements.
   - Each tab checks if it's the active tab by comparing its ID with `activeTabId`.
   - The `className` of each tab is dynamically set using the `classNames` utility based on whether it is active.

3. **Conditional Rendering**:
   - Inside each tab, the icon is conditionally rendered if the `tab.fields.Icon` exists. The `ImageWithFilter` component is used to display the icon with a specific SVG filter applied based on whether the tab is active.
   - The title of the tab is rendered using the `Text` component from Sitecore JSS, which is also conditionally displayed based on the existence of `tab.fields.Title`.

4. **Accessibility**:
   - Each tab button has `aria-expanded` and `aria-controls` attributes to enhance accessibility, indicating whether the tab is expanded and which panel it controls.

This component effectively manages the display and switching of tabs in a user interface, leveraging React's functional component model along with TypeScript for type safety and modular CSS for styling.