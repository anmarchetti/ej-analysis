## Imports

The `HeroCarousel` component uses the following imports:

- **React**: Essential for using React component features.
- **ImageGallery**: A React component for building image galleries.
- **MobX**: Utilized for state management within the component (`observable`, `computed`, `action`, `makeObservable`).
- **MobX-React**: Provides the `inject` and `observer` decorators for React components to enable reactive data.
- **Sitecore and Frontend Utilities**:
  - `TStores` from `frontend/store/IStores` for typing the stores injected into the component.
  - `isBackend` from `frontend/utils/isBackend` to check if the code is running on a server.
  - `getTextFromHtml` from `frontend/utils/string.utils` for extracting text from HTML content.
- **Sitecore and Model Interfaces**:
  - `IHeroBannerItem` from `models/data/IHeroBannerFields` represents the data structure for hero banner items.
  - `ISitecoreComponent` from `models/sitecore/generic/ISitecoreComponent` for typing Sitecore components.
- **Higher Order Components (HOC)**:
  - `withRerender` from `frontend/components/hoc` to enhance the component with additional rendering logic.
- **Component Specific**:
  - `CountdownBanner` and `HeroBanner` from `frontend/components/renderings` are custom components displayed within the carousel.

## Structure

The `HeroCarousel` component is defined as a class extending `React.Component` and includes the following key elements:

- **Props Interface (`IHeroCarouselProps`)**: Defines the props expected by the component, including Sitecore-specific options, responsive behaviors, and functions for tracking.
- **Observable State (`isShowCountdownBanner`)**: A boolean state managed by MobX to control the visibility of the countdown banner.
- **Lifecycle Methods**:
  - `componentDidMount`: Sets a timeout to adjust slide heights and calls the tracking function.
  - `componentDidUpdate`: Checks for changes in screen size to reset slide heights.
- **Actions (`toggleShowCountdownBanner`)**: MobX action to toggle the countdown banner visibility.
- **Computed Property (`itemsToShow`)**: Filters the items to be shown based on certain conditions.
- **Rendering**: Uses the `ImageGallery` component to render either `CountdownBanner` or `HeroBanner` based on the item's fields.

## Logic

- **Initialization**: The `makeObservable` in the constructor initializes observables and actions.
- **Tracking**: On mount, the component tracks impressions of each hero banner item if they exist and the component was re-rendered.
- **Responsive Adjustments**:
  - The height of slides is adjusted based on the screen size and backend status.
  - Updates to slide heights are triggered on screen size changes detected in `componentDidUpdate`.
- **Conditional Rendering**:
  - Filters items to be displayed using the computed property `itemsToShow`, which excludes items based on specific conditions (like elapsed countdown).
  - Renders different types of banners (`CountdownBanner` or `HeroBanner`) based on item properties.
- **MobX Integration**:
  - State and actions are managed using MobX, allowing reactive data flows within the component.
- **Higher Order Component Usage**:
  - `withRerender` HOC is used to enhance the component, providing props related to re-rendering logic.
- **Dependency Injection**:
  - Uses `inject` to obtain necessary stores (`isScreenMedium`, `isEditMode`, `trackHeroBannerImpression`) and wraps the component with `observer` to make it reactive to state changes in MobX stores.