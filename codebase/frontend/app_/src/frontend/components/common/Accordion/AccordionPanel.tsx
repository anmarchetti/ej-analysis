import React, { FC } from 'react';
import classNames from 'classnames';

import HeightAnimatedContainer from 'frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';

export interface IAccordionPanelProps {
    content: React.ReactNode;
    panelId: string;
    title: React.ReactNode;
    isOpened?: boolean;
    onTogglePanel?: () => void;
}

const AccordionPanel: FC<IAccordionPanelProps> = ({ title, content, isOpened, onTogglePanel }) => (
    <div className={classNames('accordion__panel', isOpened && 'accordion__panel--open')}>
        <h3 className='accordion__title'>
            <button onClick={(): void => onTogglePanel?.()} aria-expanded={isOpened}>
                {title}
                <SvgChevronDown className='accordion__icon' />
            </button>
        </h3>
        <HeightAnimatedContainer isOpened={isOpened} keepMounted>
            <div className='accordion__content'>{content}</div>
        </HeightAnimatedContainer>
    </div>
);

export default AccordionPanel;
