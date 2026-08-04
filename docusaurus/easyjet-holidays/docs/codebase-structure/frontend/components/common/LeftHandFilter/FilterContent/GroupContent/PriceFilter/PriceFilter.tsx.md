## Imports

The `PriceFilter` component imports several modules and functionalities which are categorized as follows:

- **React and MobX libraries**: Essential imports for creating a React component and managing state with MobX. These include `React`, `Component`, `ReactNode` from `react`, and several decorators and functions from `mobx` such as `action`, `computed`, `makeObservable`, `observable`, `runInAction`, and `toJS`.
- **MobX React Integrations**: `inject` and `observer` from `mobx-react` are used for integrating MobX with React components.
- **Utility and Store Modules**: Imports from project-specific modules such as `CurrencyCode`, `TrailingZeroDisplay` from `code/currency`, and `MarketStore` from `frontend/store/base`. Utility functions like `sortPrice` are imported from `frontend/utils/sort.utils`.
- **Component and Model Definitions**: `Checkbox` component from `frontend/components/common/Checkbox` and `SitecoreDictionary`, `IComponentWithDictionary` from model definitions.
- **Local Component and Styles**: `CompoundSlider` component and `PriceFilter.module.scss` for scoped CSS modules.
- **MobX Store Specific for Component**: `priceFilterStore` from a nested path within `frontend/components`.

## Structure

The `PriceFilter` component is defined as a class component extending `React.Component` with properties typed by `IPriceFilterProps`. The structure includes:

- **Component Properties**: Defined by the `IPriceFilterProps` interface which extends `IComponentWithDictionary`. It includes various props related to currency, price formatting, and UI control such as toggles and inputs.
- **Component State**: Managed using MobX `observable` for states like `isPricePerPerson`, `values`, and `sliderValues`.
- **Lifecycle Methods**: `componentDidMount` and `componentDidUpdate` for managing updates based on props and internal state changes.
- **Private Methods and Refs**: Methods like `updateBaseValues`, `updateSliderValues`, `updateInputsValues`, `updateStoreValue`, and React refs for input elements to manage focus and input values.
- **Event Handlers**: Methods like `onType`, `onBlur`, `onSlide`, `onSliding`, and `onSwitch` handle user interactions.
- **Computed Properties**: MobX `computed` properties for calculating derived values like `minPrice`, `maxPrice`, `roundedMinPrice`, `roundedMaxPrice`, and `normalizedSliderValues`.

## Logic

The component encapsulates the logic for a price filter used in a booking or travel application:

- **Price Calculation**: Depending on whether the price is per person (`isPricePerPerson`), the component calculates and displays different price ranges.
- **Interactive Sliders**: Uses a `CompoundSlider` component for selecting price ranges. The slider values are managed based on user input and automatically adjusted if they fall outside the valid range.
- **Form Inputs**: Two input fields allow manual entry of price values. These are synchronized with the slider values.
- **MobX Actions**: Updates to observables are wrapped in `action` to ensure state changes are batched and the component reacts appropriately.
- **Conditional Rendering**: Elements like the price per person toggle are conditionally rendered based on the number of guests.
- **Integration with Store**: Uses `priceFilterStore` for some operations and updates the parent component or external store through callbacks like `onChange` and `setPriceFiltersValue`.

This component is designed to be reusable and adaptable based on the provided props, making it suitable for different parts of an application where price filtering is required. The use of MobX for state management ensures that updates are efficient and the UI remains responsive.