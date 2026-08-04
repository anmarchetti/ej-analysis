### Imports

The component imports several modules and components to facilitate its functionality:

- `React` and `Component` from 'react' for creating class-based React components.
- `arrayMove`, `SortableContainer`, and `SortableElement` from 'react-sortable-hoc' to enable drag-and-drop sorting functionality.
- `ImageSize` enum from 'models/enum/ImageSize' to manage image sizes.
- `Button` and `Popup` components from 'frontend/components/common' for displaying buttons and modal popups.
- `HotelImage` component from 'frontend/components/common/HotelImage/HotelImage' to display hotel images.
- `ISliderImage` interface from 'frontend/components/common/OfferCardSlider/OfferCardSlider' to type-check the slider image properties.

### Structure

The code defines several React components and interfaces to manage a sortable image gallery within a popup modal:

#### Interfaces

- `ISortableImageProps`: Props for the `SortableImage` component, containing a single `image` of type `ISliderImage`.
- `ISortableImagesProps`: Props for the `SortableImages` component, containing an array of `items` of type `ISliderImage[]`.
- `IImagesSortPopupProps`: Props for the `ImagesSortPopup` component, including `images` array and `onClose` callback function.
- `IImagesSortPopupState`: State for the `ImagesSortPopup` component, managing `images` array and `isApplying` boolean status.

#### Components

- `SortableImage`: A sortable element that wraps the `HotelImage` component for individual images.
- `SortableImages`: A container that wraps multiple `SortableImage` components and enables sorting functionality.
- `ImagesSortPopup`: A class-based component that encapsulates the `SortableImages` within a `Popup` component. It manages the state for image sorting and provides UI for applying or canceling the sort operation.

### Logic

The main component, `ImagesSortPopup`, handles the logic for sorting images:

- **Initialization and Event Binding**: In `componentDidMount`, event listeners are added to buttons for applying and canceling the sort operation. These listeners are cleaned up in `componentWillUnmount`.
- **Sorting Operation**: `onSortEnd` method updates the state with the new order of images when the user finishes dragging an image.
- **Apply and Cancel Operations**: The `onApply` method updates the state to indicate the operation is being applied, then calls the `onClose` callback with the new sorted images. The `onClose` method simply triggers the `onClose` callback without arguments to indicate cancellation.
- **Rendering**: The `render` method displays the `Popup` component containing the sortable images and buttons for applying or canceling the operation. The `footerContent` method provides the content for the popup's footer, including the buttons.

This setup allows users to interactively sort images in a modal popup and either apply the new order or cancel the operation.