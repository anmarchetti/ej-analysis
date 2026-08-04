### Imports

The component imports several modules and components to function properly:

- **React and FC (Function Component)**: Utilizes the React library and the Function Component type from React for component creation.
- **ResponsiveType from 'react-multi-carousel'**: Imports type definitions for responsive settings in the carousel.
- **useXSMobileViewport from 'frontend/hooks/useMediaQuery'**: A custom hook to determine if the viewport is extra-small.
- **splitToChunksArray from 'frontend/utils/chunkArray'**: A utility function to split arrays into chunks.
- **CAROUSEL_DESKTOP_MAX_BREAKPOINT from 'frontend/utils/getSlidersToShow'**: A constant that specifies the maximum breakpoint for desktop view in the carousel.
- **FeaturedHotelsMaxItems and IFeaturedHotelsWithPrice from 'models/data/IFeaturedHotel'**: Imports a constant and an interface related to featured hotels.
- **CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper'**: A wrapper component for the carousel.
- **IComponentWithRerenderProps from 'frontend/components/hoc/withRerender'**: Interface for components that handle re-rendering.
- **ButtonGroup and FeaturedHotelCard from local files**: Custom components for the carousel's button group and individual hotel cards.
- **FeaturedHotelsTwoRows from local files**: A custom component for displaying two rows of hotel cards.

### Structure

The `FeaturedHotelsCarousel` component is structured as follows:

- **Props**: The component accepts `IFeaturedHotelsCarouselProps` which includes properties for fallback image URL, an array of hotels, a click handler function, and an optional display flag for the number of nights.
- **Responsive Settings**: Defines responsive behavior for different screen sizes (desktop, tablet, mobile) all set to display 1 item regardless of the breakpoint.
- **Chunk Array**: Depending on the screen size and whether the component was re-rendered, the hotels array is split into chunks of different sizes using the `splitToChunksArray` utility.
- **Rendering**: The component renders a `CarouselWrapper` which contains either a single `FeaturedHotelCard` or a `FeaturedHotelsTwoRows` component based on the number of hotels in each chunk.

### Logic

- **Viewport Check**: Uses the `useXSMobileViewport` hook to check if the current screen size is less than medium.
- **Responsive Configuration**: Sets up the responsive breakpoints and the number of items to show at each breakpoint.
- **Array Chunking**: Based on the `wasRerendered` prop and the viewport size, it determines the size of chunks for splitting the hotels array.
- **Conditional Rendering**:
  - If there's more than one chunk, it displays navigation dots and a custom button group.
  - Maps over the chunks to render either a single hotel card or two rows of hotel cards depending on the number of hotels in the chunk.
- **Event Handling**: Passes the `onClick` function to the hotel card components, handling user interactions with individual hotels.

This component primarily handles the display and interaction logic for a carousel of featured hotels, adapting its behavior and layout based on the screen size and re-render status.