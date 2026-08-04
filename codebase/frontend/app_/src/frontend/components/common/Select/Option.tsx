import React, { useEffect, useRef } from 'react';
import { components } from 'react-select';

const Option = props => {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        ref.current && props.isSelected && ref.current.scrollIntoView();
    }, [props.isSelected]);

    return <components.Option {...props} innerRef={ref} />;
};

export default Option;
