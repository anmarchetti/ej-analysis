using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IMasterDataService), Lifetime = Lifetime.Singleton)]
    public class MasterDataService : IMasterDataService
    {
        private readonly MasterDataProvider boardsProvider;

        public MasterDataService()
        {
            boardsProvider = Sitecore.Configuration.Factory.CreateObject("boardsProvider", true) as MasterDataProvider;
        }

        public IEnumerable<MasterData> GetBoardTypes()
        {
            return boardsProvider.MasterData;
        }
    }
}