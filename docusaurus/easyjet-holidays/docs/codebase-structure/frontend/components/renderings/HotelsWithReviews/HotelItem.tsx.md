## Imports

The `HotelItem` component relies on several imports from both React libraries and local components:

- `{ FC }` from `react`: Importing `FC` (Functional Component) from React for typing the component.
- `EcoCertifiedPill`, `RouterLink`, `HotelStarRating`, `TripadvisorInfo`: These are custom components imported from the project's component library which are used within `HotelItem` for displaying various UI elements.
- `{ IHotelItem }`: This is the TypeScript interface imported to type the props received by the `HotelItem` component.
- `styles` from `./HotelsWithReviews.module.scss`: Module CSS for styling the `HotelItem` component.

## Structure

The `HotelItem` component is structured as follows:

- **Component Definition**: `HotelItem` is defined as a functional component using React's `FC` type, which takes `IHotelItem` as its props type.
- **Conditional Rendering**: The component first checks if the `Name` prop is present. If not, it returns `null`, effectively rendering nothing.
- **RouterLink Component**: Used to wrap the hotel name and make it a clickable link. It is styled and identified with a `dataId`.
- **Rating Wrapper**: A `div` that conditionally includes the `HotelStarRating`, `TripadvisorInfo`, and `EcoCertifiedPill` components based on the presence of their respective data.

## Logic

The component's logic primarily revolves around conditional rendering based on the props it receives:

- **Name Check**: If there is no `Name` provided in the props, the component renders `null`.
- **Star Rating**: Displays the `HotelStarRating` component if the `StarRating` prop is provided.
- **Tripadvisor Information**: Shows the `TripadvisorInfo` component only if both `HotelRating` and `TotalNumberOfReviews` are provided.
- **Eco Certification**: Displays the `EcoCertifiedPill` if `EcoFacility` is an object with a `Name` property.

The component makes use of short-circuit evaluation (`&&`) to conditionally render components based on the truthiness of the data provided in the props. This approach helps in managing the component's visibility and content dynamically based on the data it receives.