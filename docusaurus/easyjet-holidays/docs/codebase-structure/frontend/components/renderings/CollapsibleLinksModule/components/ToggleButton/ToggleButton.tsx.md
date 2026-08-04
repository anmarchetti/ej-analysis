## Imports

The `ToggleButton` component imports several modules and assets to function correctly:

- **React and Hooks**: Utilizes the `FC` (Function Component) type from `react` for type definitions.
- **Class Names**: Uses `classNames` for conditional class assignment.
- **Custom Hooks**:
  - `useXSMobileViewport` from `frontend/hooks/useMediaQuery` to check if the viewport is extra small.
  - `useStore` from `frontend/hooks/useStore` to access the application state and functions.
- **Types and Interfaces**:
  - `TStores` from `frontend/store/IStores` for typing the store structure.
  - `ICollapsibleLinksModuleParams` from `frontend/components/renderings/CollapsibleLinksModule/CollapsibleLinksModule` for specific module parameters.
- **Utilities**:
  - `isSitecoreCheckboxSelected` from `frontend/utils/sitecore.utils` to check the state of checkboxes in Sitecore.
- **Models**:
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing dictionary entries.
- **Components**:
  - `Button` from `frontend/components/common/Button` as a reusable button component.
  - `SVGChevronDown` and `SvgChevronRight` from `frontend/components/icons-new` for displaying icons.
- **Styles**:
  - `styles` from `./ToggleButton.module.scss` for component-specific styles.

## Structure

The `ToggleButton` component is structured with the following properties defined in the `IToggleButtonProps` interface:

- `drawerContentRef`: A React ref object pointing to the drawer content.
- `isBlockExpanded`: Boolean indicating if the collapsible block is expanded.
- `moduleTitle`: Title of the module, used for tracking.
- `params`: Parameters specific to the collapsible links module.
- `rendUid`: Unique identifier for the rendering instance.
- `setIsBlockExpanded`: Function to set the expanded state of the block.
- `isDrawerBtn`: Optional boolean to specify if the button acts as a drawer button.

The component uses a functional component approach with destructured props for clarity and ease of use.

## Logic

### Button Text Determination

The `getButtonText` function determines the text to be displayed on the button based on several conditions:
- If `isDrawerBtn` is true, it shows a phrase for closing.
- If `isBlockExpanded` is true and not on an extra small screen, it shows a phrase to show less.
- Otherwise, it defaults to showing more.

### Button Click Handling

The `onToggleButtonClick` function handles the logic when the button is clicked:
- Toggles the expanded state of the block unless it's a drawer button.
- If on an extra small screen and the block is expanded, it ensures the drawer content is scrolled to the top.
- Tracks the module click if the click tracking is enabled in Sitecore, sending details like module ID, title, location, and button text.

### Rendering

Based on the `isDrawerBtn` flag, the component renders different types of buttons:
- If `isDrawerBtn` is true, it renders a transparent, full-width button.
- Otherwise, it renders a text button with an icon that changes between `SvgChevronRight` and `SVGChevronDown` based on the screen size and expansion state. The `SVGChevronDown` icon may also reflect vertically based on whether the block is expanded.

This component effectively manages the display and functionality of a toggle button within a UI, adapting its behavior and style dynamically based on the provided props and the current viewport size.