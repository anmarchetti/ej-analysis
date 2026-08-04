## Imports

The code snippet imports several JavaScript modules and TypeScript types to facilitate its operations:

- `classNames`: A utility function from the `classnames` package used for conditionally joining class names together.
- `Tokenizer`: A utility from `frontend/utils/tokenizer` for replacing tokens in strings.
- Enums and types from `models/enum` and `models/sitecore` which define constants and interfaces used for type-checking and ensuring consistent data handling across the application:
  - `BannerBrightnessType`, `BannerTextColor`, `GenericHeroBannerVariant`: Enums that define possible values for banner styles and colors.
  - `ISitecoreField`, `ISitecoreLink`: Interfaces that define the structure for Sitecore fields and links.
  - `ISitecorePersonalizeExperimentBase`: An interface for the structure of Sitecore personalization experiments.

## Structure

The code defines several constants and functions related to the styling and behavior of hero banners in a web application:

### Constants

- `CREDIT_FREE_VARIANTS` and `CENTERED_VARIANTS`: Arrays that list specific banner variants used to apply conditional styles.
- `BannerTextColorClass`: A mapping object that connects `BannerTextColor` enum values to corresponding CSS class names.

### Functions

1. **`getHeroBannerWrapperClassNames`**:
   - Purpose: Generates a string of class names for the hero banner wrapper based on various conditions.
   - Parameters: Accepts class names, text color, and flags indicating whether the slide is single, flexible, or unbounded.
   - Returns: A string of class names.

2. **`getHeroBannerClassNames`**:
   - Purpose: Constructs an array of class names for different parts of the hero banner.
   - Parameters: Takes banner variant, brightness type, color, and flags for lower positioning and single slide, plus an optional class name.
   - Returns: An array containing class names for the banner, content wrapper, and outer wrapper.

3. **`getHeroBannerControls`**:
   - Purpose: Processes Sitecore fields to replace URLs in links using tokens from a personalization experiment.
   - Parameters: An array of Sitecore fields and an optional personalization experiment.
   - Returns: An array of modified Sitecore fields with updated links.

## Logic

### Class Name Generation

- **Dynamic Class Assignment**: Using the `classNames` function, the code dynamically assigns CSS classes based on the input parameters like text color and variant. Conditions such as whether the banner is a single slide or has flexible/unbounded containers influence the resulting class string.

### Banner Variant Handling

- The functions check against predefined variants arrays (`CREDIT_FREE_VARIANTS`, `CENTERED_VARIANTS`) to determine specific styles or behaviors, such as centered content or special types of banners like lightboxes.

### Personalization and Token Replacement

- **`getHeroBannerControls`** function integrates personalization by modifying the `href` attributes of Sitecore links based on tokens provided in a personalization experiment. It uses the `Tokenizer` utility to replace placeholders in URLs with actual values, allowing for dynamic link generation based on user-specific data or experiment parameters.