## Imports

The component imports a `Button` from a common components directory. This `Button` component is likely a customized button that is used across the application for a consistent look and feel.

```javascript
import Button from 'frontend/components/common/Button';
```

## Structure

The component `HotelImageCarouselEditMode` is a functional component in React which utilizes TypeScript for type safety. It accepts props defined by the interface `IHotelImageCarouselEditModeProps`.

### Interface: IHotelImageCarouselEditModeProps

- `amount`: number - Represents the number of selected images.
- `isLoading`: boolean - Indicates if the component is in a loading state.
- `withoutSelection`: boolean (optional) - Determines whether selection related features should be displayed.

### Component: HotelImageCarouselEditMode

The component renders a `div` container with the class `img-carousel-manage`. Inside this container, the following elements are rendered:

1. **Add Image Button**: A `Button` component with:
   - `className`: 'add-image-btn'
   - `isLoading`: Propagated from the component's props to control the loading state.
   - `dataTid`: A data attribute for testing, set to 'add-image'.

2. **Conditional Rendering**:
   - If `withoutSelection` is `true`, a simple button for curating images is shown with the class 'btn sort-images-btn' and a data attribute `data-tid` set to 'curate-images'.
   - If `withoutSelection` is `false`:
     - A button for sorting images with the class 'btn sort-images-btn'.
     - A `div` container with the class 'img-carousel-batch-manage' which includes:
       - A `span` displaying the number of selected images.
       - A button for deleting selected images with the class 'btn batch-delete-images-btn' and a data attribute `data-tid` set to 'batch-delete'.

## Logic

The component's logic primarily revolves around conditional rendering based on the `withoutSelection` prop:

- **withoutSelection**: This boolean prop controls whether the component should display options related to image curation and batch management (like sorting and deleting selected images).
- **isLoading**: This boolean prop is used to control the display and behavior of the `Add Image` button, showing a loading state if necessary.
- **amount**: This numeric prop is used to display the number of currently selected images when `withoutSelection` is `false`.

The component effectively manages different states and behaviors based on the properties provided, making it versatile for different scenarios where image management is needed.