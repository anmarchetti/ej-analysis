## Imports

The `MapCard` component utilizes a variety of imports from both third-party libraries and internal modules:

- **React Imports:**
  - `FC` (Function Component type), `useEffect`, and `useRef` from `react` for component creation and lifecycle management.

- **Map and Hooks:**
  - `useMap` from `@vis.gl/react-google-maps` to interact with the Google Maps instance.
  - `useXSMobileViewport` from `frontend/hooks/useMediaQuery` for responsive behavior based on viewport size.

- **Styling and Utilities:**
  - `classNames` from `classnames` for conditional class assignment.
  - `observer` from `mobx-react` for making the component reactive to MobX state changes.

- **Component and Utility Imports:**
  - Various UI components and icons like `LuxuryWrapper`, `OfferCardSlider`, `StarRating`, `Clock`, `SvgCross`, and `TripadvisorInfo` from internal component libraries.
  - `useMapCard` utility which likely contains business logic specific to this component.
  - `MapCardSkeleton` for a loading state placeholder.

- **Styles:**
  - `styles` from `./MapCard.module.scss` for CSS module styles specific to this component.

## Structure

The `MapCard` component is structured as follows:

- **Wrapper Components:**
  - `LuxuryWrapper` is used to wrap the entire content of the `MapCard`. It conditionally renders children based on the `isLuxury` prop.

- **Main Content Divisions:**
  - The main content is divided into header (`styles.head`), content (`styles.content`), and footer (`styles.footer`).
  - The header contains the place's name, ratings from TripAdvisor, and a close button.
  - The content section optionally includes an image slider (`OfferCardSlider`), a list of features or amenities, and a text description or duration if applicable.
  - The footer may contain a button if provided in the props.

- **Ref Hooks:**
  - `wrapperRef` and `sliderRef` are used to reference DOM elements for managing interactions like touch events and double-clicks.

## Logic

The component's logic is primarily managed through the `useEffect` hook and the `useMapCard` custom hook:

- **useMapCard Hook:**
  - This custom hook abstracts the state and logic necessary for the component, such as loading state, content data, and event handlers like `onClose`.

- **Responsive and Interactive Enhancements:**
  - The `useEffect` hook is used to enhance mobile interaction by disabling map zoom and dragging under certain conditions:
    - Disables double-click zooming on the map when the touch starts within the card on mobile devices.
    - Prevents map dragging when interacting with the image slider to ensure that swipe gestures navigate the slider instead of panning the map.

- **Event Handling:**
  - Double-clicks on the card stop the propagation to prevent map zooming on desktops.
  - Custom touch event listeners are added to manage map interactions based on user gestures.
  - Cleanup function in `useEffect` ensures that event listeners are removed when the component unmounts or dependencies change.

- **Conditional Rendering:**
  - Displays a `MapCardSkeleton` during the loading state.
  - Conditionally renders various parts of the UI based on the data available in `content` and props like `isLuxury`.

This component effectively combines responsive design, complex state and event management, and conditional rendering to provide a dynamic and interactive user experience within a map context.