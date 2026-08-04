using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IMasterDataService
    {
        IEnumerable<MasterData> GetBoardTypes();
    }
}