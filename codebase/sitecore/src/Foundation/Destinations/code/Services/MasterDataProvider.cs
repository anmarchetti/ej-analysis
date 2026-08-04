using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Services
{
    public class MasterDataProvider
    {
        public List<MasterData> MasterData { get; }

        public MasterDataProvider()
        {
            MasterData = new List<MasterData>();
        }

        public void AddItem(MasterData item)
        {
            MasterData.Add(item);
        }
    }
}