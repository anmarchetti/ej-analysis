import { useRoomAndBoardLocalStore, withRoomAndBoardLocalStore } from './createRoomAndBoardLocalStore';

describe('createRoomAndBoardLocalStore', () => {
    it('should provide withRoomAndBoardLocalStore and useRoomAndBoardLocalStore', () => {
        expect(withRoomAndBoardLocalStore).toBeDefined();
        expect(useRoomAndBoardLocalStore).toBeDefined();
    });
});
