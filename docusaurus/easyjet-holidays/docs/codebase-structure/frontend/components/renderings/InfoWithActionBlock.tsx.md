## Imports

In the `InfoWithActionBlock` component, several imports are made to handle both React functionalities and specific Sitecore JSS features:

- **React Import:**
  - `FC` from `react`: This is the abbreviation for `FunctionComponent`, a TypeScript generic type utilized to type-check functional components in React.

- **Sitecore JSS Next.js Import:**
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs`: A component provided by Sitecore JSS for Next.js that simplifies rendering of text fields from Sitecore.

- **Model Imports:**
  - `ISitecoreComponent` from `models/sitecore/generic/ISitecoreComponent`: A generic interface for typing Sitecore components.
  - `ISitecoreField`, `ISitecoreImage` from `models/sitecore/generic/ISitecoreField`: Interfaces to type Sitecore fields, specifically handling image and text data.

- **Local Component Imports:**
  - `JSSImage` from `frontend/components/common/JSSImage`: A custom React component for rendering images using Sitecore JSS.
  - `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks`: A custom React component for rendering rich text fields that may contain links.

## Structure

The `InfoWithActionBlock` component is structured as follows:

- **Interface Definition:**
  - `ISitecoreFields`: This interface is specific to the component and includes three fields:
    - `Icon`: An image field.
    - `Text`: A string field for text content.
    - `Title`: A string field for the title text.

- **Type Definition:**
  - `TInfoWithActionBlockProps`: A type alias that extends `ISitecoreComponent` with `ISitecoreFields`, specifying the expected props structure for the component.

- **Functional Component:**
  - `InfoWithActionBlock`: A functional component typed with `FC<TInfoWithActionBlockProps>` that renders the UI based on the provided Sitecore fields.

## Logic

The component's rendering logic is straightforward:

1. **Null Check:**
   - The component first checks if `props.fields` is truthy. If not, it returns `null`, effectively rendering nothing.

2. **Rendering UI:**
   - A wrapper `div` is used with a class `info-with-action__wrapper` and a data attribute `data-tid` for potential testing identification.
   - Inside the wrapper, the title is conditionally rendered as an `h2` element if `props.fields.Title` is present.
   - Another `div` with class `info-with-action__text-wrapper` contains:
     - The icon, rendered using the `JSSImage` component if `props.fields.Icon` is available.
     - The text content, rendered within a `RichTextWithLinks` component if `props.fields.Text` is available. This component uses a `div` tag and a specific class for styling.

This structure ensures that each part of the component is only rendered if its respective data is available, maintaining a clean and error-free UI in cases where some data might be missing.