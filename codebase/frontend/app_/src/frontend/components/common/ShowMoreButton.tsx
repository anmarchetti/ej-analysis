import * as React from 'react';

import Button, { IButtonProps } from 'frontend/components/common/Button';
import SVGChevronDown from 'frontend/components/icons-new/ChevronDown';

export interface IShowMoreButtonProps extends IButtonProps {
    onClick: () => void;
    className?: string;
    dataTid?: string;
    icon?: JSX.Element;
    id?: string;
    isChevronUp?: boolean;
    title?: string;
}

export const ShowMoreButton: React.FC<IShowMoreButtonProps> = ({
    onClick,
    className,
    dataTid,
    icon,
    id,
    isChevronUp,
    title,
    ...props
}) => (
    <div className='show-more'>
        <Button className={className} onClick={onClick} isText id={id} dataTid={dataTid} {...props}>
            {title}
            {icon || <SVGChevronDown className={isChevronUp ? 'icon--reflect-y' : ''} />}
        </Button>
    </div>
);

export default ShowMoreButton;
