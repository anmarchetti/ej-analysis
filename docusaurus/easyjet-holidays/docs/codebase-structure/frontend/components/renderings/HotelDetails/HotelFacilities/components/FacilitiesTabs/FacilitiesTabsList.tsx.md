## Imports

The `FacilitiesTabsList` component uses several imports from various libraries and local files:

- **React Imports:**
  - `React`: Base React library.
  - `FC` (Function Component): A TypeScript type used to define functional components.
  - `useRef`: React hook for accessing DOM elements.

- **Third-Party Libraries:**
  - `classNames`: A utility function to conditionally join class names together.

- **Local Imports:**
  - `cmsUrls`: Contains endpoint URLs, used here to fetch media URLs.
  - `switchTabOnArrowPress`: Utility function from `frontend/utils/a11y.utils` to enhance accessibility by enabling arrow key navigation.
  - `IFacilityGroup`: TypeScript interface from `models/data/IHotel` defining the structure of facility groups.
  - `SvgChevronRight`: A React component rendering a right-chevron SVG icon.
  - `styles`: Module-specific styles imported from `./FacilitiesTabsList.module.scss`.

## Structure

The `FacilitiesTabsList` component is structured as follows:

- **Props:**
  - `activeTabIndex`: Index of the currently active tab.
  - `facilityGroups`: Array of facility group objects.
  - `setActiveTabIndex`: Function to update the active tab index.

- **Ref:**
  - `tabListRef`: A ref attached to the `<ul>` element to facilitate focus management in response to keyboard events.

- **JSX Structure:**
  - An unordered list (`<ul>`) represents the tab list with a vertical orientation.
  - Each facility group is represented by a list item (`<li>`) containing a button that acts as a tab.
  - The button may contain an icon, the group's name, and a right-chevron SVG icon.

## Logic

The component incorporates several logical features to enhance UX and accessibility:

- **Tab Activation:**
  - `onTabClick`: Handles click events on tabs, preventing the default action and setting the active tab index.

- **Keyboard Navigation:**
  - `handleTabsKeyDown`: Handles key down events to enable navigation between tabs using the arrow keys. It uses the `switchTabOnArrowPress` utility to determine the new index based on the key pressed and the current index.
  - If a new index is valid, it updates the focus to the new tab and sets it as active.

- **Dynamic Class Assignment:**
  - Uses `classNames` to conditionally apply the `active` class to the tab corresponding to the active tab index.

- **Dynamic Styles:**
  - Tabs optionally include an icon, styled dynamically with a background image URL fetched using the `cmsUrls.media` function.

- **Accessibility Features:**
  - Proper ARIA attributes are used:
    - `aria-selected` indicates whether the tab is selected.
    - `aria-controls` links the tab to its corresponding content panel.
    - `tabIndex` ensures that only the active tab is focusable via sequential keyboard navigation (`tabIndex="0"`), while others are not (`tabIndex="-1"`).
  - The list element has `role='tablist'` and `aria-orientation='vertical'`, enhancing screen reader support.