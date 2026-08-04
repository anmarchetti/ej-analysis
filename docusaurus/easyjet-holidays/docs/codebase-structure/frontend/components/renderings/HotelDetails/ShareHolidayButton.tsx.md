## Imports

The `ShareHolidayButton` component imports several modules and utilities to function properly, categorized as follows:

- **React and State Management**: 
  - `React`, `FC`, `useState` from the `react` library for building the component and managing its state.

- **Constants and Utilities**:
  - `ONE_SECOND` from `code/commonNumbers` for timing operations.
  - `shareUrls` from `code/endpoints` which likely contains functions to generate URLs for different sharing services.
  - `removeUTMParamsFromUrl` from `frontend/utils/utm.utils` for cleaning up URLs.

- **Custom Hooks**:
  - `useIsMounted` from `frontend/hooks/useIsMounted` to check if the component is still mounted before setting state.
  - `useMobileViewport` from `frontend/hooks/useMediaQuery` to determine if the viewport corresponds to a mobile device.
  - `useStore` from `frontend/hooks/useStore` for accessing the global state store.

- **Models and Types**:
  - Enumerations from `models/enum/` for various configurations.
  - Interfaces from `models/sitecore/generic/` defining the shape of the data expected from Sitecore.

- **UI Components**:
  - `Button`, `Callout`, `Popup` from `frontend/components/common/` for displaying UI elements.
  - `SvgInfoFilled`, `SvgShare` from `frontend/components/icons-new/` for rendering SVG icons.

- **Type Definitions**:
  - `IShareOptionFields` and `IShareHolidayButtonFields` interfaces define the props structure for the component and its options.

## Structure

The `ShareHolidayButton` is a functional component using React hooks for state and effects. It accepts `props` of type `TShareHolidayButtonProps`, which includes various configurations and options for the share button functionality.

### Component Props

The component is designed to handle both desktop and mobile configurations:
- `DesktopOptions` and `MobileOptions` contain arrays of share options.
- `ShareBtnEnabledInDesktop` and `ShareBtnEnabledInMobile` booleans to enable/disable the button on respective devices.

### State Management

Two pieces of state are managed within the component:
- `isMenuOpened`: Boolean to control the visibility of the share options menu.
- `isAlertShown`: Boolean to control the visibility of alerts after actions (like copying to clipboard).

### Conditional Rendering

The component conditionally renders different elements based on the device type and other conditions:
- A `Callout` for desktop view if enabled.
- A share button for mobile view if enabled.
- A `Popup` for mobile devices when the menu is opened.

## Logic

### URL Management

The component cleans the current URL by removing UTM parameters to ensure clean sharing links.

### Share Logic

Different sharing options are handled based on the type specified in the configuration:
- For mobile devices with native share capability, `navigator.share` is used.
- Fallbacks to custom share options if native sharing fails or isn't available.

### Event Handlers

- `onShareClick`: Handles click events on the share button, determining the appropriate share action based on the device and availability of native sharing.
- `onCopyClick`: Manages the clipboard operations for copying the URL, and shows an alert post-action.

### Utility Functions

- `getUtmShareParams`: Generates UTM parameters for tracking, based on the type of share action.
- `isMobile`: A helper to determine if the device is mobile, considering experimental `userAgentData` or falling back to the `useMobileViewport` hook.

### Rendering Functions

- `renderOption`: Renders individual share options based on the type.
- `renderOptions`: Maps through the options and calls `renderOption` for each.
- `getAlert`: Generates an alert message if conditions are met, particularly after copying to the clipboard.

This component encapsulates complex interactions tailored for both desktop and mobile environments, providing a robust solution for sharing functionalities integrated with analytics and responsive design considerations.