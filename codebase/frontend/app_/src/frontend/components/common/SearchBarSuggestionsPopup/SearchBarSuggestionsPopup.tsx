import { FC, useEffect, useRef } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { DESTINATION_TYPE_DICTIONARY, DestinationType } from 'models/enum/DestinationType';
import { HighlightedText } from 'frontend/components/common/HighlightedText/HighlightedText';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import SearchBarSuggestionIcon from './components/SearchBarSuggestionIcon/SearchBarSuggestionIcon';
import SearchBarSuggestionsPopupError from './components/SearchBarSuggestionsPopupError/SearchBarSuggestionsPopupError';
import SearchBarSuggestionsPopupShimmer from './components/SearchBarSuggestionsPopupShimmer/SearchBarSuggestionsPopupShimmer';

export enum SearchBarSuggestionsPopupType {
    Row = 'Row',
    Multiline = 'Multiline',
}

export interface ISearchBarSuggestionsPopupProps {
    availableCodes: string[] | null;
    filterValue: string;
    onSelect: (codes: string[], place: IDestinationCountry | IDestination) => void;
    places: Nullable<IDestinationCountry[] | IDestination[]>;
    type: SearchBarSuggestionsPopupType;
    errorDescription?: string;
    errorMessage?: string;
    hasBlockedPlaces?: boolean;
    highlightedIdx?: number;
    isLoading?: boolean;
    parentHtmlElement?: React.RefObject<HTMLDivElement>;
    popupId?: string;
    resetHighlightedIdx?: () => void;
}

export const SearchBarSuggestionsPopup: FC<ISearchBarSuggestionsPopupProps> = ({
    availableCodes,
    filterValue,
    onSelect,
    places,
    type,
    errorDescription,
    errorMessage,
    hasBlockedPlaces,
    highlightedIdx,
    isLoading,
    parentHtmlElement,
    popupId,
    resetHighlightedIdx,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { fields: { LoadingLabel, ResultLabel, ResultsLabel } = {} } = useSearchPodStore();

    const prevItemCount = usePrevious(places?.length || 0);

    const highlightedElement = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!places || prevItemCount !== places.length) {
            resetHighlightedIdx?.();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [places?.length]);

    useEffect(() => {
        scrollToHighlightedElement();
    }, [highlightedIdx]);

    useEffect(() => {
        resetHighlightedIdx?.();
        showStickyOverflow(true);

        return () => {
            resetHighlightedIdx?.();
            showStickyOverflow(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const scrollToHighlightedElement = (): void => {
        if (highlightedElement.current) {
            scrollIntoViewIfNeeded(highlightedElement.current, {
                behavior: 'smooth',
                block: 'nearest',
                scrollMode: 'if-needed',
            });
        }
    };

    const placeClick = (place: IDestinationCountry): void => {
        if (!place.showOnSearchPod) {
            // Disabled item, no action required
            return;
        }

        if (place.type === DestinationType.Group) {
            const codes: string[] = [];

            if (place.children) {
                place.children.forEach(child => {
                    if (availableCodes) {
                        if (availableCodes.indexOf(child.code) != -1) {
                            codes.push(child.code);
                        }
                    } else {
                        codes.push(child.code);
                    }
                });
                onSelect(codes, place);
            }
        } else {
            onSelect([place.code], place);
        }
    };

    const showStickyOverflow = (show: boolean): void => {
        if (parentHtmlElement?.current) {
            const stickyBox: HTMLElement | null = parentHtmlElement.current.closest('#sticky-box') as HTMLElement;

            if (stickyBox) {
                stickyBox.style.overflow = show ? 'visible' : '';
            }
        }
    };

    const isMultiline = type === SearchBarSuggestionsPopupType.Multiline;

    if (isLoading && !places?.length) {
        return <SearchBarSuggestionsPopupShimmer isMultiline={isMultiline} className={'sb-popup sb-popup--loading'} />;
    }

    if (!places) {
        return null;
    }

    const total = places.length;

    if (total === 0) {
        return (
            <SearchBarSuggestionsPopupError
                hasBlockedPlaces={hasBlockedPlaces}
                errorMessage={errorMessage}
                errorDescription={errorDescription}
            />
        );
    }

    const resultsLabel = total === 1 ? getFieldValue(ResultLabel) : getFieldValue(ResultsLabel);

    return (
        <div className={'sb-popup'} id={popupId}>
            <div className='sb-popup-inner'>
                {isLoading ? (
                    <Text tag='div' field={LoadingLabel} className='sb-popup--loading__msg' />
                ) : (
                    <div className='popup-res-count'>
                        {total} {resultsLabel}
                    </div>
                )}
                <div className='popup-items'>
                    {places.map((place, index) => {
                        const isItemHighlighted = highlightedIdx !== undefined && highlightedIdx === index;

                        return (
                            <button
                                type='button'
                                className={classNames('popup-item', {
                                    'popup-item--disabled': !place.showOnSearchPod,
                                    'popup-item--highlighted': isItemHighlighted,
                                    'popup-item--anywhere': place.type === DestinationType.Anywhere,
                                })}
                                ref={isItemHighlighted ? highlightedElement : null}
                                key={place.code + index}
                                data-tid={place.code}
                                onClick={(): void => placeClick(place)}
                            >
                                <div className={isMultiline ? '' : 'popup-item-wrapper'}>
                                    <div className={`popup-item-${isMultiline ? 'top' : 'left'}`}>
                                        <i
                                            data-tid='search-bar-suggestion-icon'
                                            className={classNames('icon', {
                                                'big-icon': place.hotelTypeIcon,
                                            })}
                                        >
                                            <SearchBarSuggestionIcon type={place.type} icon={place.hotelTypeIcon} />
                                        </i>
                                        <span className='popup-item-name'>
                                            <HighlightedText
                                                text={place.name || place.code}
                                                filterValue={filterValue}
                                            />
                                        </span>
                                    </div>
                                    {place.type !== DestinationType.Anywhere && (
                                        <div className={`popup-item-${isMultiline ? 'bottom' : 'right'}`}>
                                            <span>
                                                {`${getPhrase(DESTINATION_TYPE_DICTIONARY[place.type || ''])}${
                                                    place.parents?.[0]
                                                        ? ` -${place.parents.map(item => ' ' + item.name)}`
                                                        : ``
                                                }`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SearchBarSuggestionsPopup;
