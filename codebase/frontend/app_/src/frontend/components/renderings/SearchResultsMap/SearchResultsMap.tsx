import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import MapPopup from 'frontend/components/common/MapPopup/MapPopup';

import useSearchResultMap, { TSearchResultsMapProps } from './SearchResultsMap.utils';

import styles from './SearchResultsMap.module.scss';

export const SearchResultsMap = (props: TSearchResultsMapProps) => {
    const { fields: { Icon } = {} } = props;

    const isMobile = useMobileViewport();

    const {
        button: { title, ...buttonProps },
        popup: { isMapPopupShown, ...popupProps },
        isDisplayed,
        iconWrapperStyle,
        isLoading,
    } = useSearchResultMap(props);

    if (!isDisplayed) return null;

    if (isMobile && isLoading) {
        return <div className='placeholder-filter-btn placeholder-shimmer' data-tid='map-shimmer' />;
    }

    return (
        <div
            className={classNames(styles.searchResultsMap, { [styles.advanced]: !isMobile })}
            data-tid='search-results-map'
        >
            <div className={styles.buttonWrapper}>
                <Button dataTid='search-results-map-show-button' {...buttonProps}>
                    {title?.value}
                </Button>
            </div>

            <div className={styles.iconWrapper} style={iconWrapperStyle}>
                {Icon?.value.src && (
                    <JSSImage field={Icon} className={styles.icon} data-tid='search-results-map-icon' />
                )}
            </div>

            {isMapPopupShown && <MapPopup {...popupProps} />}
        </div>
    );
};

export default observer(SearchResultsMap);
