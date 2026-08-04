## Imports

The code imports various JavaScript modules primarily from three categories: model data structures, component files, and interfaces.

- **Models**:
  - `PaymentStep` from `models/data/AmendInfo`
  - `AmendmentType` from `models/data/IBookingInfo`
  - `ISitecoreField` from `models/sitecore/generic/ISitecoreField`

- **Component Imports**:
  - Components related to different booking amendment details such as `AmendDatesDetails`, `AmendFlightsDetails`, `AmendHotelDetails`, `AmendPaymentRoomAndBoardDetails`, and `AmendTransferDetails` are imported from their respective paths within `frontend/components/renderings/AmendPayment/components/`.

- **Interfaces**:
  - `IPaymentPageFields` from `frontend/components/renderings/AmendPayment/interfaces`
  - `ILuggageInfoFields` and `ICabinBagsInfoFields` from specific booking components under `frontend/components/common/Booking/`.

## Structure

The code defines a TypeScript type `TPaymentStepState` and two functions `getConfirmationTitle` and `generateInitialStateFromSteps`, and an object `changeSummaryComponentConfig`.

- **Type Definition**:
  - `TPaymentStepState`: A record type mapping `PaymentStep` to an object that contains properties `index`, `isChecked`, `isDisabled`, and `isOpened`.

- **Functions**:
  - `getConfirmationTitle`: Accepts `fields` (of type `IPaymentPageFields`), `numberOfSteps` (number), and `isRefund` (boolean). Returns a `ISitecoreField<string>` based on the conditions provided.
  - `generateInitialStateFromSteps`: Takes an array of `PaymentStep` and returns a `TPaymentStepState` object representing the initial state configuration for each step.

- **Object**:
  - `changeSummaryComponentConfig`: An object mapping `AmendmentType` to specific React functional components dealing with different aspects of booking amendments.

## Logic

The logic within the functions handles dynamic configurations and state initializations based on the provided inputs:

- **`getConfirmationTitle`**:
  - This function determines which title to use based on the number of steps and whether it's a refund scenario. It uses a magic number (2) to decide between step two and step three titles.

- **`generateInitialStateFromSteps`**:
  - Using the `reduce` method, this function constructs the initial state for each payment step. It specifically checks if the current step is the `Entity` step to set `isOpened` to true and `isDisabled` to false, otherwise defaulting to false and true respectively.

- **`getChangeSummaryComponent`**:
  - This function returns a React functional component based on the amendment type provided. It uses the `changeSummaryComponentConfig` object for mapping types to components. If no valid amendment type is provided, it returns null.

The code overall provides a structured approach to handle dynamic configurations for a payment or booking amendment process in a frontend application, leveraging TypeScript for type safety and clarity.