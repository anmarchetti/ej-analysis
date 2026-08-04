### Imports

The code begins by importing the `React` library from the `react` package. This import is essential as it allows the use of React's functionalities within the file, particularly for defining the component and handling the SVG properties.

```javascript
import * as React from 'react';
```

### Structure

The `IconClock` component is defined as a functional component in React, utilizing TypeScript for type safety. It specifically defines the component to accept props of type `React.SVGProps<SVGSVGElement>`, ensuring that the props passed to the component are valid SVG properties.

The component returns an SVG element structured as follows:

- **SVG Container**: The outer `<svg>` element defines the SVG's namespace and its view box, which sets up the coordinate system and aspect ratio. Custom data attributes are managed through `data-name` and `data-tid`. The `data-tid` is used for testing purposes, and it defaults to 'clock-icon' if not provided.

- **Paths**: Inside the SVG, there are two `<path>` elements that define the graphical shapes to be rendered. These paths are hardcoded and represent a clock's face and hands.

```jsx
<svg
    data-name='Layer 2'
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    data-tid={props['data-tid'] ?? 'clock-icon'}
>
    <path d='M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z' />
    <path d='M17.49,15.1,13,10.61V6.09a1,1,0,0,0-2,0V11h0a1,1,0,0,0,.29.72l4.78,4.78a1,1,0,0,0,1.42,0A1,1,0,0,0,17.49,15.1Z' />
</svg>
```

### Logic

The logic of the `IconClock` component is straightforward:

- **Prop Handling**: The component uses the `data-tid` prop to allow for specifying a unique test identifier, which defaults to 'clock-icon' if not provided. This is useful for locating the element in automated tests.

- **SVG Rendering**: The SVG paths are statically defined, meaning the visual representation of the clock does not change dynamically based on external inputs. The paths describe a circular clock face and a time indication (hands).

- **Default Props**: The fallback for the `data-tid` property ensures that even if the property is not explicitly passed, the SVG can still be identified in a consistent manner in tests.

This component is primarily used for display purposes, embedding a stylized clock icon into a React application. The use of TypeScript for prop type definition enhances code reliability and developer experience by enforcing type checks.