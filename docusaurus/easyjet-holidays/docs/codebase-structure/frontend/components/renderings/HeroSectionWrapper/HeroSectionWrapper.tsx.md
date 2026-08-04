## Imports

The `HeroSectionWrapper` component utilizes several imports to function properly:

- `React, { FC }`: Imports React and its Function Component type (FC) from the React library, which is used to define the component.
- `@sitecore-jss/sitecore-jss-nextjs`: Imports the `Placeholder` component from the Sitecore JSS package for Next.js, which is used to dynamically place other components or content within the layout.
- `classnames`: A utility function to conditionally join classNames together, used here to handle dynamic class assignments based on component state or props.
- `frontend/utils/sitecore.utils`: Imports a utility function `isSitecoreCheckboxSelected` which is used to determine the boolean value of a Sitecore checkbox field.
- `models/enum/PlaceholderNames`: Imports `PlaceholderNames`, an enumeration that provides consistent references to placeholder names used within the component.
- `models/sitecore/generic/ISitecoreComponent`: Imports an interface that defines the expected structure for Sitecore components.
- `models/sitecore/generic/SitecoreCheckboxValue`: Imports a type definition for Sitecore checkbox values.
- `./HeroSectionWrapper.module.scss`: Imports SCSS module for styling the component. This module contains predefined styles that are applied conditionally within the component.

## Structure

The `HeroSectionWrapper` component is defined as a functional component in React using TypeScript. It adheres to the following structure:

- **Interface `IHeroSectionWrapperParams`**: Defines the props specific to the `HeroSectionWrapper` which includes a single property `IsSearchPodFloating` of type `TSitecoreCheckboxValue`.
- **Type `THeroSectionWrapperProps`**: Combines the Sitecore component base props with the specific `IHeroSectionWrapperParams`, forming the complete props type for the component.
- **Functional Component Definition**: The `HeroSectionWrapper` is a React functional component typed with `THeroSectionWrapperProps`. It utilizes destructuring to extract `rendering` and `params` from its props.

## Logic

The component's logic primarily revolves around the conditional rendering and class assignment based on the `IsSearchPodFloating` checkbox value:

1. **Checkbox Value Check**: The `isSitecoreCheckboxSelected` utility function is used to convert the `IsSearchPodFloating` prop (a Sitecore checkbox value) into a boolean. This determines if certain styles or structural elements should be rendered.
2. **Dynamic Class Assignment**:
   - The outer `div` element uses the `classnames` function to conditionally apply the `heroSectionWrapperPositioned` style if `isSearchPodFloating` is true.
   - The inner `div` also uses `classnames` to conditionally apply a combination of a generic class `floating-searchpod` and a specific style `floatingSearchPodWrapper` based on the same condition.
3. **Placeholder Components**:
   - Two `Placeholder` components from Sitecore JSS are used within the layout. The first, within the inner `div`, is named based on `PlaceholderNames.HeroSearchpodWrapper` and receives additional props like `isFloating` and `isParentWrapper` based on `isSearchPodFloating`.
   - The second placeholder uses `PlaceholderNames.HeroCarouselWrapper` and is placed directly within the outer `div`.

This structure and logic allow the `HeroSectionWrapper` to adapt its layout and styling dynamically based on the content management system's (CMS) configuration, specifically through the `IsSearchPodFloating` checkbox field.