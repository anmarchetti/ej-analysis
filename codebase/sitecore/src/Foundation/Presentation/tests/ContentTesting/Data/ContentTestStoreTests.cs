using System.Collections.Generic;
using easyJet.Foundation.Presentation.ContentTesting.Data;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Collections;
using Sitecore.ContentTesting.Data.Configuration;
using Sitecore.ContentTesting.Model.Data.Items;
using Sitecore.ContentTesting.Models;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Globalization;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.ContentTesting.Data
{
    public class ContentTestStoreTests
    {
        private readonly ContentTestStore contentTestStore;

        public ContentTestStoreTests()
        {
            contentTestStore = Substitute.ForPartsOf<ContentTestStore>();
        }

        [Theory]
        [AutoDbData]
        public void CreateTest_ShouldBeNull_IfAddTestDefinitionReturnNull(Db db, Item hostItem)
        {
            // Arragne
            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "contentDatabase", "master" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext)
            {
            })
            {
                Context.ContentDatabase = db.Database;
                TestDefinitionItem testDefinitionItem = null;

                contentTestStore
                    .AddTestDefinition(Arg.Any<string>(), Arg.Any<Language>(), Arg.Any<Database>())
                    .Returns(testDefinitionItem);

                // Act
                var actual = contentTestStore.CreateTest(new TestOptions()
                {
                    HostItemDataUri = hostItem.Uri.ToDataUri()
                });

                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [AutoDbData]
        public void CreateTest_ShouldUpdateTest_IfAddTestDefinitionReturnItem(Db db, Item hostItem, Item item)
        {
            // Arragne
            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "contentDatabase", "master" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext)
            {
            })
            {
                Context.ContentDatabase = db.Database;

                var testDefinitionItem = new TestDefinitionItem(item);
                contentTestStore
                    .AddTestDefinition(Arg.Any<string>(), Arg.Any<Language>(), Arg.Any<Database>())
                    .Returns(testDefinitionItem);

                // Act
                var actual = contentTestStore.CreateTest(new TestOptions()
                {
                    HostItemDataUri = hostItem.Uri.ToDataUri()
                });

                // Assert
                actual.Should().NotBeNull();
                contentTestStore.Received().UpdateTest(Arg.Any<TestDefinitionItem>(), Arg.Any<TestOptions>());
            }
        }

        [Theory]
        [AutoDbData]
        public void CreateTest_ShouldProccessCandidates_IfProccessCandidateArgumentIsTrue(Db db, Item hostItem, Item item)
        {
            // Arragne
            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "contentDatabase", "master" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext)
            {
            })
            {
                Context.ContentDatabase = db.Database;

                var testDefinitionItem = new TestDefinitionItem(item);
                contentTestStore
                    .AddTestDefinition(Arg.Any<string>(), Arg.Any<Language>(), Arg.Any<Database>())
                    .Returns(testDefinitionItem);

                var testCandidates = Substitute.ForPartsOf<ContentVersionTestCandidate>(item.Uri, null);
                testCandidates.CreateVariables(Arg.Any<TestDefinitionItem>(), Arg.Any<ContentTestStore>())
                    .Returns(new List<Item>()
                    {
                        item
                    });
                var subTestCandidates = Substitute.For<ITestCandidate>();
                subTestCandidates.Device.Returns(new DeviceItem(item));

                // Act
                var actual = contentTestStore.CreateTest(
                    new TestOptions()
                    {
                        HostItemDataUri = hostItem.Uri.ToDataUri(),
                        TestCandidates = new List<ITestCandidate>()
                        {
                           testCandidates,
                           subTestCandidates
                        }
                    }, true);

                // Assert
                actual.Should().NotBeNull();
                testCandidates.Received().CreateVariables(Arg.Any<TestDefinitionItem>(), Arg.Any<ContentTestStore>());
                contentTestStore.Received().UpdateTest(Arg.Any<TestDefinitionItem>(), Arg.Any<TestOptions>());
            }
        }
    }
}
