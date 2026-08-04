import * as React from 'react';
import classNames from 'classnames';

import SVGChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import SVGChevronRight from 'frontend/components/icons-new/ChevronRight';

interface ISliderNavButtonProps {
    className?: string;
    isLeftNav?: boolean;
    onBlur?: () => void;
    onClick?: () => void;
    onFocus?: () => void;
}

function SliderNavButton(props: ISliderNavButtonProps) {
    const options = props.isLeftNav
        ? {
              className: 'slider-nav--prev',
              icon: <SVGChevronLeft />,
              label: 'Previous',
          }
        : {
              className: 'slider-nav--next',
              icon: <SVGChevronRight />,
              label: 'Next',
          };

    return (
        <button
            type='button'
            onClick={props.onClick}
            onFocus={(): void => props.onFocus?.()}
            onBlur={(): void => props.onBlur?.()}
            className={classNames('slider-nav', options.className, props.className)}
            aria-label={options.label}
        >
            {options.icon}
        </button>
    );
}

export default SliderNavButton;
