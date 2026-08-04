import React, { FC } from 'react';

import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconChevronUp from 'frontend/components/icons/ChevronUp';

import Button from './Button';

export interface IReadMoreButtonProps {
    readLessText: string;
    readMoreText: string;
    className?: string;
    dataTid?: string;
    isReadLess?: boolean;
    onClick?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const ReadMoreButton: FC<IReadMoreButtonProps> = ({
    isReadLess,
    dataTid,
    readLessText,
    readMoreText,
    onClick,
    className,
}) => (
    <Button onClick={onClick} isText dataTid={dataTid} aria-expanded={isReadLess} className={className}>
        {isReadLess ? readLessText : readMoreText}
        {isReadLess ? <IconChevronUp /> : <IconChevronDown />}
    </Button>
);

export default ReadMoreButton;
