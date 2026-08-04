## Imports

The `FullScreenImageCarousel` component utilizes a variety of imports from both external libraries and internal modules:

- **React and Hooks**: Utilizes `React`, `useState`, `useEffect`, `useRef` from the React library for component and state management.
- **React Image Gallery**: Imports `ImageGallery` for displaying a carousel of images or videos.
- **React Swipeable**: Uses `SwipeableHandlers` to handle swipe gestures.
- **MobX React**: Implements `observer` from MobX for reactive state management.
- **Internal Hooks and Utilities**:
  - `useStore` is a custom hook for accessing the MobX store.
  - `cmsUrls` for constructing URLs to media assets.
- **Type Definitions and Enums**:
  - `TStores` for typing the stores used in `useStore`.
  - `ImageSize` enum to define standard image sizes.
- **Component Imports**:
  - `HotelImage`, `VideoPlayer`, `VideoThumbnailImage`, `SliderImage` for rendering specific media types.
  - `SliderNavButton` for navigation buttons in the carousel.
  - `Popup` for wrapping the carousel in a modal popup.
- **Styles**: Imports `styles` from a local SCSS module for component styling.

## Structure

The `FullScreenImageCarousel` is a functional React component defined using TypeScript. It accepts a variety of props for configuration:

- **Image and Video Handling**: Props like `currentImageIndex`, `fallbackImage`, `images` define the current state of the gallery, fallback content, and the media items to display.
- **Event Handlers**: Such as `onClose`, `handleSlide`, `onCarouselSync` to manage interactions like closing the carousel, handling slide changes, and syncing carousel states.
- **Optional Features and Settings**: Includes `autoPlay`, `startIndex`, `swipeHandlers`, and `videoTitle` to manage playback settings, initial conditions, and additional handlers for swipe gestures.
- **Styling**: `youtubePlayerClassName` for custom styling of embedded YouTube players.

Within the component:
- **State Management**: Uses `useState` for local state like `isDisabledArrowKeys` and `currentDescription`.
- **References**: Uses `useRef` for accessing DOM elements directly, necessary for operations like scrolling and accessing current indices of the carousel.
- **Effects**: Multiple `useEffect` hooks handle component lifecycle events like initialization, cleanup, and responding to state changes in the viewport orientation and screen size.

## Logic

### Initialization and Cleanup
- **Custom Thumbnails**: Initializes and destroys custom thumbnail navigation to integrate with the main image gallery.
- **Syncing Carousel**: On mount, syncs the carousel to the correct image based on `currentImageIndex` and adjusts the view if necessary based on the device orientation and screen size.

### Responsive Handling
- Adjusts the carousel's behavior based on the screen size and orientation, providing different scrolling behaviors (horizontal or vertical) to ensure the selected thumbnail is visible.

### Navigation and Accessibility
- Custom left and right navigation buttons are provided with handlers to manage focus states, which in turn control whether arrow keys are disabled.
- Thumbnails can be focused, allowing keyboard navigation.

### Rendering
- **Main Image Rendering**: Decides whether to render an image or a video player based on the presence of a `youtubeVideoId` or `cloudinaryVideoSrc`.
- **Thumbnail Rendering**: Handles the rendering of thumbnails which could be images or video thumbnails based on the media type.
- **Description Management**: Dynamically updates the description based on the currently active slide.

### Event Handling
- **Slide Changes**: Updates descriptions and triggers optional external handlers when the slide changes.
- **Thumbnail Clicks**: Optionally tracks clicks on thumbnails for analytics or additional behaviors.

This component is wrapped in a `Popup` for modal functionality and is made reactive with MobX's `observer` to ensure it updates in response to state changes in the MobX store.