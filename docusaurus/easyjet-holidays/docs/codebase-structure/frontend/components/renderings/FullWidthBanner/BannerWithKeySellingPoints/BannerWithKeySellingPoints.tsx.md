### Imports

The code imports several modules and utilities from various sources:

- **React Essentials:** `forwardRef` from `react` for creating a ref-forwarding component.
- **Sitecore JSS:** `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields managed by Sitecore.
- **Utilities and Helpers:** 
  - `classNames` from `classnames` to conditionally join class names together.
  - Utility functions `getMobileAndDesktopFontSizeClassName` and `getTitleFontClassName` from `frontend/utils/componentStylesCustomisation.utils` for dynamic styling based on parameters.
- **Model Definitions:** 
  - `IFullWidthBannerFields`, `IFullWidthBannerParameters`, and `TextAlignmentVariant` from `models/data/IFullWithBanner` for type definitions.
- **Custom Components:** 
  - `JSSImageNext` from `frontend/components/common/JSSImageNext/JSSImageNext` for rendering images.
  - `LuxuryBadge` from `frontend/components/common/LuxuryBadge/LuxuryBadge` for displaying a luxury badge conditionally.
  - `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks` for rendering rich text.
  - `FullWidthBannerButton` and `FullWidthBannerPill` from nested paths within `frontend/components/renderings/FullWidthBanner`.
  - `BannerKeySellingPoint` from a local directory for rendering individual key selling points.
- **Styling:** `styles` from the local `BannerWithKeySellingPoints.module.scss` for scoped CSS module styles.

### Structure

The component `BannerWithKeySellingPoints` is defined as a forward-ref React functional component accepting props of type `IBannerWithKeySellingPointsProps` which includes `fields` and `params`.

**Key Structural Elements:**

- **Wrapper Div:** Main container with a `ref` and a `data-tid` attribute for testing.
- **Info Wrapper Div:** Contains all textual content and interactive elements like buttons and pills. Alignment is controlled via `classNames` and CSS modules based on the `TextAlignment` parameter.
- **Image Wrapper Div:** Contains the image and an optional luxury badge, controlled by the `IsLuxuryBadge` boolean.
- **Key Selling Points:** Dynamically generated from `KeySellingPoints.fields.Items`, each represented by a `BannerKeySellingPoint` component.

### Logic

**Conditional Rendering:**

- The component returns `null` if neither `Title.value` nor `KeySellingPoints.fields.Items.length` are present, effectively not rendering if essential content is missing.

**Dynamic Class Names and Styles:**

- Text alignment for the info wrapper is determined by comparing `TextAlignment` to `TextAlignmentVariant.Right`.
- Dynamic class names for the title are generated based on `TitleFontSize` and `TitleFontStyle` using utility functions.

**Mapping and Key Handling:**

- Key selling points are mapped over `KeySellingPoints.fields.Items`, creating a `BannerKeySellingPoint` for each item with a unique `key` prop derived from `point.id`.

**Component Composition:**

- Uses smaller components like `FullWidthBannerPill`, `RichTextWithLinks`, `FullWidthBannerButton`, and `LuxuryBadge` to build out parts of the banner, showcasing a compositional design approach. Each sub-component is passed specific props or styles as needed.

This documentation outlines the foundational structure, import strategy, and logical flow of the `BannerWithKeySellingPoints` component, providing a clear overview for developers to understand, maintain, or extend the component.