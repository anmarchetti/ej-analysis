## Imports

The `TerminalInfo` component relies on multiple imports which are categorized as follows:

1. **React and Sitecore JSS:**
   - `FC` (Function Component) from `react` for typing the component.
   - `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering Sitecore managed text fields.

2. **Custom Hooks and Components:**
   - `useMobileViewport` from `frontend/hooks/useMediaQuery` determines if the viewport is mobile-sized.
   - `Callout` from `frontend/components/common/Callout/Callout` is a custom component used to display additional information on hover or click.
   - `IconWalkingWalking` from `frontend/components/icons-new/WalkingWalking` renders a specific SVG icon.

3. **Models and Enums:**
   - `CalloutOrientation` and `CalloutPosition` from `models/enum/Callout` are enums used to specify the orientation and position of the `Callout` component.
   - `ISitecoreField` from `models/sitecore/generic/ISitecoreField` is an interface for typing Sitecore fields.

4. **Styles:**
   - `styles` from `./TerminalInfo.module.scss` contains module-specific styles applied to the component.

## Structure

The `TerminalInfo` component is structured as follows:

- **Interfaces:**
  - `ITerminalInfoFields`: Defines the shape of the expected Sitecore fields (`TerminalLabel` and `TerminalTooltipText`).
  - `ITerminalInfoProps`: Defines the props accepted by the component which includes an optional `fields` object of `ITerminalInfoFields` type and an optional `terminal` string.

- **Component Definition:**
  - `TerminalInfo` is a functional component typed with `FC<ITerminalInfoProps>`.
  - Inside, it checks for the existence of `fields`. If not present, it returns `null`.
  - It destructures `TerminalLabel` and `TerminalTooltipText` from `fields`.
  - If the `terminal` prop is provided, it displays it directly. Otherwise, it prepares and displays a tooltip using the `Callout` component.

## Logic

1. **Viewport Check:**
   - The `useMobileViewport` hook is used to determine if the current viewport is mobile-sized which influences how the `Callout` component behaves (either as a tooltip or a drawer).

2. **Conditional Rendering:**
   - If the `fields` prop is not provided, the component renders nothing (`return null`).
   - If the `terminal` prop is provided, the `terminal` string is displayed inside a `div` with a specific style.
   - If the `terminal` is not provided, a `Callout` component is used to show `TerminalTooltipText` on hover or click. The content of the `Callout` includes the `IconWalkingWalking` and the text from `TerminalTooltipText`.

3. **Callout Configuration:**
   - The `Callout` component is configured to appear at the bottom and to the right of the trigger element.
   - It switches between a tooltip and a drawer based on the viewport size, using `isDrawerVariant`.
   - `drawerTitle` is set to the value of `TerminalLabel` when in mobile view.
   - Additional classes are applied to the footer of the drawer via `footerClassName`.

This component effectively displays terminal-related information with adaptive behavior based on the screen size and provided data.