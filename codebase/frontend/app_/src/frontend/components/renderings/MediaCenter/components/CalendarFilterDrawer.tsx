import React, { useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { DynamicFlatPicker, TReactFlatpickr } from 'frontend/components/common/Calendar/components/FlatPickerDynamic';
import Drawer from 'frontend/components/common/Drawer';
import FakeInput from 'frontend/components/common/FakeInput/FakeInput';
import IconCalendar from 'frontend/components/icons/Calendar';
import IconChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import IconChevronRight from 'frontend/components/icons-new/ChevronRight';

import SelectMonthYear from './SelectMonthYear';

export interface IFiltersContainerProps {
    id: string;
    isDrawerActive: boolean;
    label: string;
    maxDate: Date;
    minDate: Date;
    onApply: () => void;
    onCancel: () => void;
    onChange: (dates: Date[]) => void;
    placeholder: string;
    value: Date | undefined;
}

export const CalendarFilterDrawer = (props: IFiltersContainerProps) => {
    const calendarRef = useRef() as React.RefObject<TReactFlatpickr>;

    const { getPhrase, formatDateDMY } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatDateDMY: stores.mediaCenterStore.formatDateDMY,
    }));

    const onReady = (_, __, fp) => {
        fp.calendarContainer.classList.add('date-filter-calendar-wrapper-mobile');
    };

    return (
        <Drawer open={props.isDrawerActive} isInDrawer dataTid='calendar-filter-drawer'>
            <div className='drawer__content' id={props.id}>
                <div className='date-filter-mobile__title'>
                    {getPhrase(SitecoreDictionary.PressHubFiltersLabelsSubtitle)}
                </div>
                <FakeInput
                    id={props.id}
                    staticIcon={<IconCalendar />}
                    label={props.label}
                    placeholder={props.placeholder}
                    value={formatDateDMY(props.value)}
                    showClearButton={false}
                    highlightWhenFull
                />

                <SelectMonthYear
                    className='year-dropdown__select'
                    classNamePrefix='custom-select'
                    minDate={props.minDate}
                    maxDate={props.maxDate}
                    value={props.value}
                    calendarRef={calendarRef}
                    hasOverlay={true}
                    initialPickerState={{
                        month: (props.value || props.maxDate).getMonth(),
                        year: (props.value || props.maxDate).getFullYear(),
                    }}
                />

                <DynamicFlatPicker
                    calendarRef={calendarRef}
                    value={props.value}
                    options={{
                        allowInput: false,
                        inline: true,
                        showMonths: 1,
                        animate: false,
                        minDate: props.minDate,
                        maxDate: props.maxDate,
                        monthSelectorType: 'static',
                        disableMobile: true,
                        prevArrow: ReactDOMServer.renderToStaticMarkup(<IconChevronLeft />).toString(),
                        nextArrow: ReactDOMServer.renderToStaticMarkup(<IconChevronRight />).toString(),
                    }}
                    onChange={props.onChange}
                    onReady={onReady}
                />
            </div>
            <div className='drawer__actions' data-tid='drawer-actions'>
                <Button isTransparent isFullWidth onClick={props.onCancel} dataTid='cancel-filter-btn'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
                <Button isFullWidth onClick={props.onApply} dataTid='apply-filter-btn'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                </Button>
            </div>
        </Drawer>
    );
};

export default observer(CalendarFilterDrawer);
