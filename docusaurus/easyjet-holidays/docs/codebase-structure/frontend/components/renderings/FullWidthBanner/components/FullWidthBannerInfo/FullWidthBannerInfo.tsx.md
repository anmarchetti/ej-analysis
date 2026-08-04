## Imports

The `FullWidthBannerInfo` component imports several modules and components to facilitate its functionality:

- **React Import:**
  - `FC` (Function Component) from `react` for typing the component.
  
- **Sitecore JSS Import:**
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.

- **Utility Functions:**
  - `getMobileAndDesktopFontSizeClassName` and `getTitleFontClassName` from `frontend/utils/componentStylesCustomisation.utils` are utility functions for customizing styles based on component parameters.

- **Type Definitions:**
  - `TFullWidthBannerProps` from `models/data/IFullWithBanner` provides TypeScript interfaces for the component props.

- **Custom Components:**
  - `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks` for rendering rich text fields with embedded links.
  - `FullWidthBannerButton` and `FullWidthBannerPill` from subdirectories under `frontend/components/renderings/FullWidthBanner` are custom components specific to the FullWidthBanner component.

- **Styles:**
  - `styles` from `frontend/components/renderings/FullWidthBanner/FullWidthBanner.module.scss` for applying CSS modules styles.

## Structure

The `FullWidthBannerInfo` is a React functional component typed with `FC` and uses the `TFullWidthBannerProps` interface for its props. The component structure is as follows:

- **Conditional Rendering:**
  - The component first checks if `fields` are not present and returns `null` if they are absent.

- **Destructuring Props:**
  - Extracts `Title`, `Description`, and `PillText` from `fields`.
  - Extracts `CTATheme`, `TitleFontSize`, `PillColour`, and `TitleFontStyle` from `params`.

- **Dynamic Class Names:**
  - Utilizes utility functions to generate class names for `Title` based on `TitleFontSize` and `TitleFontStyle`.

- **JSX Structure:**
  - Renders `FullWidthBannerPill` with the `PillText` and `PillColour`.
  - Uses the `Text` component to render the `Title`.
  - Conditionally renders `Description` using the `RichTextWithLinks` component if `Description.value` is truthy.
  - Renders `FullWidthBannerButton` passing `fields` and `CTATheme`.

## Logic

- **Conditional Content Rendering:**
  - The component only renders if `fields` is provided; otherwise, it returns `null`, preventing any unhandled errors if data is missing.

- **Dynamic Styling:**
  - Class names for the title are dynamically generated based on `TitleFontSize` and `TitleFontStyle` to support responsive and styled text rendering.

- **Component Composition:**
  - The `FullWidthBannerInfo` component is composed of smaller components (`FullWidthBannerPill`, `Text`, `RichTextWithLinks`, `FullWidthBannerButton`), each responsible for rendering specific parts of the banner. This modular approach makes the components easier to manage and reuse.

- **Data Handling:**
  - Data attributes like `data-tid` and `dataId` are used within the component for testing or specific DOM manipulations, ensuring that elements can be uniquely identified when necessary.