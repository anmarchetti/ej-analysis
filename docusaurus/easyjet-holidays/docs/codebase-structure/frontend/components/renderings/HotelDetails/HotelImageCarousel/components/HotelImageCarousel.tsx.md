## Imports

The component imports various hooks, utilities, components, and styles necessary for its functionality. These imports can be categorized into several groups:

### React and React Utilities
- `MutableRefObject`, `useCallback`, `useEffect`, `useMemo`, `useRef`, and `useState` are imported from `react` for state management and rendering control.

### Third-Party Libraries
- `ImageGallery` from `react-image-gallery` for carousel functionality.
- `Placeholder` from `@sitecore-jss/sitecore-jss-nextjs` for rendering dynamic Sitecore components.
- `classNames` for conditional class name management.
- `observer` from `mobx-react` for making the component reactive to MobX state changes.

### Custom Hooks and Utilities
- Several custom hooks such as `useCarouselTracking`, `useMoreThenTabletViewport`, `usePriceLabels`, `useShouldRenderVideo`, and `useStore` are imported to manage various aspects of the application state and media queries.
- Utility functions and constants from various model and enum files like `cmsUrls`, `SitecoreDictionary`, `SiteSettings`, etc., to manage URLs and settings.

### Components
- Various UI components like `ImagesMultipleSortPopup`, `LikeBadge`, `LuxuryWrapper`, `PromoBadge`, `SocialProofingBanner`, and more for building the complex UI structure of the carousel.
- Utility components like `FullScreenImageCarousel`, `HotelImageCarouselEditMode`, `HotelImageCarouselShimmer`, and `HotelImageCarouselThumbnails` for specific functionalities within the carousel.

### Styles
- `styles` from `./HotelImageCarousel.module.scss` for component-specific styling.

## Structure

The component `HotelImageCarousel` is a functional React component utilizing TypeScript for type safety. It accepts `IHotelImageCarouselProps` as props which includes types for `fallbackImage`, `rendering`, `offer`, and `withoutSelection`.

### Main Functional Component
- The component uses various state hooks to manage the state of images, UI flags (like full-screen mode, loading states), and carousel settings.
- Refs are used to manage direct interactions with the DOM for elements like the main slider and thumbnails.
- It conditionally uses different layouts and sub-components based on the mode (e.g., edit mode, luxury mode) and the viewport size.

### Effects and Callbacks
- Several `useEffect` hooks are used to handle component lifecycle events like mounting, updates based on prop changes, and unmounting.
- `useCallback` is heavily used to memoize callbacks for performance optimization, especially those passed to deeply nested child components or those that handle complex logic.

## Logic

### Data Fetching and State Management
- The component fetches live prices and other data based on the provided `giataCode` and updates its state accordingly.
- It interacts with a MobX store to get application-wide settings and state, which influences rendering and functionality, like checking if the sidebar is loaded or if certain features are enabled.

### Event Handling
- The carousel's navigation, image addition, deletion, selection, and full-screen toggling are managed through various handlers.
- Handlers are also set up for custom interactions in edit mode, like sorting images or deleting multiple images.

### Rendering Logic
- The component conditionally renders different layouts and components based on the state like `isLuxuryDesktop`, `isEditMode`, and whether certain features are enabled.
- It uses custom render functions passed as props to the `ImageGallery` for customized rendering of main images, thumbnails, and navigation buttons.

### Conditional Rendering
- Depending on the state, different UI components are rendered, like `LuxuryWrapper` for luxury mode, `SocialProofingBanner` for social proofing, and different popups for image sorting and editing in edit mode.

This component is designed to be highly dynamic and responsive to the application's state, providing a rich interactive experience tailored to the content and settings defined in Sitecore and the application's state managed by MobX.