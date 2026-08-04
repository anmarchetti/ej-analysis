import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

export interface ISearchBarFieldErrorMessage {
    fieldErrorType: SearchBarDropdown;
    errorClassName?: string;
}

const SearchBarFieldErrorMessage: FC<ISearchBarFieldErrorMessage> = ({ errorClassName, fieldErrorType }) => {
    const { hasErrorInField, errorMessages } = useStore((stores: TStores) => ({
        hasErrorInField: stores.searchStore.hasErrorInField,
        errorMessages: stores.searchStore.errorMessages,
    }));

    return hasErrorInField(fieldErrorType) ? (
        <ErrorMessage
            key={`error_${errorMessages?.key}`}
            message={<RichTextDictionary dictionaryKey={errorMessages?.message} />}
            errorMessageClass={errorClassName}
            icon={<SvgWarningFilled />}
            IsDesc
        />
    ) : null;
};

export default observer(SearchBarFieldErrorMessage);
