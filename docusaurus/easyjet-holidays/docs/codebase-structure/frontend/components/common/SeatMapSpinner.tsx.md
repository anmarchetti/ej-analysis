## Imports

The SeatMapSpinner component imports two primary resources:

- **React**: This import from the 'react' package allows the use of React functionality within the component.
- **SvgSeatSideViewFilled**: This is a specific SVG icon component imported from 'frontend/components/icons-new/Seat_(sideView)Filled'. It represents a filled side view of a seat, likely used for visual representation in the UI.

## Structure

The `SeatMapSpinner` component is a functional component that accepts `props` of type `ISeatMapSpinnerProps`. This props interface is defined to optionally include a `header` string.

### Component Hierarchy

- **Root div (`seat-map-spinner`)**: Acts as the container for the spinner with a custom data attribute `data-tid` set to 'seat-map-spinner'.
  
- **Overlay Spinner (`overlay-spinner`)**: Contains the loading animation and optional header.
  
  - **Overlay Spinner Container (`overlay-spinner__container`)**: Houses the icon and header.
    
    - **Icon Container (`overlay-spinner__icon-container`)**: Encapsulates the seat view icon.
      - **Icon (`overlay-spinner__icon`)**: A placeholder div for possibly additional styling or icons.
      - **SvgSeatSideViewFilled**: The imported SVG icon component.
    
    - **Header**: Conditionally rendered based on the presence of `props.header`. Displays the header text if available.
  
  - **Animation Wrapper (`animation-wrapper`)**: Contains rows of shimmer effects to indicate loading.
    - **Animation Rows (`animation-row`)**: Each row contains multiple divs with class `placeholder-loading placeholder-shimmer` to create a shimmering effect during loading.

## Logic

The component's logic is straightforward:

- **Conditional Rendering**: The header within the overlay spinner is conditionally rendered based on the presence of the `header` prop. If `header` is provided, it is displayed inside a div with the class `overlay-spinner__header`.
  
- **Static Layout**: The rest of the component structure is static, consisting of predefined classes and containers designed to visually represent a loading state. The shimmer effect created by the `placeholder-loading placeholder-shimmer` classes simulates the content loading process.

This component is primarily used to provide a visual cue during data loading processes, enhancing the user experience by indicating that data fetching or processing is in progress. The use of an SVG icon suggests that the component might be specifically tailored for scenarios involving seat selection or viewing in applications like ticket booking systems.