## Imports

The `DestinationGuides` component uses several imports to function correctly:

- **React and Hooks**: Imports `React`, `FC` (Function Component type), and `useState` hook for managing component state.
- **ResponsiveType**: Imported from `react-multi-carousel` to handle responsive settings for the carousel.
- **classNames**: A utility function for conditionally joining class names together.
- **Custom Hooks and Constants**: `useStore` for accessing the application's store, and `CAROUSEL_DESKTOP_MAX_BREAKPOINT` for responsive breakpoints.
- **Models**: `ITour` for typing the tours data, and `EventActions`, `EventLabels` for tracking event parameters.
- **Components**: `CarouselWrapper` and `CarouselButton` for rendering the carousel and its navigation buttons.
- **Local Components**: `DestinationMapModal` and `ItineraryItem` for displaying detailed information about each tour.
- **Styles**: The styles specific to this component are imported from `DestinationGuides.module.scss`.

## Structure

The `DestinationGuides` component is structured as follows:

- **Props**: Accepts a single prop `tours`, which is an array of `ITour` objects.
- **State Management**:
  - `isGuideOpened`: A boolean state to toggle the visibility of the `DestinationMapModal`.
  - `selected`: A state to hold the ID of the currently selected tour.
- **Tracking Store**: Extracts `trackMapEvent` from the store using a custom `useStore` hook for event tracking.
- **Responsive Settings**: Defines breakpoints and items to show for desktop, tablet, and mobile views.
- **Event Handlers**:
  - `onOpenRouteMap`: Sets the modal open and logs the event.
  - `onCloseRouteMap`: Closes the modal and logs the event.
- **Rendering Logic**:
  - Determines whether to use a carousel based on the number of tours.
  - Conditionally applies CSS classes based on whether the carousel is active.
  - Maps over the `tours` array to render `ItineraryItem` components.
  - Conditionally renders the `DestinationMapModal` if a guide is opened.

## Logic

The component's logic revolves around the presentation and interaction with the list of tours:

- **Carousel vs. Block Display**: Based on the number of tours (more than 3), it decides whether to display the tours in a carousel or as a block of items.
- **Event Handling**:
  - Opening a route map sets the state to show the modal and records the action via `trackMapEvent`.
  - Closing the route map resets the state and records the closing action.
- **Conditional Rendering**: The component conditionally renders different layouts and components based on the state (`isGuideOpened`) and the number of tours.
- **Responsive Carousel**: The carousel's behavior and layout adjust based on the screen size, ensuring optimal display across devices.
- **Data Mapping**: Each tour's data is passed down to the `ItineraryItem` components, which handle the display of individual tour details.

This structure and logic ensure that the `DestinationGuides` component is both functional and responsive, providing a dynamic user experience based on the provided data and user interactions.