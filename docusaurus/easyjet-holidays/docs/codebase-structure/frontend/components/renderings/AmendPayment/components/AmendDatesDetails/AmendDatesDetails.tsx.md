## Imports

The component imports several modules and types from various parts of the application and external libraries:

- `FunctionComponent` from `react`: Used for typing the component as a React functional component.
- `observer` from `mobx-react`: Enhances the component to reactively update in response to MobX state changes.
- `useStore` custom hook from `frontend/hooks/useStore`: Used to access MobX stores.
- `IHolidaysStores` type from `frontend/store/holidays`: Describes the structure of the stores related to holidays.
- `ICabinBagsInfoFields` and `ILuggageInfoFields` types from respective components under `frontend/components/common/Booking`: Define the shapes of props expected for luggage and cabin bags information.
- `HolidaySummary` component from `frontend/components/common/HolidaySummary`: A component used to render the summary details of a holiday.

## Structure

The `AmendDatesDetails` component is defined as a function component using TypeScript. It accepts `IAmendDatesDetailsProps` as props, which is a combination of `ILuggageInfoFields` and `ICabinBagsInfoFields`. This structure allows the component to receive a single `fields` prop containing both luggage and cabin bag information, which is passed down to the `HolidaySummary` component.

### Interface Definition

- `IAmendDatesDetailsProps`: This interface combines luggage and cabin bag field information into a single type, which simplifies the passing of props related to luggage details.

## Logic

The component utilizes the `useStore` hook to extract specific pieces of state from the MobX store:

- `booking`, `offer`, and `offerWithPrices` are destructured from the `amendDatesStore`.

### Conditional Rendering

- The component checks if both `booking` and `offer` are available. If either is missing, it returns `null`, effectively rendering nothing.

### Component Return

- If the necessary data is available, the component renders the `HolidaySummary` component, passing various pieces of data extracted from the `offer` and `offerWithPrices` objects along with the `fields` prop:
  - `dataTidPrefix`: A string prefix used for test identifiers.
  - `booking`: Booking details.
  - `flights`, `transfer`, and `accom`: Extracted from the `offer`.
  - `luggageInfo`: Extracted from `offerWithPrices` if available.
  - `selectedSeats`: Seat selection information from `offer`.
  - `luggageInfoFields` and `cabinBagsInfoFields`: Both set to the `fields` prop received by the component.

### MobX Integration

- The component is wrapped with `observer` from `mobx-react`, making it reactive to changes in the MobX state used within. This ensures that the component updates when the relevant parts of the store change.