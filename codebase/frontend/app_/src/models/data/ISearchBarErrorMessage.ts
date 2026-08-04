import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';

export interface ISearchBarErrorMessage {
    key: SearchBarDropdown;
    message: string;
    description?: string;
}
