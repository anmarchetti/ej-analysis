## Imports

The BannerCard component imports a variety of dependencies:

- **React Libraries**: Standard React import for component creation.
- **Sitecore JSS**: `Text` component from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.
- **Classnames Utility**: Used for conditional class assignment.
- **MobX**: `observer` function for making the component reactive to state changes in MobX stores.
- **Custom Hooks and Utilities**:
  - `useStore` for accessing MobX stores.
  - `getSitecoreImageBackgroundStyles` and `isSitecoreCheckboxSelected` for handling specific Sitecore field styles and conditions.
  - `Tokenizer` and other utility functions for data manipulation and condition checks.
- **Model and Type Definitions**: Interfaces and types such as `ILivePrice`, `MediaSizeParams`, and `PartnershipComponentThemes` define the structure of data used within the component.
- **Common Components**: `JSSImage`, `RichTextWithLinks`, and `RouterLink` are reusable components for handling common UI elements.
- **Higher-Order Component (HOC)**: `withRerender` is used to enhance the component with additional lifecycle management.
- **Local Component and Styles**:
  - `PriceContent` is a child component specific to this module.
  - `BannerCard.module.scss` for CSS module styles.

## Structure

The `BannerCard` component is structured as a functional React component that utilizes destructured props for configuration and rendering:

- **Props**:
  - Includes a variety of flags and data fields such as `isExternalExtras`, `livePrice`, `theme`, and structured content fields like `Title`, `Image`, `Logo`, etc.
  - `index`, `childrenCount`, `elRef`, and `handleClick` are used for handling interactions and references.
- **Use of Custom Hook**:
  - `useStore` is utilized to extract relevant state and methods from MobX stores, such as edit mode status, screen size checks, and tracking functions.
- **Conditional Rendering**:
  - Various conditions determine the class names, the visibility of certain UI elements (like prices or logos), and the style properties of components based on the props and store values.
- **Event Handling**:
  - `onBannerClick` handles the click event on the banner, which includes tracking and potentially other side effects.

## Logic

The component's logic is primarily focused on handling user interactions and dynamic styles based on the given props and global state:

- **Dynamic Class Assignment**:
  - Uses `classnames` to conditionally apply CSS classes based on props such as `isExternalExtras`, `isGridBanner`, and others.
- **Link Handling**:
  - Manipulates the `href` attribute of the CTA link by replacing tokens with dynamic data, which is useful for tracking and redirection purposes.
- **Price Display Logic**:
  - Determines whether to display price information based on the `isPriceToggleActive` flag and the presence of price data in either `livePrice` or static fields.
- **Image and Logo Rendering**:
  - Applies background styles dynamically using `getSitecoreImageBackgroundStyles`.
  - Conditionally renders logos based on the source availability and transparency settings.
- **MobX Integration**:
  - The component is wrapped with `observer` and `withRerender` HOCs to ensure it reacts to state changes in the MobX stores and handles re-rendering efficiently when props change.

Overall, the `BannerCard` component is designed to be a flexible and dynamic part of a larger application, capable of handling various configurations and states dictated by both local props and global application state.