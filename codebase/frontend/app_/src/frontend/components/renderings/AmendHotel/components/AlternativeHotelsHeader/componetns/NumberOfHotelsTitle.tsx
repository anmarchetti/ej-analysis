import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

interface INumberOfHotelsTitle {
    className: string;
    isLoading: boolean;
    shimmerClassName: string;
    title: string;
}

const NumberOfHotelsTitle: FC<INumberOfHotelsTitle> = ({ className, title, isLoading, shimmerClassName }) => {
    if (isLoading) {
        return (
            <div
                className={classNames(shimmerClassName, 'placeholder-shimmer')}
                data-tid='skeleton-number-of-hotels-title'
            />
        );
    }

    return <Text field={{ value: title }} tag='h3' data-tid='alternative-hotels-subtitle' className={className} />;
};

export default NumberOfHotelsTitle;
