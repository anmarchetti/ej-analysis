## Imports

The component imports several modules and assets necessary for its functioning:

- **React and MobX:** 
  - `FC` (Function Component) from `react` for typing the component.
  - `observer` from `mobx-react` to make the component reactive to observable changes in the MobX store.

- **Utilities and Hooks:**
  - `classNames` is used to conditionally join class names together.
  - `useStore` is a custom hook for accessing MobX stores.

- **Types and Enums:**
  - `TStores` is a type definition for the MobX stores.
  - `SitecoreDictionary` enum provides keys for translation phrases.
  - `LuxuryTheme` enum defines possible themes for the component.

- **Components and Styles:**
  - `SvgLuxury` and `SvgLuxuryGradient` are React components for rendering SVG icons.
  - `styles` imports module-specific styles from a SCSS module.

## Structure

The `LuxuryWrapper` component is structured as follows:

- **Prop Types (`ILuxuryWrapperProps`):**
  - `children`: ReactNode, the content to be displayed within the component.
  - `bannerClassName`, `contentClassName`, `wrapperClassName`: Optional strings for CSS class names.
  - `id`: Optional string for the HTML ID attribute.
  - `label`: Optional string for a text label.
  - `renderChildrenOnly`: Optional boolean that dictates whether only children should be rendered.
  - `theme`: Optional enum value of `LuxuryTheme` to specify the component's theme.

- **Component Function:**
  - Utilizes the `useStore` hook to extract `getPhrase` and `isPostBookingPages` from the MobX store.
  - Conditionally renders either just the `children` or a structured layout with a banner and content area based on the `renderChildrenOnly` prop.
  - Applies dynamic class names based on the `theme` and `isPostBookingPages` status.

## Logic

- **Conditional Rendering:**
  - If `renderChildrenOnly` is `true`, the component renders only its children, optionally wrapped in a `div` with an ID and class name.
  - Otherwise, it renders a wrapper `div` containing a banner and a content area.

- **Dynamic Styling:**
  - The `theme` prop controls the styling of the banner and icon. If the theme is `Default`, `SvgLuxuryGradient` is used; otherwise, `SvgLuxury` is used.
  - Additional CSS classes are applied based on the `theme` value (`Light` or `DarkOrange`) using the `classNames` function to manage conditional class names.

- **Content and Accessibility:**
  - The `label` prop, if provided, is displayed in the banner. If not provided, a default label is fetched using the `getPhrase` function with `SitecoreDictionary.GlobalsLabelsLuxuryCollection` as the key.
  - The `id` and `data-tid` attributes facilitate both accessibility and testing.

This component is wrapped with `observer` from MobX, making it reactive to changes in the MobX store's state that affect the computed values used within.