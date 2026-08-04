import React from 'react';
import { components } from 'react-select';

const ValueContainer = ({ children, ...props }) => (
    <components.ValueContainer {...props} hasValue={props.hasValue || !!props.selectProps.inputValue}>
        <components.Placeholder {...props} isFocused={props.isFocused}>
            {props.selectProps.placeholder}
        </components.Placeholder>
        {React.Children.map(children, child => {
            if (!props.selectProps.isSearchable && child?.props.id === `react-select-${props.selectProps.id}-input`) {
                return React.cloneElement(child, {
                    role: 'textbox',
                    'aria-describedby': `selected-options-screen-reader-${props.selectProps.id}`,
                });
            }

            if (child && child.type !== components.Placeholder) {
                return child;
            }

            return null;
        })}
    </components.ValueContainer>
);

export default ValueContainer;
