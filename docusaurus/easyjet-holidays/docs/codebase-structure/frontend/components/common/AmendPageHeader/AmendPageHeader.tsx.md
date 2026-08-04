## Imports

The `AmendPageHeader` component uses several imports from various sources:

- **React and Sitecore JSS**: 
  - `FunctionComponent` from `react` for typing the functional component.
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.

- **Model and Enum Imports**:
  - `SitePath` and `SitePathOverload` from `models/enum/SitePath` for handling breadcrumb paths.
  - `ISitecoreComponent` and `ISitecoreField` from `models/sitecore/generic` for typing Sitecore components and fields.

- **Component Imports**:
  - `AmendPageServiceMessages` and `TErrataOverrides` from `frontend/components/common/AmendPageServiceMessages` for displaying service messages with optional overrides.
  - `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks` for rendering rich text fields with embedded links.
  - `AmendDatesBreadcrumbs` from `frontend/components/renderings/AmendDatesSummary/components/AmendDatesBreadcrumbs` for displaying breadcrumb navigation.
  - `ComponentWrapper` from `frontend/components/renderings/static/ComponentWrapper` for wrapping components with optional styling parameters.

- **Styles**:
  - `styles` from `./AmendPageHeader.module.scss` for component-specific styling.

## Structure

The `AmendPageHeader` component is defined as a functional component using React's `FunctionComponent` type, with props defined by the `IAmendPageHeaderProps` interface. The structure of the component is as follows:

- **Wrapper Div**:
  - A `div` element with a class from the imported styles serves as the outer container.

- **ComponentWrapper**:
  - A `ComponentWrapper` component that optionally applies a grey background based on the `isBackgroundGrey` prop.

- **Breadcrumb Navigation**:
  - `AmendDatesBreadcrumbs` is used for rendering breadcrumb links, controlled by `breadcrumbRootPath` and `breadcrumbRootText`.

- **Title and Subtitle**:
  - Conditionally rendered `Text` and `RichTextWithLinks` components display the title and subtitle if their values are present.

- **Service Messages**:
  - Conditionally rendered `AmendPageServiceMessages` component displays attention messages if `isAttentionMessageOn` is true.

## Logic

The logic of the `AmendPageHeader` component primarily revolves around conditional rendering and the application of styles based on props:

- **Background Style Application**:
  - The `ComponentWrapper` is used to conditionally apply a grey background by passing a parameter `IsGreyBackground` which is set based on the `isBackgroundGrey` prop.

- **Conditional Rendering**:
  - The title and subtitle are only rendered if their respective `value` properties are truthy.
  - The service messages component is rendered only if `isAttentionMessageOn` is set to true.

- **Breadcrumb Customization**:
  - The breadcrumbs accept customization through `breadcrumbRootPath` and `breadcrumbRootText`, allowing different root paths and text to be set dynamically based on the component's usage context.

This component effectively combines styling, structure, and logic to render a header section typically used in pages that require attention messages and breadcrumb navigation, with dynamic text content sourced from Sitecore.