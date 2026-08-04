## Imports

The `LoadingAnimation` component utilizes several imports:

- `FC` from `react`: This import fetches the `FunctionComponent` type (aliased as `FC`) from React, which is used to type the component function.
- `classNames` from `classnames`: A utility function to conditionally join class names together.
- `useStore` from `frontend/hooks/useStore`: A custom React hook for accessing the Redux store state.
- `SiteSettings` from `models/enum/SiteSettings`: An enumeration that provides keys for site settings, used to retrieve specific settings from the store.
- `JSSImage` from `frontend/components/common/JSSImage`: A component for rendering images, presumably tailored for handling Sitecore JSS media fields.
- `styles` from `./LoadingAnimation.module.scss`: Module CSS for styling the `LoadingAnimation` component, enabling scoped CSS classes.

## Structure

The `LoadingAnimation` component is defined as a functional component in React, typed with `FC<ILoadingAnimationFields>`. It accepts an interface `ILoadingAnimationFields` which optionally includes:

- `className`: A string that allows custom class names to be passed to the component.
- `isCentered`: A boolean that determines whether the loading animation should be centered.

The structure of the component is straightforward, comprising a main `div` that conditionally applies CSS classes based on its props and contains a `JSSImage` component for rendering the animation icon.

## Logic

1. **Store Hook**: The component uses the `useStore` custom hook to access the `layoutStore` from the Redux store. Specifically, it retrieves the `getSetting` function from the store.

2. **Setting Retrieval**: It uses `getSetting` with the `SiteSettings.LoaderAnimationIcon` enum to get the URL of the loader animation icon.

3. **Conditional Rendering**: The component immediately returns `null` if `iconSource` (the URL for the loader animation icon) is not found, meaning no animation will be rendered if the icon source is not set in the store.

4. **Dynamic Class Application**: The `classNames` function is used to dynamically construct the class list for the main `div`. It always applies `styles.animationContainer`, conditionally applies `styles.centered` if `isCentered` is `true`, and applies the `className` passed as a prop if it is provided.

5. **Image Rendering**: The `JSSImage` component is used to render the image using the `iconSource`. It passes the `iconSource` wrapped in an object as the `field` prop, applies `styles.planeIcon` as `className`, and sets `data-tid='loading-animation-icon'` for testing purposes.

The component primarily interacts with the application's state management to determine whether and how to display the loading animation, making it highly dependent on external settings and responsive to changes in those settings.