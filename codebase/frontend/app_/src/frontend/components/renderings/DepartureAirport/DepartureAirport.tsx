import { FC, useState } from 'react';
import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMount } from 'frontend/hooks/useMount';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getAirportByCode } from 'frontend/utils/airports.utils';
import { hasEnoughSymbolsToSearch } from 'frontend/utils/search/searchPod.utils';
import { getQuizEventsCoreParamsOverride } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { IDepartureAirportFields } from 'models/data/IHolidayInspiration';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';
import AirportCheckboxColumns from 'frontend/components/common/AirportCheckboxColumns/AirportCheckboxColumns';
import QuestionFooter from 'frontend/components/common/InspireMeQuestionFooter/QuestionFooter';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import SvgSearch from 'frontend/components/icons-new/Search';
import {
    filterAirports,
    isCheckedAirport,
} from 'frontend/components/renderings/DepartureAirport/DepartureAirport.utils';
import commonStyles from 'frontend/components/renderings/InspireMeTabs/InspireMeTabs.module.scss';

import DepartureAirportPill from './components/DepartureAirportPill/DepartureAirportPill';

import styles from './DepartureAirport.module.scss';

export type TDepartureAirportProps = ISitecoreComponent<IDepartureAirportFields>;

const DepartureAirport: FC<TDepartureAirportProps> = ({ fields, rendering }) => {
    const {
        goToNextQuestion,
        goToPrevQuestion,
        getPhrase,
        setAnswer,
        trackEventWithParams,
        getAnswersForActiveTab,
        firstAvailableDate,
        clearAvailabilityData,
    } = useStore((stores: IHolidaysStores) => ({
        goToNextQuestion: stores.inspireMeStore.goToNextQuestion,
        goToPrevQuestion: stores.inspireMeStore.goToPrevQuestion,
        getPhrase: stores.layoutStore.getPhrase,
        setAnswer: stores.inspireMeStore.setAnswer,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        getAnswersForActiveTab: stores.inspireMeStore.getAnswersForActiveTab,
        firstAvailableDate: stores.inspireMeStore.firstAvailableDate,
        clearAvailabilityData: stores.inspireMeStore.clearAvailabilityData,
    }));

    const fullAirportsListFromSiteCore = fields?.airportsGroups || [];

    const [checkedAirports, setCheckedAirports] = useState<string[]>(() => {
        const answersFromStore = getAnswersForActiveTab<string[]>();

        if (answersFromStore) {
            return answersFromStore;
        }

        return [];
    });
    const [filteredAirports, setFilteredAirports] = useState<IAirportCountry[]>(fullAirportsListFromSiteCore);
    const [searchedAirport, setSearchedAirport] = useState<string>('');

    useMount(() => {
        const getAllAirportCodes = (airportsArray: IAirport[]): string[] =>
            airportsArray.reduce((codes, airport) => {
                if (airport.code) return [...codes, airport.code];

                if (airport.airports) {
                    return [...codes, ...getAllAirportCodes(airport.airports)];
                }

                return codes;
            }, [] as string[]);

        const allAirports: string[] = fullAirportsListFromSiteCore.reduce((codes, airportList) => {
            if (airportList.airports) {
                codes = [...codes, ...getAllAirportCodes(airportList.airports)];
            }

            return codes;
        }, [] as string[]);

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Impressions,
                eventLabel: rendering.componentName,
                eventType: EventTypes.NonInteraction,
            },
            generateGenericValues({
                genericValue1: allAirports.join('|'),
                destinationUrl: null,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields?.data),
        );
    });

    const trackButtonClick = async (action: EventActions, genericValue1?: string): Promise<void> => {
        await trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: action,
                eventLabel: rendering.componentName,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                genericValue1: genericValue1 ?? null,
                destinationUrl: null,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields?.data),
        );
    };

    const handleNextQuestionClick = async (): Promise<void> => {
        await trackButtonClick(EventActions.Continue, checkedAirports.join('|'));
        goToNextQuestion();
    };

    const handleBackQuestionClick = async (): Promise<void> => {
        await trackButtonClick(EventActions.Back);
        goToPrevQuestion();
    };

    const onClickOnAirportsGroup = (codesList: string[]): void => {
        // if all airports from group are checked, codeList will contain all airports exclude unchecked
        if (codesList.every(code => checkedAirports.includes(code))) {
            answerHandler(codesList);

            return;
        }

        // if some airports from group are checked -> check all
        if (codesList.some(code => checkedAirports.includes(code))) {
            const notCheckedFromGroup = codesList.filter(code => !checkedAirports.includes(code));
            answerHandler([...checkedAirports, ...notCheckedFromGroup]);

            return;
        }

        //no one airport from group are checked -> check all
        answerHandler([...checkedAirports, ...codesList]);
    };

    const onAddAirport = (code: string): void => {
        answerHandler([...checkedAirports, code]);
    };

    const onRemoveAirport = (code: string): void => {
        answerHandler(checkedAirports.filter(airportCode => airportCode !== code));
    };

    const onInputHandler = (value: string): void => {
        setSearchedAirport(value);

        if (!hasEnoughSymbolsToSearch(value)) {
            setFilteredAirports(fullAirportsListFromSiteCore);

            return;
        }

        setFilteredAirports(filterAirports(fullAirportsListFromSiteCore, value));
    };

    const answerHandler = (airports: string[]): void => {
        setCheckedAirports(airports);
        setAnswer<string[] | null>(airports.length ? airports : null);

        //clear availability date if it loaded and user editing answer and change airports
        if (firstAvailableDate) {
            clearAvailabilityData();
        }
    };

    return (
        <div className={classNames(commonStyles.questionWrapper, commonStyles.commonQuestionStructure, styles.wrapper)}>
            <Text tag='h2' field={fields?.data.QuestionTitle} />
            <ValidatableField
                onChange={onInputHandler}
                value={searchedAirport}
                id='inspire-me-departure-airport'
                isVertical
                label={getPhrase(SitecoreDictionary.GlobalsLabelsFrom)}
                watermark={fields?.data?.PickYourAirportLabel?.value}
                errors={[]}
                autoComplete={false}
                inputContainerClass='form-control__label--focused'
                inputClass={styles.input}
                containerClass={styles.inputSearch}
                notShowValidIcon
            >
                <SvgSearch className={styles.searchIcon} />
            </ValidatableField>

            <div className={styles.airports}>
                <AirportCheckboxColumns
                    countries={filteredAirports} // all airports for market or all matched with searched value
                    origins={checkedAirports}
                    setOrigins={onClickOnAirportsGroup}
                    onAddOrigin={onAddAirport}
                    onRemoveOrigin={onRemoveAirport}
                    isChecked={isCheckedAirport(checkedAirports)}
                    isDisabled={() => false}
                />
            </div>

            {!!checkedAirports.length && (
                <div className={styles.pillsWrapper}>
                    {checkedAirports.map(code => (
                        <DepartureAirportPill
                            key={code}
                            name={getAirportByCode(code, fields?.airportsGroups || [])?.name || ''}
                            dataTid={code}
                            onClick={() => {
                                onRemoveAirport(code);
                            }}
                            ariaLabel={getPhrase(SitecoreDictionary.AccessibilityAriaLabelRemoveItem)}
                        />
                    ))}
                </div>
            )}

            <QuestionFooter
                onNextClick={handleNextQuestionClick}
                onBackClick={handleBackQuestionClick}
                isNextButtonDisabled={!checkedAirports.length}
                className={styles.footer}
            />
        </div>
    );
};

export default observer(DepartureAirport);
