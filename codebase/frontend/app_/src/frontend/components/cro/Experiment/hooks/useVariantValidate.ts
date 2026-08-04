import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { TestDevices, TestPages } from 'frontend/components/cro/Experiment/constants';
import { ITestConfig } from 'frontend/components/cro/Experiment/models';

const useVariantValidate = (testConfig: ITestConfig | undefined): boolean => {
    const { isScreenLessMedium, isHolidayTypePage, isSearchResultsPage, isPricePromisePage, isHomePage, isPromoPage } =
        useStore((stores: TStores) => ({
            isScreenLessMedium: stores.appStore.isScreenLessMedium,
            isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
            isHolidayTypePage: stores.layoutStore.isHolidayTypePage,
            isPricePromisePage: stores.layoutStore.isPricePromisePage,
            isHomePage: stores.layoutStore.isHomePage,
            isPromoPage: stores.layoutStore.isPromoPage,
        }));

    if (!testConfig) return true;

    // TODO (John Walker): Make this work for multiple configs. eg ["desktop", "mobile"]
    //Device
    if (testConfig.device === TestDevices.Mobile && !isScreenLessMedium) return false;

    if (testConfig.device === TestDevices.Desktop && isScreenLessMedium) return false;

    //Page
    if (testConfig.page === TestPages.Home && !isHomePage) return false;

    if (testConfig.page === TestPages.SearchResults && !isSearchResultsPage) return false;

    if (testConfig.page === TestPages.PricePromise && !isPricePromisePage) return false;

    if (testConfig.page === TestPages.HolidayType && !isHolidayTypePage) return false;

    if (testConfig.page === TestPages.Promo && !isPromoPage) return false;

    return true;
};

export default useVariantValidate;
