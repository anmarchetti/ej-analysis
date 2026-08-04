using System;
using System.Collections.Generic;

namespace easyJet.Feature.Tracker.Tests.Commands
{
    public class SyncEskelDataTestsDataGenerator
    {
        public static IEnumerable<object[]> FaultyDatesForAction()
        {
            yield return new object[] { $"notAValidDate|neitherIsThis" };
            yield return new object[] { $"{DateTime.UtcNow.AddDays(-1)}|stillNotValid" };
            yield return new object[] { $"nowThisOneIsNotParseable!|{DateTime.UtcNow}" };
        }
    }
}