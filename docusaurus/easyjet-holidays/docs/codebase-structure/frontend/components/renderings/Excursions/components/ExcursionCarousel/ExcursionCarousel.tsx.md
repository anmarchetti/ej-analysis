## Imports

The `ExcursionCarousel` component utilizes multiple imports to function:

- **React and React-related imports:**
  - `React, { FC }`: Imports React and its Function Component (FC) type for type-checking.
  - `ResponsiveType`: Imported from `react-multi-carousel` to manage responsive settings for different viewport sizes.

- **Utility and Hook imports:**
  - `classNames`: A utility function for conditionally joining class names together.
  - `useMobileViewport` and `useMoreThenTabletViewport`: Custom hooks from `frontend/hooks/useMediaQuery` to check for specific viewport sizes.
  - `useStore`: A hook for accessing the Redux store state.
  - `CAROUSEL_DESKTOP_MAX_BREAKPOINT`: A constant that defines the maximum breakpoint for desktop view.

- **Model and Component imports:**
  - `IExcursion`: Interface from `models/data/IExcursions` defining the structure of excursion data.
  - `CarouselWrapper`, `SliderButtonsGroup`, `ExcursionItem`: React components used within the carousel.
  - `IExcursionsFields, IExcursionsParams`: Interfaces defining the props structure for the `Excursions` component.

- **Utility Functions and Constants:**
  - `DESKTOP_ITEMS_AMOUNT`, `TABLET_ITEMS_AMOUNT`, `HORIZONTAL_VIEW_AMOUNT`, `getShowDots`, `hideArrows`: Imported from `frontend/components/renderings/Excursions/Excursions.utils` for managing the carousel's behavior based on data length and viewport.

- **Styles:**
  - `styles`: Specific module SCSS styles for styling components within the carousel.

## Structure

The `ExcursionCarousel` component is structured as follows:

- **Props Interface (`IExcursionCarouselProps`):**
  Defines the properties expected by the `ExcursionCarousel` component, including:
  - `excursions`: Array of excursion data.
  - `fields`: Fields related to the excursions.
  - `params`: Parameters for how the excursions should be displayed.
  - `trackExcursion`: Optional function for tracking interactions with an excursion.

- **Component Definition:**
  - The component is defined as a functional component using React's `FC` type with `IExcursionCarouselProps` for props validation.
  - Inside the component, several hooks and constants are used to determine the layout and behavior based on the viewport size and excursion data.

## Logic

The component logic handles the rendering and behavior of the carousel based on various conditions:

- **Viewport Checks:**
  - `isMobile` and `isMoreThenTabletViewport` are determined using custom hooks to adjust the carousel's behavior based on the viewport size.

- **Responsive Settings:**
  - The `responsive` object configures the carousel differently for desktop, tablet, and mobile viewports, adjusting the number of items displayed based on the available excursions and predefined item amounts for each breakpoint.

- **View Adjustments:**
  - `isHorizontalView`: Determines if the carousel should display items horizontally based on the number of excursions and the viewport.
  - `showDots` and `isArrowsHidden`: Functions determine whether navigation dots and arrows should be shown, depending on the number of items and the viewport.

- **Rendering:**
  - The `CarouselWrapper` component is used to wrap the `ExcursionItem` components, passing various props like `responsive`, `arrows`, and `showDots` to control its behavior.
  - Each `ExcursionItem` is rendered within a map function, receiving specific props such as `fields`, `params`, and `item`.

This structure and logic ensure that `ExcursionCarousel` is a responsive and dynamically adjustable component suitable for displaying excursion data across different devices and configurations.