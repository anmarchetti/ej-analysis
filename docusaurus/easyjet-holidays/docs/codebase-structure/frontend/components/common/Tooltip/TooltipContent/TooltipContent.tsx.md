## Imports

The `TooltipContent` component uses several imports from React and other libraries to function properly:

- **React Imports**:
  - `FC`, `forwardRef`, `HTMLProps`, `PropsWithChildren`: Standard React types and HOCs for typing and component creation.

- **Floating UI**:
  - `FloatingArrow`, `FloatingPortal`, `useMergeRefs`: Components and hooks from `@floating-ui/react` for creating floating UI elements like tooltips.

- **Classnames**:
  - `classnames`: A utility to conditionally join classNames together.

- **Custom Hooks and Components**:
  - `useMoreThenDesktopViewport`: A custom hook to check if the viewport is larger than desktop size.
  - `useStore`: A custom hook for accessing the global state store.
  - `JSSImageNext`: A component for optimized image rendering.
  - `RichTextWithLinks`: A component to render rich text content with links.
  - `useTooltipContext`: A hook to access tooltip context values.

- **Local Components**:
  - `MobileContent`: A component specific for rendering the mobile version of the tooltip content.

- **Styles**:
  - `styles`: Module CSS for styling components specific to the tooltip.

## Structure

The file defines two main React components:

- **DefaultContent**:
  - A functional component that displays an image and text if provided. It uses the `JSSImageNext` for rendering the image and `RichTextWithLinks` for rendering the text.

- **TooltipContent**:
  - A functional component wrapped with `forwardRef` to forward refs to child components.
  - It utilizes several pieces of state and context from `useTooltipContext` and `useStore` hooks to manage tooltip behavior and integration with other UI elements.
  - It conditionally renders different layouts for desktop and mobile using the `isDesktop` flag from `useMoreThenDesktopViewport`.

## Logic

### DefaultContent Component

- Renders an image using `JSSImageNext` if the `icon` prop is provided and not disabled by global state.
- Renders text using `RichTextWithLinks` if the `text` prop is provided.

### TooltipContent Component

- **Context and State Management**:
  - Uses `useTooltipContext` to manage tooltip-specific state like visibility, positioning, and animations.
  - Uses `useStore` to fetch global state that affects the tooltip, such as modal visibility and tooltip icon settings.

- **Ref Management**:
  - Combines multiple refs using `useMergeRefs` to ensure all necessary refs are applied to the tooltip container.

- **Conditional Rendering**:
  - Returns `null` if `isDisplayed` from `useTooltipContext` is `false`, indicating that the tooltip should not be shown.
  - Conditionally renders either a desktop or mobile version of the tooltip based on the `isDesktop` flag.

- **Desktop Tooltip**:
  - Renders a `div` that contains the `content` and a `FloatingArrow`.
  - Applies dynamic styles and properties for floating behavior using `getFloatingProps`.

- **Mobile Tooltip**:
  - Uses the `MobileContent` component to handle mobile-specific interactions and animations.
  - Passes several props and handlers to manage state and animations specific to the mobile environment.

This structure and logic ensure that the tooltip content is responsive and integrates seamlessly with both desktop and mobile environments, adapting its behavior and style accordingly.