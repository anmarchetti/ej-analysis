### Imports

The component imports several libraries and modules to enable its functionality:

- **React and FC**: Imports React and the Function Component type from `react` for creating the component.
- **Text**: Imported from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.
- **classNames**: A utility function from `classnames` for conditionally joining class names together.
- **Tokens, useStore, and various utilities**: These are custom hooks and utilities for handling tokens, state management, and other functionalities like tracking and URL manipulation.
- **EventTypes, EventActions, EventCategories**: Enums for tracking event types and categories.
- **ISitecoreField, ISitecoreLink, TSitecoreMultiList**: Type definitions for handling Sitecore fields and links.
- **Link and RichTextWithLinks**: Custom components for rendering links and rich text fields which may contain links.
- **SvgTick**: A React component for rendering a 'tick' icon.
- **styles**: Module specific styles imported from `ExtraItemContent.module.scss`.

### Structure

The `ExtraItemContent` component is defined as a functional component using React's FC type with props of type `TExtraItemContentProps`. The props include:

- **CTA**: A Sitecore field for a call-to-action link.
- **Description**: A Sitecore field for the description text.
- **Highlights**: A list of highlight items, each with its own set of fields.
- **Subtitle**: A Sitecore field for the subtitle text.
- **TrackingLabel**: A Sitecore field for the tracking label.
- **index**: A numeric index typically used for tracking.

The component structure includes:

- **Text rendering**: For the subtitle using the `Text` component.
- **Rich text rendering**: For the description using the `RichTextWithLinks` component.
- **Highlights section**: Conditionally rendered if highlights exist, using a map function to render each highlight with a tick icon and title.
- **Link**: A CTA link that uses the `Link` component, which includes an `onClick` event handler for tracking.

### Logic

1. **Store Hooks**: Utilizes the `useStore` hook to access the `trackEventWithParams` function and the current `booking` from the store.
2. **Token Replacement**: Uses the `Tokenizer` utility to replace tokens in the `CTA` link URL with dynamic values such as the booking reference number and destination.
3. **Event Tracking**: The `onLinkClick` function handles click events on the CTA link, invoking the `trackEventWithParams` function with specific parameters for event tracking. This includes the event type, action, category, label, and additional generic values like the destination URL and index.
4. **Rendering Logic**: Conditionally renders the highlights section only if there are items in the `Highlights` prop. Each highlight is rendered with a tick icon and a title.

Overall, the `ExtraItemContent` component is structured to display a tile with a subtitle, description, optional highlights, and a CTA link, with integrated tracking for user interactions.