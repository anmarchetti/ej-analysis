import { useCallback, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IDebouncedRequest } from 'frontend/utils/debouncedRequest.utils';
import { ISelectOption } from 'models/data/ISelectOption';
import { IValidationError } from 'models/data/validation/IValidationError';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ClearIndicator from 'frontend/components/common/Select/ClearIndicator/ClearIndicator';
import ValidatableSelectField from 'frontend/components/common/ValidatableSelectField';

import styles from './ValidatableFieldNew.module.scss';

export enum ValidatableFieldSearchLoading {
    None = 'not_loading',
    Item = 'item_loading',
    List = 'list_loading',
}

interface IValidatableFieldSearchProps {
    errors: IValidationError[];
    id: string;
    label: string;
    onChange: IDebouncedRequest<[option: { id: string }, params: unknown], { id: string }>;
    onInputChange: IDebouncedRequest<[query: string, params: unknown], { id: string }[]>;
    placeholder: string;
    forceError?: boolean;
    loadingMessage?: () => string;
    params?: unknown;
}

export const NoOptionsMessage: React.FC<{
    options: ISelectOption[];
    selectProps: {
        inputValue: string;
    };
}> = ({ selectProps, options }) => {
    const { getPhrase } = useStore(stores => ({ getPhrase: stores.layoutStore.getPhrase }));

    const input = selectProps.inputValue.trim();

    if (input && options.length === 0)
        return (
            <div className={classNames(styles.noOptionBlock, styles.empty)}>
                {getPhrase(SitecoreDictionary.AddressLookupLabelsNoResultsFound)}
            </div>
        );

    return (
        <div className={classNames(styles.noOptionBlock, styles.default)}>
            {getPhrase(SitecoreDictionary.AddressLookupLabelsNoOptions)}
        </div>
    );
};

export const COMPONENTS = {
    NoOptionsMessage,
    ClearIndicator: (props): JSX.Element => (
        <ClearIndicator
            className={styles.clear}
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>): void => {
                const { selectProps } = props;
                const { inputValue, onInputChange } = selectProps;

                e.preventDefault();
                e.stopPropagation();

                if (inputValue) {
                    onInputChange('', { action: 'clear' });
                }
            }}
            {...props}
        />
    ),
    DropdownIndicator: null,
};

const ValidatableFieldSearch: React.FC<IValidatableFieldSearchProps> = ({
    id,
    label,
    placeholder,
    errors,
    forceError,
    onChange,
    onInputChange,
    params,
    loadingMessage,
}) => {
    const [originalState, setOriginalState] = useState({
        query: '',
        list: [],
        loading: ValidatableFieldSearchLoading.None,
    });

    const setState = useCallback(state => setOriginalState(prev => ({ ...prev, ...state })), []);

    const { query, list, loading } = originalState;

    return (
        <ValidatableSelectField
            id={id}
            label={query ? label : placeholder}
            options={list}
            errors={errors}
            onChange={(_, option): void => {
                if (!option?.id) return;

                setState({ loading: ValidatableFieldSearchLoading.Item });

                onChange(option, params)
                    .then(() => setState({ loading: ValidatableFieldSearchLoading.None }))
                    .catch(e => {
                        if (e.message === 'Superseded by newer call') return;

                        setState({ loading: ValidatableFieldSearchLoading.None });
                    });
            }}
            onInputChange={(q: string, { action }: { action: string }): void => {
                if (action === 'input-change' || action === 'clear' || action === 'set-value') {
                    if (!q.trim()) {
                        setState({ query: q, list: [], loading: ValidatableFieldSearchLoading.None });

                        return;
                    }

                    setState({ loading: ValidatableFieldSearchLoading.List, query: q });

                    onInputChange(q, params)
                        .then(list => setState({ list, loading: ValidatableFieldSearchLoading.None }))
                        .catch(e => {
                            if (e.message === 'Superseded by newer call') return;

                            setState({ loading: ValidatableFieldSearchLoading.None });
                        });
                }
            }}
            inputValue={query}
            isSearchable
            isClearable
            isLoading={loading !== ValidatableFieldSearchLoading.None}
            disabled={loading === ValidatableFieldSearchLoading.Item}
            forceError={forceError}
            filterOption={null}
            Components={COMPONENTS}
            loadingMessage={loadingMessage}
            disableValidationTraking
            portal
        />
    );
};

export default ValidatableFieldSearch;
