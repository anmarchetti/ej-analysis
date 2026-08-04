import React from 'react';
import { components } from 'react-select';

import Checkbox from 'frontend/components/common/Checkbox';

const InputOption = ({ isSelected, children, innerProps, ...rest }) => {
    const props = {
        ...innerProps,
    };

    return (
        <components.Option {...rest} innerProps={props}>
            <Checkbox
                label={children ?? ''}
                medium
                textRight
                tick
                checked={isSelected}
                onChange={() => null}
                isMultipleSelect
                dataTid='checkbox-multi-option'
            />
        </components.Option>
    );
};
export default InputOption;
