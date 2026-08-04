## Imports

The code imports several modules and components which are pivotal for its functionality:

- `FunctionComponent` from `react`: Utilized for typing our functional component.
- `observer` from `mobx-react`: A higher-order component that automatically subscribes the component to any observables that are used during rendering.
- Custom hooks:
  - `useMobileViewport` from `frontend/hooks/useMediaQuery`: A hook to check if the viewport matches mobile screen sizes.
  - `useStore` from `frontend/hooks/useStore`: Custom hook for accessing MobX stores.
- Types and interfaces:
  - `TStores` from `frontend/store/IStores`: Type definition for the MobX stores.
  - `ISitecoreField` and `ISitecoreImage` from `models/sitecore/generic/ISitecoreField`: Interfaces for typing Sitecore fields and images.
- Components:
  - `JSSImage` and `JSSImageNext` from `frontend/components/common`: Components for rendering images, where `JSSImageNext` is likely an optimized or next-gen version of `JSSImage`.

## Structure

### Interface Definition

`IHeroBannerImagesProps`: Interface for the component props, which includes:
- `image`: A Sitecore field containing an image for desktop.
- `mobileImage`: A Sitecore field containing an image for mobile devices.

### Component Definition

`HeroBannerImages`: A functional component typed with `FunctionComponent<IHeroBannerImagesProps>` that renders images based on the viewport and mode (edit or normal).

### Conditional Rendering

- **Edit Mode**: If the component is being rendered in Sitecore's edit mode, it displays an image using the `JSSImage` component wrapped in a div with specific classes.
- **Normal Mode**: Otherwise, it uses the `JSSImageNext` component with additional props like `fill` and `priority` for optimized loading and rendering, especially suited for production environments where performance is critical.

## Logic

1. **Store Access**: The component uses the `useStore` hook to access `layoutStore.isEditMode`, which determines if the Sitecore page is currently in edit mode.
2. **Responsive Handling**: It uses the `useMobileViewport` hook to determine if the current device is mobile. Based on this, it decides which image (mobile or desktop) should be used.
3. **Image Selection**: The `field` variable holds the appropriate image field (either mobile or desktop) based on the viewport size. It ensures that if a mobile image is not specified (`mobileImage?.value?.src`), the desktop image will be used as a fallback.
4. **Conditional Component Rendering**: Depending on whether the page is in edit mode or not, the component renders different JSX. In edit mode, a simpler `JSSImage` component is used for ease of integration with Sitecore's editing features. In normal mode, `JSSImageNext` is used for enhanced performance and additional features like lazy loading.

This structure and logic ensure that the component is both flexible and efficient, catering to different environments (edit and production) and responsive needs (desktop and mobile).