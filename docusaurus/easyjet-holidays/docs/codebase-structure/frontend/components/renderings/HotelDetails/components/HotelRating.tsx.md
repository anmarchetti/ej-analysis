### Imports

The component imports React from the 'react' library, which is essential for defining the component and using JSX syntax.

```javascript
import React from 'react';
```

### Structure

The `HotelRating` component is defined using TypeScript, leveraging an interface `IHotelRatingProps` to type-check the component's props.

- **Interface `IHotelRatingProps`**: This interface declares that the `HotelRating` component expects a prop `rating` which is a number.
  
```typescript
interface IHotelRatingProps {
    rating: number;
}
```

- **Component Definition**: `HotelRating` is a functional component in React that receives `rating` as a prop.
  
```javascript
const HotelRating: React.FC<IHotelRatingProps> = ({ rating }) => {...};
```

- **JSX Structure**: The component returns a `div` element with a class `star_rating`. Inside this `div`, it dynamically generates SVG icons based on the `rating` prop.

```jsx
<div className='star_rating'>
    {new Array(rating || 0).fill(undefined).map((el, idx) => (
        <svg ...>
            <path ... />
        </svg>
    ))}
</div>
```

### Logic

- **Conditional Rendering**: The component first checks if the `rating` prop is truthy (i.e., not `null`, `undefined`, or `0`). If `rating` is falsy, the component returns `null`, effectively rendering nothing.

```javascript
if (!rating) {
    return null;
}
```

- **SVG Star Icons**: For a truthy `rating`, the component creates an array of length equal to the `rating` value. It then maps over this array to render SVG star icons, corresponding to the number of `rating`. Each star is represented by an SVG element with predefined attributes and a `path` element describing the star shape.

- **Key Prop in List**: Each SVG element is given a unique `key` prop, which is the index of the current element in the map iteration (`idx`). This helps React identify which items have changed, added, or are removed.

```jsx
key={idx}
```

- **Accessibility Attributes**: The SVG has attributes like `aria-hidden='true'` and `focusable='false'` to ensure it's accessible and behaves correctly in screen readers and other assistive technologies.

This component effectively displays a visual representation of ratings through star icons, where the number of filled stars corresponds to the `rating` value provided.