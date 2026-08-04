### Imports

The `DestinationHighlightsCarousel` component imports several modules and components to function properly:

- **React Imports**:
  - `FunctionComponent` and `Ref` from `react` are used for typing the component and referencing elements respectively.

- **Type and Interface Imports**:
  - `ResponsiveType` from `react-multi-carousel` is used to type the responsive behavior of the carousel.
  - `IDestinationHighlightItem` from `models/data/IDestinationHighlightItem` defines the type structure for each item in the carousel.
  - `TStores` from `frontend/store/IStores` and `TCarouselRef` from `CarouselWrapper` are custom types for store and carousel reference.

- **Component and Hook Imports**:
  - `useStore` from `frontend/hooks/useStore` is a custom hook for accessing the Redux store.
  - `CarouselWrapper` from `frontend/components/common/CarouselWrapper/CarouselWrapper` is a component that provides a carousel functionality.
  - `IconChevronLeft` and `IconChevronRight` from `frontend/components/icons` are components used for the carousel's navigation arrows.
  - `DestinationHighlightsCard` is a locally imported component that renders individual items within the carousel.

- **Utility and Styling Imports**:
  - `classNames` from `classnames` is a utility to conditionally join class names together.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` provides access to a dictionary for localizing strings.

### Structure

The `DestinationHighlightsCarousel` component is defined as a function component taking `IDestinationHighlightsCarouselProps` as its props. The props include:

- `isFullWidth`: Boolean indicating if the carousel should span the full width of its container.
- `isSwipeable`: Boolean indicating if the carousel supports swipe interactions.
- `items`: Array of `IDestinationHighlightItem`, representing the data for each carousel slide.
- `responsive`: `ResponsiveType` object for responsive configuration of the carousel.
- `ssrDeviceType`: String indicating the device type on the server-side rendering context.
- `carouselRef`: Optional React ref for accessing the carousel externally.

The component structure primarily consists of a `div` wrapping the `CarouselWrapper` component. The `CarouselWrapper` is configured with various props such as responsiveness, custom navigation arrows, swipeability, and dot indicators. Each item in the `items` array is rendered using the `DestinationHighlightsCard` component wrapped in a `div` with the class `slide-wrapper`.

### Logic

The component utilizes the `useStore` hook to access the `getPhrase` function from the store, which is used to fetch localized strings for accessibility labels of the navigation arrows.

The `CarouselWrapper` component is configured with:
- `ref`: Passed `carouselRef` for external control.
- `responsive`: Passed `responsive` prop for responsive behavior based on the viewport.
- `containerClass`: Uses `classNames` to conditionally add `full-width` class if `isFullWidth` is true.
- `arrows`: Always true to show navigation arrows.
- `customLeftArrow` and `customRightArrow`: Custom components for navigation, using `IconChevronLeft` and `IconChevronRight` respectively, with accessibility labels fetched using `getPhrase`.
- `showDots`: Controlled by the `isSwipeable` prop.
- `infinite`: Set to false, indicating the carousel does not loop back to the beginning when the end is reached.
- `swipeable`: Controlled by the `isSwipeable` prop.
- `deviceType` and `ssr`: Set based on the `ssrDeviceType` prop and `true` for server-side rendering optimizations.

This setup ensures the carousel behaves responsively and accessibly, with customization options controlled through props.