import React from 'react';
import classNames from 'classnames';

import { IFlattenedSpecialRequest } from 'models/data/SpecialRequest';
import SVGCross from 'frontend/components/icons-new/Cross';

import specialRequestsItemStyles from './specialRequestsItem.module.scss';

export interface ISpecialRequestItemProps {
    item: IFlattenedSpecialRequest;
    dataTid?: string;
    isClosable?: boolean;
    isSolid?: boolean;
    onSelect?: (code: string) => void;
    onlyShowSelectedOnMobile?: boolean;
}

function SpecialRequestItem(props: ISpecialRequestItemProps) {
    const { item, onlyShowSelectedOnMobile = false, isSolid, isClosable, dataTid } = props;

    const onSelect = () => {
        props.onSelect?.(item.code);
    };

    return (
        <button
            type='button'
            key={item.code}
            onClick={onSelect}
            className={classNames({
                [specialRequestsItemStyles.solid]: isSolid,
                [specialRequestsItemStyles.item]: true,
                [specialRequestsItemStyles.selected]: item.isSelected,
                ['d-none d-md-inline-flex']: !item.isSelected && onlyShowSelectedOnMobile,
            })}
            data-tid={dataTid ?? item.code}
            data-code={item.code}
        >
            {item.name}
            {isClosable && <SVGCross />}
        </button>
    );
}

export default SpecialRequestItem;
