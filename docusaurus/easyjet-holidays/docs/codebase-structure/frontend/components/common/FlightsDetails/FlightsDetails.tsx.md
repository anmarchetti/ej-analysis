### Imports

The `FlightsDetails` component imports several modules and components to function properly:

- `FC` from `react`: Importing `FC` (Function Component) from React to type the component with TypeScript.
- Utility function `getRouteByDirection` from `frontend/utils/airports.utils`: This function is used to categorize the routes into outbound and inbound.
- Interface `IRoute` from `models/data/IRoute`: This is used to type the `routes` prop in the `FlightsDetails` component.
- Component `Flight` and interface `IFlightProps` from `./Flight/Flight`: The `Flight` component is used to render individual flight details. `IFlightProps` is the interface for the props expected by the `Flight` component.
- CSS module `styles` from `./FlightsDetails.module.scss`: This module contains the styles specific to the `FlightsDetails` component.

### Structure

The `FlightsDetails` component is defined as a functional component using TypeScript. It extends the properties of `IFlightProps` excluding the `route` property and adds a new `routes` property:

```typescript
export interface IFlightsDetailsProps extends Omit<IFlightProps, 'route'> {
    routes: IRoute[];
}
```

The component structure is as follows:

- **Component Definition**: `FlightsDetails` is a functional component that receives `IFlightsDetailsProps` as props.
- **JSX Structure**: The component returns a `div` element with a class of `flights`. Inside this `div`, it conditionally renders two `Flight` components (for `outbound` and `inbound` routes) separated by a `div` with a class of `separator`.

### Logic

The logic of the `FlightsDetails` component is encapsulated in the following steps:

1. **Route Categorization**: Using the `getRouteByDirection` utility function, the `routes` array is split into `outbound` and `inbound` routes.
2. **Terminal Information Check**: The component checks whether terminal information (`arrTerminal` or `depTerminal`) is available for either the `outbound` or `inbound` routes. This is used to determine whether to show terminal information in the `Flight` components.
3. **Conditional Rendering**: 
   - The `outbound` route is rendered with a `Flight` component if it exists. The `shouldShowTerminal` prop is passed based on the combined logic of the parent's `shouldShowTerminal` and the availability of terminal information.
   - A separator is always rendered between the outbound and inbound flights.
   - The `inbound` route is rendered similarly to the `outbound` route, based on the same conditions.

The spread operator (`...flightProps`) is used to pass down remaining props to each `Flight` component, ensuring that all necessary flight-related props are included without explicitly listing them.