## Imports

The `DestinationMapModal` component imports various libraries, utilities, models, components, and styles:

- **React Libraries**: Uses `React`, `useState`, `useEffect`, and `FC` (Function Component) from the React library for managing the component lifecycle and state.
- **MobX**: Imports `observer` from `mobx-react` to make the component reactive to state changes in MobX stores.
- **Custom Hooks**: Utilizes `useStore`, a custom hook for accessing MobX stores.
- **Utilities**: Imports `setBodyOverflow` from `frontend/utils/ui.utils` to control the body's overflow property.
- **Models**: Includes `ITour` interface from `models/data/map/IItinerary` to type the tours prop and `SitecoreDictionary` for accessing string constants.
- **Components**: 
  - `DestinationContent` and `ItineraryGuide` for displaying main content related to the tours and itineraries.
  - Icon components `SvgChevronLeft` and `SVGCross` for rendering icons.
- **Styles**: Uses CSS modules for styling, importing `styles` from `DestinationMapModal.module.scss`.

## Structure

The `DestinationMapModal` component is structured as follows:

- **Props**: Accepts three props:
  - `onClose`: Function to call when the modal needs to be closed.
  - `tours`: Array of `ITour` objects representing the tours to be displayed.
  - `expandedSection`: Optional string to indicate which section should be initially expanded.

- **State Management**:
  - `expandedSectionState`: Manages the current expanded section in the modal.
  - `selectedItinerary`: Stores the currently selected itinerary.
  - `activeRoutes`: Holds active routes data related to the selected itinerary.
  - `selectedRoute`: Manages the currently selected route within an itinerary.

- **Lifecycle**:
  - An `useEffect` hook is used to set the body overflow to 'hidden' when the modal mounts and resets it on unmount.

- **Event Handlers**:
  - `onItineraryClick`: Handles clicks on itineraries, updating the selected itinerary and expanded section.
  - `onRouteClick`: Updates the selected route based on user interaction.
  - `onItineraryCreate`: Updates the active routes when a new itinerary is created.

- **Rendering**:
  - The modal structure comprises a header with back and close buttons, and a body that conditionally renders `DestinationContent` and `ItineraryGuide` based on the selected itinerary.

## Logic

The component's logic centers around managing the state of the itinerary and routes within the modal:

- **Initialization**: On component mount, the body overflow is set to prevent background scrolling. The component also initializes states based on props, particularly the `selectedItinerary` which is determined by the `expandedSection` prop.

- **State Updates**:
  - When an itinerary is clicked, the component updates both the `selectedItinerary` and `expandedSectionState`.
  - Clicking on a route updates the `selectedRoute` based on the chosen itinerary.
  - Creating a new itinerary triggers an update to `activeRoutes`.

- **Effects**:
  - The use of `useEffect` for handling component mount and unmount ensures that the modal does not interfere with the rest of the page's scroll behavior.

- **Data Passing**:
  - The component passes down necessary handlers and data to `DestinationContent` and `ItineraryGuide` to allow these child components to interact with the modal's state effectively.

This component is wrapped with `observer` from MobX, ensuring that it reacts to relevant changes in the MobX store state, particularly useful for dynamic data updates and reactivity across the user interface.