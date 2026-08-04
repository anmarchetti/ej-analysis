### Imports

The InformationBlock component utilizes several imports:

- **React and FC (Function Component)**: Imports React and its Function Component type from the 'react' module for creating the component.
- **Text**: Imports the Text component from '@sitecore-jss/sitecore-jss-nextjs' which is used to render simple text fields from Sitecore.
- **ISitecoreComponent, ISitecoreField, and ISitecoreImage**: Imports interface types from 'models/sitecore/generic' to type-check the component props and field data.
- **JSSImage and RichTextWithLinks**: Imports custom components from 'frontend/components/common'. JSSImage is used for rendering images and RichTextWithLinks is used for rendering rich text content which may include hyperlinks.

### Structure

The `InformationBlock` component is defined as a functional component in React, using TypeScript for type safety. It expects props of type `TInformationBlockProps`, which extends `ISitecoreComponent` with specific field definitions (`IInformationBlockFields`):

- **IInformationBlockFields**: This interface defines optional fields:
  - `Description`: A Sitecore field for text content.
  - `Image`: A Sitecore field for image content.
  - `Title`: A Sitecore field for a title string.

The component structure includes:
- A main `div` with a class `information-block`.
- Inside the main `div`, there is a wrapper `div` containing:
  - An optional `JSSImage` component for displaying the image.
  - Another `div` for content, which itself contains:
    - A wrapper `div` that includes another `JSSImage` as an icon and an optional `Text` component for the title.
    - An optional `RichTextWithLinks` component for the description.

### Logic

The component starts by checking if `props.fields` is available. If not, it returns `null`, rendering nothing.

Within the render logic:
- The `JSSImage` component is used twice: once for displaying a primary image and once as an icon within the content area. Both usages check for the existence of `props.fields.Image`.
- The title is conditionally rendered using the `Text` component if `props.fields.Title` is available.
- The description is conditionally rendered using the `RichTextWithLinks` component if `props.fields.Description` is available.

This setup allows for a flexible rendering of the information block based on the data availability from Sitecore, ensuring that each content element only appears if its respective data is present.