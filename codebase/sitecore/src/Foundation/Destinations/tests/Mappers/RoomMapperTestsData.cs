using System.Collections.Generic;
using Sitecore.NSubstituteUtils;

namespace easyJet.Foundation.Destinations.Tests.Mappers
{
    public class RoomMapperTestsData
    {
        public static IEnumerable<object[]> InvalidRoomFolders()
        {
            yield return new object[] { null };

            yield return new object[] { new FakeItem() };

            yield return new object[] { new FakeItem().WithChild(new FakeItem()) };
        }
    }
}