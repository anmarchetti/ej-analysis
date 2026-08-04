### Imports

The code begins by importing the `React` module from the 'react' package. This import is essential as it allows the use of React's functionalities throughout the component.

```javascript
import * as React from 'react';
```

### Structure

The component `CustomControls` is a functional component in React. It is structured as follows:

- **Interface Declaration**: An interface `ICustomControls` is declared using TypeScript. This interface specifies the expected structure of the props that the component will receive:
  - `currentIndex`: a number indicating the current active image index.
  - `imagesLength`: a number representing the total number of images.

```typescript
interface ICustomControls {
    currentIndex: number;
    imagesLength: number;
}
```

- **Functional Component Definition**: `CustomControls` is defined as a functional component that accepts props of type `ICustomControls`.

```javascript
function CustomControls(props: ICustomControls) {
    ...
}
```

- **JSX Structure**: The component returns a JSX element structured as follows:
  - A `div` element with a class name `hotel-card-img-gallery`.
  - Inside the `div`, there is a `span` element displaying the current image index and the total number of images.
  - An empty `i` element, which could be used for icons or additional decorative elements.

```jsx
return (
    <div className={'hotel-card-img-gallery'}>
        <span>{`${props.currentIndex + 1} / ${props.imagesLength}`}</span>
        <i />
    </div>
);
```

### Logic

The logic of the `CustomControls` component is straightforward:

- **Index Display**: The component displays the current image index (adjusted to be 1-based by adding 1) along with the total number of images in a formatted string. This is done within the `span` element.

```javascript
<span>{`${props.currentIndex + 1} / ${props.imagesLength}`}</span>
```

- **Increment Adjustment**: The `currentIndex` is incremented by 1 when displayed to the user, ensuring that the index is user-friendly (1-based index instead of 0-based).

The simplicity of the component allows it to be easily integrated and reused in parts of an application where image gallery controls are needed, particularly for displaying the current position within a set of images.