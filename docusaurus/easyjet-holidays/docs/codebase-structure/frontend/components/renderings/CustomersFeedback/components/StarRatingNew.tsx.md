## Imports

The component imports its styling from a SCSS module file named `StarRatingNew.module.scss`. This allows the component to use scoped CSS classes, which helps in avoiding naming conflicts and ensures styles are applied only to this component.

```javascript
import styles from './StarRatingNew.module.scss';
```

## Structure

### Interfaces

- `IStarRatingNewProps`: Defines the props for the `StarRatingNew` component.
  - `rating`: A number indicating the rating value.
  - `showOnlyFull`: An optional boolean that, if true, shows only full stars.

### Components

#### `StarSvg`

A functional component that renders an SVG star icon. This component is used to represent individual stars in the rating component.

#### `StarRatingNew`

A functional component that takes `rating` and `showOnlyFull` as props and renders a star rating system. The component conditionally renders based on the value of `rating` and `showOnlyFull`. It uses a combination of CSS for styling and logic to determine how many stars should be displayed as filled, partially filled, or empty.

### JSX Structure

- The `StarRatingNew` component conditionally returns different JSX based on `showOnlyFull` prop:
  - If `showOnlyFull` is true, it renders only fully filled stars.
  - Otherwise, it renders stars that can be fully filled, partially filled, or empty, based on the rating.

## Logic

### Calculation of Stars

1. **Total Stars**: The total number of stars is set to 5.
2. **Decimal Part of Rating**: Extracts the decimal part of the rating, rounds it to two decimal places, and converts it to a percentage.
3. **Stars Array Construction**:
   - If `showOnlyFull` is true, the array length is based on the rounded value of the rating.
   - If `showOnlyFull` is false, the array always has a length of 5.
   - Each element in the array represents the fill percentage of the corresponding star.
4. **Adjustments for Visibility**:
   - Increases fill percentage by 10 for ratings between 0 and 30% to enhance visibility of low ratings.
   - Decreases fill percentage by 10 for ratings between 70 and 90% to differentiate slightly from full stars.

### Rendering Logic

- **Handling `showOnlyFull`**:
  - When true, only fully filled stars are rendered.
  - When false, stars are rendered with varying degrees of fill based on the calculated percentage.
- **Conditional Rendering**:
  - Stars are rendered inside a container with a specific class for styling.
  - Partially filled stars use an inner div to show the filled portion, which is styled dynamically using inline styles to set the width.

This component effectively encapsulates the logic for displaying star ratings based on a numerical value, with support for both full and partial star displays.