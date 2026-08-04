### Imports

The `FacilityGroup` component uses several imports to handle its functionality:

- **React Imports**: 
  - `React`: Base React package for building components.
  - `useCallback`, `useEffect`, `useRef`, `useState`: Hooks for managing state, side effects, references, and memoizing functions.
  
- **Third-Party Libraries**:
  - `arrayMove`, `SortableContainer`, `SortableElement`: Functions and components from `react-sortable-hoc` to enable sortable list functionalities.
  - `classNames`: A utility to conditionally join classNames together.
  - `useLocalObservable`: Hook from `mobx-react` for local state management with MobX.
  
- **Project Specific Imports**:
  - `cmsUrls`: A module to handle URL configurations.
  - `IFacility`: TypeScript interface from `models/data/IHotel` defining the structure for facility objects.
  - `Button`: A reusable button component from `frontend/components/common`.
  - `FACILITIES_CONTENT`: Constant values for text content related to facilities.
  - `FacilityItem`: A component to render individual facility items.

### Structure

The `FacilityGroup` component is structured into several key parts:

1. **TypeScript Interfaces**:
   - `IFacilityGroupProps`: Props for the `FacilityGroup` component including facilities array, optional icon URL, and handlers for delete, sort, and update actions.
   - `ISortableFacilityProps`: Props for individual sortable facility items.
   - `ISortableFacilitiesProps`: Props for the container that holds sortable facility items.

2. **Component Definition**:
   - Uses functional component style with hooks for managing state and effects.
   - Internal state includes:
     - `facilities`: The current list of facilities.
     - `isReordering`: Boolean to toggle reorder mode.
     - `tempFacilities`: Temporary storage of facilities during reordering.
   - References and observable state for managing event listeners and temporary state during reordering.
   - Sortable components (`SortableFacility` and `SortableFacilities`) for handling the drag-and-drop sorting feature.

3. **Return JSX**:
   - Conditional rendering based on `isReordering` to switch between sortable and normal view.
   - Buttons to initiate reordering, save new order, and cancel reordering.
   - Dynamic loading of title and icon if provided.

### Logic

The component encapsulates several logical functionalities:

- **Sorting**:
  - Facilities are initially sorted based on the `sortOrder` property using the `sortBySortOrder` callback.
  
- **Initialization**:
  - `initFacilities` function sets up the initial state of the facilities and adds event listeners for reordering actions if they haven't been added yet.
  
- **Reordering**:
  - Event handlers (`onReorderClick`, `onSortEnd`, `onReorderSave`, `onReorderCancel`) manage the transition into reorder mode, handle the sorting of elements, and save or revert changes.
  
- **Cleanup**:
  - `useEffect` with a cleanup function to remove event listeners when the component unmounts to prevent memory leaks.

- **Event Handling**:
  - Uses both React state and MobX observables to manage the state of the facilities list during interactions.
  
- **Rendering**:
  - Depending on the state, the component renders either a sortable list or a static list of facilities. Buttons are shown or hidden based on whether the component is in reorder mode.