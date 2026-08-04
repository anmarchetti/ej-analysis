## Imports

The `AnimatedWrapper` component imports several modules and utilities to function properly:

- `FC, ReactNode` from `react`: These imports from React allow the use of functional components (`FC`) and the typing for children (`ReactNode`).
- `classnames`: A utility function to conditionally join class names together.
- `observer` from `mobx-react`: Enhances the component to reactively update when observables change in MobX.
- `useAnimatedWrapper` from `./AnimatedWrapper.utils`: A custom React hook specific to this component, managing the animation logic.
- `styles` from `./AnimatedWrapper.module.scss`: Module CSS for scoped styling of this component.

## Structure

The `AnimatedWrapper` component is defined as a functional component using TypeScript. It accepts several props detailed in the `IAnimatedWrapper` interface:

- `children: ReactNode`: The content to be rendered within the wrapper.
- `isShown: boolean`: A flag to control the visibility and animation state.
- `contentClass?: string`: Optional override for the CSS class of the content container.
- `disableAnimation?: boolean`: If true, disables the animation.
- `entranceClass?: string`: CSS class for the entrance animation.
- `exitClass?: string`: CSS class for the exit animation.
- `keepMounted?: boolean`: If true, the component stays mounted even if not shown.
- `onAnimationEnd?: () => void`: Callback function triggered when the animation ends.
- `wrapperClass?: string`: Optional override for the CSS class of the outer wrapper.

Default values for `wrapperClass`, `entranceClass`, `exitClass`, and `contentClass` are provided using the imported `styles`.

## Logic

### Animation Control

The core functionality of the `AnimatedWrapper` revolves around managing animations for entering and exiting:

1. **Animation Hook**: The `useAnimatedWrapper` hook is utilized, which takes `isShown`, `onEnd`, and `disableAnimation` as parameters. This hook determines whether to render the component and handles the `onAnimationEnd` event.

2. **Conditional Rendering**: The component renders `null` if `render` returned by `useAnimatedWrapper` is false and `keepMounted` is not set. This effectively unmounts the component when not needed, unless `keepMounted` is true.

3. **Class Management**: 
   - `entranceExitClass` is determined based on the value of `isShown`. If `isShown` is true, `entranceClass` is used, otherwise `exitClass`.
   - `animationClass` is set to an empty string if `disableAnimation` is true, otherwise, it uses `entranceExitClass`.
   
4. **Output Structure**: The component structure consists of a wrapper `div` with the combined class names of `wrapperClass` and `animationClass`. Inside, it contains another `div` with `contentClass` applied, which wraps the `children`.

### Event Handling

- `onAnimationEnd`: Passed to the wrapper `div` to handle the end of CSS animations. It triggers the callback provided by the `useAnimatedWrapper` hook, which in turn can trigger the `onAnimationEnd` prop if provided.

This component is wrapped with `observer` from `mobx-react`, making it reactive to MobX state changes affecting any of its props or observables used within.