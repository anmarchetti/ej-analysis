## Imports

The code begins with several import statements that bring in dependencies and type definitions required for the functionality:

1. **`useStore`**: A custom hook imported from `frontend/hooks/useStore`. This hook is likely used to access the global state store of the application.
2. **`getRouteByDirection`**: A utility function imported from `frontend/utils/airports.utils`, which is used to process route information.
3. **`ISitecoreCompositeField`, `ISitecoreField`**: Interfaces imported from `models/sitecore/generic/ISitecoreField`. These are used for typing the props in the component to ensure type safety and clarity.
4. **`ISitecoreAirport`**: An interface imported from `models/sitecore/IAirportsData`. This is used to type the `impactedAirports` prop, ensuring the data structure for airports is consistent throughout the application.

## Structure

The code defines an interface `IUseCrisisBannerProps` and a function `useCrisisBanner`. Here's a breakdown:

### Interface: `IUseCrisisBannerProps`
This interface describes the expected shape of the props object that should be passed to the `useCrisisBanner` function:
- **`alwaysVisible`**: An optional `ISitecoreField<boolean>` that determines if the crisis banner should always be visible, regardless of other conditions.
- **`impactedAirports`**: An optional array of `ISitecoreCompositeField<ISitecoreAirport>`. Each entry describes an airport affected in a crisis scenario, structured with Sitecore-specific field handling.

### Function: `useCrisisBanner`
This is a custom hook that takes an object of type `IUseCrisisBannerProps` as its argument and returns a boolean indicating whether a crisis banner should be displayed based on the given conditions.

## Logic

The `useCrisisBanner` function follows these logical steps:

1. **State Access**:
   - It uses the `useStore` hook to extract the `booking` object from the `viewBookingStore`. This object likely contains details about the user's current booking, which are crucial for determining the relevance of a crisis situation to the user.

2. **Always Visible Check**:
   - If the `alwaysVisible` prop is truthy and its value is `true`, the function immediately returns `true`, indicating that the crisis banner should always be shown.

3. **Early Exit Conditions**:
   - If there are no `impactedAirports` provided or there is no `booking` data available, the function returns `false`, indicating that there is no need to show the crisis banner.

4. **Route and Impact Check**:
   - The function retrieves the outbound route from the booking package's transport routes using the `getRouteByDirection` utility.
   - It maps the `impactedAirports` to an array of airport codes (`impactedAirportsArr`).
   - It checks if the outbound route's arrival point (`arrPt`) is included in the `impactedAirportsArr`. If so, it returns `true`, indicating the current booking is impacted by a crisis at one of the specified airports.

5. **Default Return**:
   - If none of the above conditions are met, the function defaults to returning `false`.

This logic ensures that the crisis banner is displayed only under relevant circumstances, enhancing the user experience by providing timely and context-specific alerts.