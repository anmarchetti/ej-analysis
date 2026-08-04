### Imports

The `FacilitiesEditMode` component utilizes several imports from various libraries and local modules:

- **React Hooks**: `useCallback`, `useEffect`, `useRef`, `useState` from `react` for managing state and lifecycle in the component.
- **MobX**: `observer` from `mobx-react-lite` to make the component reactive to observable changes.
- **Custom Hooks**: `useStore` from `frontend/hooks/useStore` to access MobX store methods.
- **Type Definitions**: `TStores` from `frontend/store/IStores` and several interfaces like `IFacility`, `IFacilityGroup`, `ISitecoreFacilityGroup`, `ISitecoreVirtualFacilities` from `models/data/IHotel` to type-check the data used in the component.
- **Utility Functions**: 
  - `getImageByField` from `frontend/utils/expEditor.utils`
  - `convertSitecoreItemsToFacilityGroups` from `frontend/utils/facilities.utils`
  - `normalizeGUID` from `frontend/utils/string.utils` to manipulate and format data.
- **Enums**: `SitecoreDictionary` from `models/enum/SitecoreDictionary` for consistent referencing of dictionary keys.
- **UI Components**: `Button` from `frontend/components/common/Button` and locally defined `FacilityGroup`, `FacilityItemFood`.
- **Constants**: `FACILITIES_CONTENT` from the same directory for static content like messages and labels.

### Structure

The `FacilitiesEditMode` component is structured as follows:

- **Component Definition**: Defined as a functional component that takes `IFacilitiesEditModeProps` as props.
- **State Management**: Uses `useState` to manage local state such as `facilityGroups`, `addingItem`, and `parentItemId`.
- **Ref**: Uses `useRef` to hold a reference to a DOM element.
- **Store Hook**: Uses `useStore` to bind methods from the MobX store to local constants for operations like adding, updating, deleting, and sorting items.
- **Effect Hooks**: 
  - `useEffect` for initializing facility groups and setting up event listeners.
  - Callbacks like `onAddItem`, `onCloseCallback`, `onSortItems`, `onUpdateItem`, `onDeleteItem` are memoized using `useCallback` or defined as async functions within the component for handling user interactions and data manipulation.

### Logic

The component encapsulates the logic for managing facilities in an editable mode:

- **Initialization**: On component mount, it initializes facility groups from props and sets an event listener for adding new facilities.
- **Adding Facilities**: Handled by `onAddItem`, which triggers adding a new facility and subsequently updates the internal state.
- **Item Management**: 
  - `onUpdateItem` and `onDeleteItem` allow updating and deleting facilities, respectively.
  - `onSortItems` updates the order of facilities within a group.
- **Data Handling**: 
  - `getItemFields` retrieves and formats specific fields from a facility item.
  - `updateItemState` updates the state after an item is added or updated, potentially adding it to an existing group or creating a new group.
  - `createNewGroup` constructs a new facility group if needed when a new item does not fit into existing groups.
- **UI Updates**: After certain operations like adding, updating, or deleting items, the component may trigger a page reload for fresh data presentation.
- **Rendering**: The component renders a list of facility groups and a button to add new facilities. Each group can be either a specific type like `FacilityItemFood` or a general `FacilityGroup` depending on its properties. Each group allows for item deletion, updates, and sorting.