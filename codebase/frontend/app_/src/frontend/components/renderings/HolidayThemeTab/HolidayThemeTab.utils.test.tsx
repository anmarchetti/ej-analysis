import { IThemeFields } from 'models/data/IHolidayInspiration';
import { getAvailableAnswers } from 'frontend/components/renderings/HolidayThemeTab/HolidayThemeTab.utils';
import { ThemeQuestions } from 'frontend/components/renderings/HolidayThemeTab/interfaces';

describe('HolidayThemeTab.utils', () => {
    it('should return only available questions', () => {
        const availableTags = ['VBADLT'];
        const fields = {
            HolidayVibeOptions: [
                {
                    fields: {
                        Name: {
                            value: 'Adults',
                        },
                        Code: {
                            value: 'VBADLT',
                        },
                    },
                },
                {
                    fields: {
                        Name: {
                            value: 'Family',
                        },
                        Code: {
                            value: 'VBFML',
                        },
                    },
                },
                {
                    fields: {
                        Name: {
                            value: 'Luxury',
                        },
                        Code: {
                            value: 'VBLUX',
                        },
                    },
                },
            ],
            HolidayTypeOptions: [
                {
                    fields: {
                        Name: {
                            value: 'Beach Holiday',
                        },
                        Code: {
                            value: 'THMBH',
                        },
                    },
                },
                {
                    fields: {
                        Name: {
                            value: 'City Break',
                        },
                        Code: {
                            value: 'THMCB',
                        },
                    },
                },
                {
                    fields: {
                        Name: {
                            value: 'Lakes',
                        },
                        Code: {
                            value: 'THML',
                        },
                    },
                },
            ],
            HolidayVibeQuestions: {
                value: 'What vibe are you looking for?',
            },
        };

        const result = getAvailableAnswers(availableTags, fields as IThemeFields);

        expect(result).toMatchObject([
            {
                subType: ThemeQuestions.Vibe,
                title: 'What vibe are you looking for?',
                answerVariants: [
                    {
                        fields: {
                            Name: {
                                value: 'Adults',
                            },
                            Code: {
                                value: 'VBADLT',
                            },
                        },
                    },
                ],
            },
        ]);
    });

    it('should return empty array when there is no fields', () => {
        const availableTags = ['VBADLT'];
        const result = getAvailableAnswers(availableTags, undefined);
        expect(result).toMatchObject([]);
    });

    it('should return all fields when availableTags is empty', () => {
        const availableTags = [];
        const fields = {
            HolidayVibeOptions: [
                {
                    fields: {
                        Name: {
                            value: 'Adults',
                        },
                        Code: {
                            value: 'VBADLT',
                        },
                    },
                },
            ],
            HolidayTypeOptions: [
                {
                    fields: {
                        Name: {
                            value: 'Beach Holiday',
                        },
                        Code: {
                            value: 'THMBH',
                        },
                    },
                },
            ],
            HolidayVibeQuestions: {
                value: 'What vibe are you looking for?',
            },
            HolidayTypeQuestions: {
                value: 'What type are you looking for?',
            },
        };

        const result = getAvailableAnswers(availableTags, fields as IThemeFields);
        expect(result).toHaveLength(2);
    });

    it('should always include weather options as available', () => {
        const fields = {
            WeatherOptions: [
                {
                    fields: {
                        Name: {
                            value: 'Hot',
                        },
                        Code: {
                            value: 'HOT',
                        },
                    },
                },
            ],
        };

        const availableTags = [];
        const result = getAvailableAnswers(availableTags, fields as IThemeFields);

        expect(result).toMatchObject([
            {
                subType: ThemeQuestions.Weather,
                title: '',
                answerVariants: [
                    {
                        fields: {
                            Name: {
                                value: 'Hot',
                            },
                            Code: {
                                value: 'HOT',
                            },
                        },
                    },
                ],
            },
        ]);
    });
});
