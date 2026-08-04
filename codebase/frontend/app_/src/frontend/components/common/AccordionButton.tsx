import { FC } from 'react';
import classNames from 'classnames';

import SVGChevronDown from 'frontend/components/icons-new/ChevronDown';

interface IAccordionButtonProps {
    isExpanded: boolean;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    ariaLabel?: string;
    buttonContent?: React.ReactNode;
    className?: string;
    dataTid?: string;
    panelId?: string;
}

const AccordionButton: FC<IAccordionButtonProps> = ({
    isExpanded,
    onClick,
    className,
    panelId,
    buttonContent,
    dataTid,
    ariaLabel,
}) => (
    <button
        className={classNames('btn btn--txt', className)}
        data-tid={dataTid}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-label={ariaLabel}
        onClick={onClick}
    >
        {!!buttonContent && <span>{buttonContent}</span>}
        <SVGChevronDown className={isExpanded ? 'icon--reflect-y' : ''} />
    </button>
);

export default AccordionButton;
