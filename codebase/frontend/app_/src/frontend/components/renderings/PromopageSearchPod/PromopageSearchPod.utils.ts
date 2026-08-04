import { ISearchBarErrorMessage } from 'models/data/ISearchBarErrorMessage';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';

export const getWhenError = (
    errorMessage: Nullable<ISearchBarErrorMessage>,
    activeField: Nullable<SearchBarDropdown>,
) =>
    errorMessage?.key === SearchBarDropdown.When && activeField === SearchBarDropdown.When
        ? errorMessage.message
        : undefined;
