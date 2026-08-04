## Imports
The `FullWidthBannerPill` component imports several modules and types:

- `FC` from `react`: This is the Function Component type from React, used for typing the component.
- `PillColourVariant` from `models/data/IFullWithBanner`: This import brings in an enumeration that defines possible color variants for the pill.
- `ISitecoreField` from `models/sitecore/generic/ISitecoreField`: This is a generic type used for typing Sitecore fields, specifically to handle data integration from Sitecore.
- `PricePill` from `frontend/components/common/Pills/PricePill/PricePill`: This is a React component used to render the visual pill element in the UI.

## Structure
The `FullWidthBannerPill` component is defined as a functional component in React and it utilizes TypeScript for static typing. The component takes a single props object of type `IFullWidthBannerPillProps`, which includes:

- `PillColour`: An optional enum of `PillColourVariant` to specify the color of the pill.
- `PillText`: An optional `ISitecoreField<string>` that contains the text to be displayed inside the pill.
- `className`: An optional string for CSS class names to be applied to the pill for additional styling.

The default values for `PillColour` and `className` are set to `PillColourVariant.Green` and an empty string, respectively.

## Logic
The component's rendering logic is straightforward:

1. **Conditional Rendering**: The component first checks if `PillText.value` is present. If it is not, the component returns `null`, effectively rendering nothing.

2. **Color Assignment**: The component passes boolean props to the `PricePill` component based on the `PillColour` prop. These boolean props (`isRed`, `isYellow`, `isGreen`, `isBlack`) determine the color of the pill.

3. **Text Display**: The value of `PillText.value` is passed as children to the `PricePill` component, which displays the text inside the styled pill.

4. **CSS Class Application**: The `className` prop is passed to the `PricePill` component to apply any custom styling provided from the parent component or elsewhere.

This component effectively abstracts the complexity of pill color management and text handling, making it reusable and maintainable within the context of a larger application that might receive its data from Sitecore CMS.