## Imports

The component imports various modules, components, and types necessary for its functionality:

- **React**: Base library for building the component.
- **BaseTrackingStore**: A store for tracking events related to user interactions.
- **ITour**: Interface representing the structure of a tour object.
- **SitecoreDictionary**: Enum for consistent access to dictionary keys used for translations or specific values.
- **EventLabels**: Enum for tracking event labels, ensuring consistent labeling across events.
- **Button, RouteInfoBlock, IconChevronDown, IconRunMan, IconTaxi, IconTourBus**: Custom components and icons used within the component to render UI elements.
- **RouteType**: An enum defined within the file to manage route types (Walking, Car, Bus).

## Structure

The component is structured as follows:

- **IDestinationContentProps**: Interface defining the props expected by the `DestinationContent` component which includes methods for handling clicks, tracking events, and retrieving phrases.
- **DestinationContent Class**: A React class component that manages the state of expanded sections and handles user interactions.
  - **Constructor**: Initializes the component state.
  - **onToggleSection**: Method to handle expanding/collapsing tour sections and tracking tab clicks.
  - **onRouteClick**: Method to handle clicks on specific routes.
  - **render**: Renders the component UI, mapping over tours to display each section with its details and iteratively rendering itinerary items.

## Logic

The component's logic revolves around user interaction and dynamic content display based on the state:

- **State Management**: Manages an `expandedSection` state to keep track of which tour section is currently expanded.
- **Event Handling**:
  - **onToggleSection**: Toggles the expanded state of sections based on user clicks. It also triggers a tracking event when a section is expanded.
  - **onRouteClick**: Handles clicks on individual routes, calling a passed handler with the route's ID.
- **Dynamic Content Rendering**:
  - Tours are mapped to render individual sections. Each section can be expanded or collapsed, showing detailed information if expanded.
  - Each tour's itinerary items are rendered based on the type of route, displaying appropriate icons and information.
  - The `RouteInfoBlock` component is used to display summarized information about each tour, including duration, distance, and number of stops.
- **Conditional Rendering**: Uses conditional logic to display icons and additional information based on the route type, enhancing user experience by providing visual cues and detailed descriptions.
- **Phrase Retrieval**: Utilizes the `getPhrase` method passed via props to fetch localized phrases for display, ensuring the UI is adaptable to different locales.