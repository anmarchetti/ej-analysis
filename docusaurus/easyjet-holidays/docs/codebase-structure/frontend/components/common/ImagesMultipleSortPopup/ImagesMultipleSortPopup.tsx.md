## Imports

The component imports several libraries and modules to facilitate its functionality:

- **React and Component**: Imported from `react` for creating the class component and managing its lifecycle.
- **ReactNode**: Also from `react`, used for typing the render method's return value.
- **Sortable-related functions and types**: Imported from `react-sortable-hoc`, these include `arrayMove` for reordering items in an array, `SortableContainer`, and `SortableElement` for creating sortable elements and containers. `SortEnd`, `SortEvent`, `SortEventWithTag`, and `SortStart` are types used for handling sorting events.
- **classNames**: A utility function from `classnames` for conditionally joining class names together.
- **ImageSize**: An enumeration from `models/enum/ImageSize` used to specify the size of images.
- **Button and HotelImage**: React components from `frontend/components/common` used within the UI.
- **ISliderImage**: Interface from `frontend/components/common/OfferCardSlider/OfferCardSlider` representing the structure of slider images.
- **Popup**: A component from `frontend/components/common/Popup` used to render a modal dialog.

## Structure

### Components

- **SortableImage**: A `SortableElement` that renders a selectable image thumbnail. It uses a `button` to select images and a `HotelImage` component to display the image.
- **SortableImages**: A `SortableContainer` that renders a collection of `SortableImage` components.

### Interfaces

- **ISortableImageProps**: Defines the props for the `SortableImage` component, including a single image object.
- **ISortableImagesProps**: Defines the props for the `SortableImages` component, including an array of image objects.
- **IImagesMultipleSortPopupProps**: Defines the props for the `ImagesMultipleSortPopup` component, including methods for deleting images and closing the popup, and an array of images.
- **IImagesMultipleSortPopupState**: Defines the state for the `ImagesMultipleSortPopup` component, including flags for application state, the images array, and indices for sorting and deletion.

### Class Component

- **ImagesMultipleSortPopup**: The main component that manages the state and interactions of the sortable images popup. It includes methods for handling sorting, selecting, and deleting images, as well as lifecycle methods for attaching and removing event listeners.

## Logic

- **Sorting and Reordering**: Utilizes `react-sortable-hoc` to enable drag-and-drop sorting of images. The `handleSortEnd` method updates the state with the new order of images.
- **Selection and Deletion**: Images can be selected for deletion or reordering by clicking on them. The `onThumbnailsClickInEditor` method toggles the selection state of an image. The `saveItemsToDelete` method marks selected images for deletion.
- **Lifecycle Management**: Event listeners for UI interactions (like applying changes or cancelling the operation) are added in `componentDidMount` and removed in `componentWillUnmount` to manage resources efficiently.
- **Popup Management**: Uses the `Popup` component to render the sortable images along with action buttons in a modal dialog. The footer contains buttons for applying changes, cancelling the operation, and deleting selected images.
- **State Updates**: State updates are handled through React's setState, often using previous state for calculations, to ensure state consistency throughout asynchronous operations.

This documentation outlines the main aspects of the `ImagesMultipleSortPopup` component, focusing on how it imports necessary resources, its structural components, and the logic it implements to manage sortable image galleries within a popup interface.