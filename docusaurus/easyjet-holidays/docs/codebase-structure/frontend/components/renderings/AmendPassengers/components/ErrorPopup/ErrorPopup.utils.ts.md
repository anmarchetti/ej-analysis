## Imports

The code imports several modules and types from different locations:

- **Tokens**: Imported from `'code/tokens'`. This module likely contains constants or configurations related to token handling within the application.
- **Tokenizer**: Imported from `'frontend/utils/tokenizer'`. This utility is probably used for processing or replacing tokens within strings.
- **ApiErrors**: Imported from `'models/enum/ApiErrors'`. This enumeration holds constants that represent different API error types.
- **IErrorPopupProps** and **TPassengerErrorTypes**: Imported from `'./ErrorPopup'`. These are TypeScript types related to the error popup component, where `IErrorPopupProps` is an interface for the props of the error popup, and `TPassengerErrorTypes` is a type alias for categorizing error types.

## Structure

### Interfaces and Types

- **IDescriptionHandlerOptions**: An interface defining the structure for options that can be passed to the `getErrorPopupMeta` function, with a single property `charactersChangeCount` of type `string`.

- **TErrorFieldsConfigType**: A type alias defining a mapping from `TPassengerErrorTypes` to an object that includes `title`, `description`, and an optional `icon`, all of which are strings.

### Constant Configuration

- **ErrorFieldsConfig**: A constant of type `TErrorFieldsConfigType` that provides a configuration object mapping error types to their respective UI display metadata such as titles, descriptions, and icons.

## Logic

### Function: `getErrorPopupMeta`

#### Parameters

- `errorType`: A parameter of type `TPassengerErrorTypes` indicating the type of error.
- `fields`: A parameter of type `IErrorPopupProps['fields']` representing additional data fields that might be used in the popup.
- An options object of type `IDescriptionHandlerOptions` which currently includes only `charactersChangeCount`.

#### Process

1. **Configuration Retrieval**: The function first retrieves the configuration for the given `errorType` from `ErrorFieldsConfig`.

2. **Icon Handling**: It checks if an icon is defined in the configuration and if so, retrieves the corresponding field from the `fields` parameter.

3. **Title and Description Handling**: It retrieves the title and description based on the configuration. The description can include dynamic content which is handled in the next step.

4. **Token Replacement in Description**: Uses the `Tokenizer` to replace tokens in the description text. Tokens can be dynamic values such as phone numbers (formatted as clickable links) and the character change count passed in the options.

5. **Output**: The function returns an object containing the `title`, `icon`, and `description` (with tokens replaced and trimmed).

This function essentially formats error metadata for display in a UI component, based on the type of error and additional contextual data provided via parameters.