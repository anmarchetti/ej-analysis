using System.Collections.Generic;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Feature.Tracker.Tests.Commands
{
    public class MarkSubscribedAnonymousContactsTestsData
    {
        public static IEnumerable<object[]> ValidCommandContexts()
        {
            yield return new object[] { null };

            yield return new object[] { new CommandContext() };

            yield return new object[] { CommandContext.Empty };
        }
    }
}