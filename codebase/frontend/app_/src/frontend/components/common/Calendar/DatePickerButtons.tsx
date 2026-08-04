import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';

interface IDatePickerButtonsProps {
    clearDate: () => void;
    currentDates: Date[];
    nightsSelectedLabel: Nullable<string>;
    numberOfNights: number;
    onApply: () => void;
    onCloseClick: () => void;
}

const DatePickerButtons = ({
    numberOfNights,
    nightsSelectedLabel,
    currentDates,
    clearDate,
    onApply,
    onCloseClick,
}: IDatePickerButtonsProps) => {
    const { getPhrase, isScreenMedium } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenMedium: stores.appStore.isScreenMedium,
    }));
    const isShowLabel = !isScreenMedium && numberOfNights > 0;

    return (
        <div className='search-bar__dropdown-wrapper search-bar__dropdown-wrapper-btns'>
            <div className='search-bar__dropdown-btns search-bar__dropdown-btns--clear'>
                {(!isScreenMedium || currentDates?.length > 0) && (
                    <Button
                        dataTid='clear-select-btn'
                        isTransparent
                        isText
                        className='search-bar__dropdown-clear'
                        onClick={clearDate}
                    >
                        {getPhrase(SitecoreDictionary.ContactUsButtonsClearFromSelection)}
                    </Button>
                )}
                {isShowLabel && <span className='slected-nights'>{nightsSelectedLabel}</span>}
            </div>

            <div className='search-bar__dropdown-btns search-bar__dropdown-btns--set'>
                <Button
                    dataTid='close-popup-btn'
                    isTransparent
                    className='search-bar__dropdown-close me-lg-3'
                    onClick={onCloseClick}
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
                <Button
                    dataTid='apply-dates-btn'
                    className='search-bar__dropdown-apply'
                    onClick={onApply}
                    disabled={currentDates?.length !== 2}
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                </Button>
            </div>
        </div>
    );
};

export default DatePickerButtons;
