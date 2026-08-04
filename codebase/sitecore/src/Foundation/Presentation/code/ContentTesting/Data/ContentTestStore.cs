using System.Collections.Generic;
using System.Linq;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.ContentTesting.Data;
using Sitecore.ContentTesting.Data.Configuration;
using Sitecore.ContentTesting.Model.Data.Items;
using Sitecore.ContentTesting.Models;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.SecurityModel;
using Sitecore.StringExtensions;

namespace easyJet.Foundation.Presentation.ContentTesting.Data
{
    public class ContentTestStore : SitecoreContentTestStore
    {
        public override TestDefinitionItem CreateTest(TestOptions testOptions, bool processCandidates = false)
        {
            Assert.ArgumentNotNull(testOptions, nameof(testOptions));
            var contentDatabase = Context.ContentDatabase ?? Factory.GetDatabase("master");

            Item hostItem = contentDatabase.GetItem(testOptions.HostItemDataUri);

            Assert.IsNotNull(hostItem, "Item \"{0}\" not found.", (object)testOptions.HostItemDataUri);
            using (new LanguageSwitcher(hostItem.Language))
            {
                TestDefinitionItem testItem = AddTestDefinition("{0} {1}".FormatWith(hostItem.Name, ID.NewID.ToShortID()), hostItem.Language, hostItem.Database);
                if (testItem == null)
                {
                    return null;
                }

                if (processCandidates)
                {
                    bool flag = false;
                    ID id = null;
                    IEnumerable<ITestCandidate> testCandidates = testOptions.TestCandidates.Where(c => c is ContentVersionTestCandidate);
                    if (testCandidates.Any())
                    {
                        IEnumerable<ITestCandidate> source = testOptions.TestCandidates.Except(testCandidates);
                        flag = source.Any();
                        if (flag)
                        {
                            id = source.ElementAt(0).Device.ID;
                        }
                    }

                    foreach (ITestCandidate testCandidate in testOptions.TestCandidates)
                    {
                        IEnumerable<Item> variables = testCandidate.CreateVariables(testItem, this);
                        if (flag && testCandidate is ContentVersionTestCandidate && variables.Any())
                        {
                            ContentTestVariableItem testVariableItem = ContentTestVariableItem.Create(variables.ElementAt(0));
                            if (testVariableItem != null && id != (ID)null)
                            {
                                using (new EditContext(testVariableItem, SecurityCheck.Disable))
                                {
                                    testVariableItem.Device.Value = id.ToString();
                                }
                            }
                        }
                    }
                }

                testItem.InnerItem.Reload();
                UpdateTest(testItem, testOptions);

                return testItem;
            }
        }
    }
}