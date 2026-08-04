### Imports

The `SwipeableContent` component uses several imports from various libraries and local modules:

- `FC` and `useContext` from `react`: These are hooks and types from React for functional components and using context within them.
- `EventData` and `Swipeable` from `react-swipeable`: This is used to handle swipe gestures on touch devices.
- `classNames` from `classnames`: A utility function to conditionally join class names together.
- `useMobileViewport` from `frontend/hooks/useMediaQuery`: A custom hook to check if the viewport matches a mobile device.
- `FloatingPopupContext` from `frontend/components/common/FloatingPopup/FloatingPopup`: Context from a custom floating popup component to manage its state.
- `styles` from `./SwipeableContent.module.scss`: Module CSS for styling the `SwipeableContent` component.

### Structure

The `SwipeableContent` component is defined as a functional component using React's Functional Component (FC) type, with `ISwipeableContentProps` as its props type. The props include:

- `children`: This is a ReactNode, allowing any React elements to be passed as children of this component.

The component utilizes the `useMobileViewport` custom hook to determine if the current device is a mobile device and the `FloatingPopupContext` to interact with the floating popup's state, specifically for managing translations and close actions.

### Logic

The component contains two main logical handlers for swipe actions:

1. **onSwipedPopup**: This function is triggered when a swipe action is completed. It checks if the device is mobile and if the swipe direction was 'Down'. If both conditions are met, it triggers the `onClose` method from the `FloatingPopupContext` to potentially close the popup.

2. **onSwipingPopup**: This function is triggered during a swipe action. It prevents the default action and propagation of the event to other elements. It then uses the `setTranslateY` method from the `FloatingPopupContext` to adjust the Y translation of the popup based on the swipe's deltaY. If `deltaY` is negative, it sets the translation to `absY`; otherwise, it resets it to 0.

The `Swipeable` component from `react-swipeable` is used to wrap the children. It is configured with the `onSwiped` and `onSwiping` handlers and dynamically applies the `swipeZone` class from `styles` if the device is mobile.

This setup allows the `SwipeableContent` component to provide interactive swipe functionalities, particularly useful for mobile interfaces where screen space is limited and gesture-based navigation is common.