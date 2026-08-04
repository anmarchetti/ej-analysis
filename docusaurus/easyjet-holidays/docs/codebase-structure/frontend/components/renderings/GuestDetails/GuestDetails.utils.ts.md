### Imports

The code imports several modules and hooks necessary for its operation:

- `useEffect` from `react` is used for performing side effects in function components.
- `useStore` custom hook from `frontend/hooks/useStore` is utilized to access and manipulate global state management.
- `isHolidayStore` function from `frontend/store/holidays` is used to determine if the current store is related to holidays.
- `TStores` type from `frontend/store/IStores` defines the structure for the stores used in the application.
- `GuestDetailsPhase` enum from `models/enum/GuestDetailsPhase` provides constants that represent different phases in the guest details process.
- `ISitecoreField` interface from `models/sitecore/generic/ISitecoreField` describes the structure of a generic Sitecore field.
- `IOffersAndUpdatesFields` interface from the local `components/SpecialOffersBlock` is extended by the `IGuestPageFields` interface to include special offers and updates related fields.

### Structure

The code defines two main interfaces and one main functional hook:

- `IGuestPageFields` interface extends `IOffersAndUpdatesFields` and includes additional fields specific to the guest page such as blacklisted domains, emails, checkbox labels, etc.
- `IUseGuestDetailsProps` interface is used to type the props expected by the `useGuestDetails` hook, which includes an optional `fields` property of type `IGuestPageFields`.
- `IUseGuestDetailsData` interface defines the structure of the data object returned by the `useGuestDetails` hook, encapsulating various states like whether the sign-in prompt is shown, if the page title is visible, etc.
- `useGuestDetails` is a custom React hook that encapsulates the logic for managing guest details based on the provided fields and global state from stores.

### Logic

The `useGuestDetails` hook performs the following operations:

1. **State and Store Initialization**:
   - Extracts necessary state and functions from the global store using the `useStore` hook. This includes page titles, flags for trade portal, initialization and save functions from the guest details store, and summary bar visibility states.
   - Determines if the component is related to holidays by checking if the store is a holiday store, and if so, it extracts additional properties related to guest details phases.

2. **Effect Hook**:
   - On component mount, initializes guest details and sets up a cleanup function that saves guest details to session storage and clears the guest details phase upon component unmount.

3. **Conditional Rendering and State Management**:
   - Determines various states such as whether holidays are loading based on the trade portal status and guest details phase.
   - Checks if email verification or guest info should be shown based on the current phase of guest details.
   - Manages visibility of the page title based on a specific field value.

4. **Return Value**:
   - Constructs and returns an object containing the current state of various UI components and flags, which can be used by the component consuming this hook to render appropriate UI elements based on the current state of guest details.

This hook effectively encapsulates and manages the state and behavior related to guest details, making it reusable and modular.