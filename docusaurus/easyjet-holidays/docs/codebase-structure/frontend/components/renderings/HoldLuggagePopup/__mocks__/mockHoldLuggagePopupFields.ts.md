### Imports

The JavaScript module imports several utilities and models to facilitate mocking and representation of luggage-related data for a frontend application. Here's a breakdown of the imports:

- **Utilities for Testing**
  - `mockSitecoreField` and `mockSitecoreImageField` from `'frontend/utils/tests.utils'` are used to create mock Sitecore fields, simulating the behavior of Sitecore-managed fields in a testing environment.

- **Data Models**
  - `IHoldLuggageItemFields` and `IHoldLuggageLists` from `'models/data/IHoldLuggage'` define TypeScript interfaces for structured data regarding hold luggage items and lists of such items.
  - `ISitecoreChildren` from `'models/data/ISitecoreChildren'` likely represents a generic interface for items managed within Sitecore that includes a structure for holding child items.

- **Component Specific Mocks and Models**
  - `SportEquipmentRestrictedSeasons` from `'frontend/components/renderings/HoldLuggage/__mocks__/mockHoldLuggageFields'` provides mock data related to restricted seasons for sporting equipment.
  - `IHoldLuggagePopupFields` from `'frontend/components/renderings/HoldLuggagePopup/HoldLuggagePopup'` defines the TypeScript interface for the fields used in the Hold Luggage Popup component.

### Structure

The code defines two primary data structures and exports them:

- **`mockHoldLugggageLists`**: An object of type `IHoldLuggageLists` that contains arrays of `HoldLuggageItems` and `SportsEquipmentItems`. Each item in these arrays is an object adhering to the `ISitecoreChildren<IHoldLuggageItemFields>` interface, which includes an `id` and `fields`. The `fields` are generated using the `getMockedLuggageItem` function.

- **`mockHoldLuggagePopupFields`**: An object of type `IHoldLuggagePopupFields` providing mocked values for various properties related to the UI of a luggage popup, such as headers, descriptions, buttons, and labels.

### Logic

The core function defined in the module is `getMockedLuggageItem`, which constructs an object representing a luggage item's fields:

- **Function Parameters**: It accepts details about the luggage item including `description`, `name`, `icon`, `code`, and `isEnabled`.
- **Return Value**: Returns an object that mimics the structure expected by Sitecore for a luggage item, with each property being a mocked Sitecore field.

The `getMockedLuggageItem` function is utilized in the `mockHoldLugggageLists` to create predefined sets of luggage items, both for hold luggage and sports equipment. This mock setup is crucial for testing components that interact with these data structures, ensuring that the components can render correctly and handle the data as expected in a controlled test environment.

The `mockHoldLuggagePopupFields` object directly provides mocked values for various UI components in the luggage popup, facilitating the testing of this popup's rendering and behavior without needing to interact with a live backend or Sitecore instance. These fields simulate the content that might be retrieved from a CMS in a production environment.