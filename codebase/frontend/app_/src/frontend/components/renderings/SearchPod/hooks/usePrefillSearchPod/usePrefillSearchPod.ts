import { BaseQueryParamsGetters } from 'frontend/store/base';
import { SearchFromStore } from 'frontend/store/base/search/SearchFromStore';
import { SearchWhenStore } from 'frontend/store/base/search/SearchWhenStore';
import usePrefillDestinationAndHotelDetailsBrowsePage, {
    IUsePrefillDestinationAndHotelDetailsBrowsePageProps,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillDestinationAndHotelDetailsBrowsePage';
import usePrefillHomePage, {
    IUsePrefillHomePageProps,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillHomePage';
import usePrefillOnHotelDetailsBookPage, {
    IUsePrefillHotelDetailsBookPage,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillHotelDetailsBookPage';
import usePrefillOtherPages, {
    IUsePrefillOtherPagesProps,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillOtherPages';
import usePrefillSearchResultsPage, {
    IUsePrefillSearchResultsPageProps,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchResultsPage';
import { ISearchPodDataFields, ISearchPodFields } from 'frontend/components/renderings/SearchPod/models';

export interface IUsePrefillSearchPodProps
    extends IUsePrefillHomePageProps,
        IUsePrefillDestinationAndHotelDetailsBrowsePageProps,
        IUsePrefillSearchResultsPageProps,
        IUsePrefillHotelDetailsBookPage,
        IUsePrefillOtherPagesProps {
    defaultSearchPodMonthSearchDuration: SearchWhenStore['defaultSearchPodMonthSearchDuration'];
    fields: ISearchPodFields<ISearchPodDataFields> | undefined;
    monthSearchDuration: SearchWhenStore['monthSearchDuration'];
    monthSearchDurationFromUrl: BaseQueryParamsGetters['monthSearchDurationFromUrl'];
    rendering: any;
    setCountries: SearchFromStore['setCountries'];
    setMonthSearchDuration: SearchWhenStore['setMonthSearchDuration'];
    shouldSkipEffect: boolean;
}

const usePrefillSearchPod = (props: IUsePrefillSearchPodProps): void => {
    if (!props.shouldSkipEffect) {
        if (props.monthSearchDurationFromUrl === 0 && !props.monthSearchDuration) {
            // when a page with recent search in local storage or with query (e.g., search results) is reloaded the Sitecore value should NOT override the query parameter
            props.setMonthSearchDuration(props.defaultSearchPodMonthSearchDuration);
        }

        props.setCountries(props.rendering?.fields?.airportsGroups ?? []);
    }

    usePrefillHomePage(props);
    usePrefillDestinationAndHotelDetailsBrowsePage(props);
    usePrefillSearchResultsPage(props);
    usePrefillOnHotelDetailsBookPage(props);
    usePrefillOtherPages(props);
};

export default usePrefillSearchPod;
