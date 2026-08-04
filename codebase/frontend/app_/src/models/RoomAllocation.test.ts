import { RoomAllocation } from './RoomAllocation';

describe('RoomAllocation', () => {
    describe('Adults', () => {
        it('it should add adult', () => {
            const room = new RoomAllocation();

            room.addAdult();

            expect(room.adults.length).toEqual(1);
        });

        it('it should remove adult', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addAdult();
            room.addAdult();

            room.removeAdult();

            expect(room.adults.length).toEqual(2);
        });
    });

    describe('Child', () => {
        it('it should add child', () => {
            const room = new RoomAllocation();

            room.addChild();

            expect(room.children.length).toEqual(1);
        });

        it('it should remove child', () => {
            const room = new RoomAllocation();
            room.addChild();
            room.addChild();
            room.addChild();

            room.removeChild();

            expect(room.children.length).toEqual(2);
        });
    });

    describe('Infant', () => {
        it('it should add infant', () => {
            const room = new RoomAllocation();

            room.addInfant();

            expect(room.infants.length).toEqual(1);
        });

        it('it should remove infant', () => {
            const room = new RoomAllocation();
            room.addInfant();
            room.addInfant();
            room.addInfant();

            room.removeInfant();

            expect(room.infants.length).toEqual(2);
        });
    });

    it('it should clear room and reset to default 2 adults', () => {
        const room = new RoomAllocation();
        room.addAdult();
        room.addChild();
        room.addInfant();

        room.clearRoom(false);

        expect(room.infants.length).toEqual(0);
        expect(room.children.length).toEqual(0);
        expect(room.adults.length).toEqual(2);
    });

    it('it should set room code', () => {
        const room = new RoomAllocation();

        room.setRoomCode('DB01');

        expect(room.roomCode).toEqual('DB01');
    });

    it('it should get total count of the guests', () => {
        const room = new RoomAllocation();
        room.addAdult();
        room.addAdult();
        room.addChild();
        room.addInfant();

        expect(room.totalCount).toEqual(4);
    });

    describe('isMinimumNumberOfAdults', () => {
        it('it should be true if minimum number of adults if less than 1', () => {
            const room = new RoomAllocation();

            expect(room.isMinimumNumberOfAdults).toBe(true);
        });

        it('it should be false if minimum number of adults is more than 1', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addAdult();

            expect(room.isMinimumNumberOfAdults).toBe(false);
        });

        it('it should be true if minimum number of adults is 1', () => {
            const room = new RoomAllocation();
            room.addAdult();

            expect(room.isMinimumNumberOfAdults).toBe(true);
        });
    });

    describe('isMinimumNumberOfAdultsForInfants', () => {
        it('it should be true if more than 1 infant per adult', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addInfant();
            room.addInfant();

            expect(room.isMinimumNumberOfAdultsForInfants).toBe(true);
        });

        it('it should be true if 1 infant per adults', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addInfant();
            room.addAdult();
            room.addInfant();

            expect(room.isMinimumNumberOfAdultsForInfants).toBe(true);
        });

        it('it should be false if adults more than infants', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addInfant();
            room.addAdult();

            expect(room.isMinimumNumberOfAdultsForInfants).toBe(false);
        });
    });

    describe('cantRemoveAdult', () => {
        it('it should be true if total number of adults is 0', () => {
            const room = new RoomAllocation();

            expect(room.cantRemoveAdult).toBe(true);
        });

        it('it should be false if total number of adults is 2', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addAdult();

            expect(room.cantRemoveAdult).toBe(false);
        });

        it('it should be true if total number of adults less then total number of infants', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addInfant();
            room.addInfant();

            expect(room.cantRemoveAdult).toBe(true);
        });

        it('it should be false if total number of adults more then total number of infants', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addAdult();
            room.addAdult();
            room.addInfant();
            room.addInfant();

            expect(room.cantRemoveAdult).toBe(false);
        });
    });

    describe('cantRemoveChild', () => {
        it('it should be true if total number of children is 0', () => {
            const room = new RoomAllocation();

            expect(room.cantRemoveChild).toBe(true);
        });

        it('it should be false if total number of children 1', () => {
            const room = new RoomAllocation();
            room.addChild();

            expect(room.cantRemoveChild).toBe(false);
        });
    });

    describe('isMaximumNumberOfInfantsForAdults', () => {
        it('it should be true if total number of infant is equal to total number of adults', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addInfant();

            expect(room.isMaximumNumberOfInfantsForAdults).toBe(true);
        });

        it('it should be false if total number of infants less than total number of adults', () => {
            const room = new RoomAllocation();
            room.addAdult();

            expect(room.isMaximumNumberOfInfantsForAdults).toBe(false);
        });
    });

    describe('cantAddInfant', () => {
        it('it should be true if total number of infant is equal to total number of adults', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addInfant();

            expect(room.cantAddInfant).toBe(true);
        });

        it('it should be false if total number of infants less than total number of adults', () => {
            const room = new RoomAllocation();
            room.addAdult();

            expect(room.cantAddInfant).toBe(false);
        });
    });

    describe('cantRemoveInfant', () => {
        it('it should be true if total number of infant is 0', () => {
            const room = new RoomAllocation();

            expect(room.cantRemoveInfant).toBe(true);
        });

        it('it should be false if total number of infants 1', () => {
            const room = new RoomAllocation();
            room.addInfant();

            expect(room.cantRemoveInfant).toBe(false);
        });
    });

    describe('isGuestsNumbersValid', () => {
        it('it should be true if total number of adults more than 1 and has 1 infant per adult', () => {
            const room = new RoomAllocation();
            room.addAdult();
            room.addInfant();
            room.addAdult();
            room.addInfant();

            expect(room.isGuestsNumbersValid).toBe(true);
        });

        it('it should be false if total number of infants is more than adults', () => {
            const room = new RoomAllocation();
            room.addInfant();

            expect(room.isGuestsNumbersValid).toBe(false);
        });

        it('it should be false if total number of adults is 0', () => {
            const room = new RoomAllocation();

            expect(room.isGuestsNumbersValid).toBe(false);
        });
    });
});
