import React from 'react';
import { components } from 'react-select';

const MenuList = props => (
    <>
        {props.selectProps.hasOverlay && (
            <div className='year-dropdown__overlay' onClick={props.selectProps.onOverlayClick} />
        )}

        <components.MenuList {...props} />
    </>
);

export default MenuList;
