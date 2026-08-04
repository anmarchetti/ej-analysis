## Imports

The `Passenger` component utilizes a variety of imports to facilitate its functionality:

- **React and FC**: Imports React and its Function Component type (FC) to define the component.
- **classNames**: A utility function for conditionally joining class names together.
- **useStore**: A custom React hook from `frontend/hooks` used for accessing the Redux store.
- **TStores, IGuestPassenger, ILeadPassenger**: TypeScript interfaces imported from respective modules to type-check the data structures used within the component.
- **getFullPassengerName, getLeadPassengerAddress**: Utility functions from `frontend/utils` to manipulate and retrieve formatted passenger data.
- **SitecoreDictionary**: Enum from `models/enum` that provides keys for localized phrases.
- **SvgUserFilled, SvgUserLined**: React components representing SVG icons.
- **styles**: Module CSS for styling the component, scoped locally to avoid conflicts.

## Structure

The `Passenger` component is structured as follows:

- **IPassengerProps**: An interface defining the props that the component expects.
- **Passenger Component**: A functional component that uses destructuring to extract props and employs several hooks and conditions to determine what to render.
- **Internal Functions**:
  - `renderPassengerInfoItem(dictionary: string, value: string)`: Renders individual pieces of passenger information.
- **Conditionals**:
  - `showLeadDetails`: Determines whether to display detailed information about the lead passenger based on several conditions related to the application state and user permissions.
- **Rendering**:
  - The component conditionally renders various elements such as icons, names, and additional passenger details based on the props and derived states.

## Logic

The logic within the `Passenger` component can be broken down into several key areas:

- **Store Access**: Uses the `useStore` hook to access specific methods and states from the Redux store, such as phrases for localization and page-specific flags.
- **Conditional Rendering**:
  - **showLeadDetails**: Combines multiple conditions to decide if the lead passenger's detailed information should be displayed. This is dependent on the type of user (e.g., trade portal user), whether the lead is logged in, and the type of page being viewed.
  - **Label Assignment**: Depending on whether flight details are to be shown or if lead details are available, labels for the UI are dynamically assigned using localized phrases.
- **Dynamic Class Application**: Uses the `classNames` library to apply CSS classes conditionally, enhancing the component's responsiveness to different states (e.g., showing flight reference).
- **Utility Functions Usage**: Employs utility functions to format and retrieve passenger-specific information, such as full names and addresses, which are essential for personalizing the UI.
- **Icon Selection**: Dynamically selects between filled or lined user icons based on the presence of a lead passenger, adding a visual distinction based on the data.

This component is a typical example of a React functional component that leverages Redux for state management, utility functions for data handling, and conditional logic for dynamic rendering based on the application's state and properties passed to it.