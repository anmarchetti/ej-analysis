using easyJet.Foundation.Multisite.Pipelines.UiCloneItems;
using easyJet.Foundation.Multisite.Services;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Pipelines;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.UiCloneItems
{
    public class PopulateDelegatedAreaTest
    {
        private readonly IDelegatedAreaService delegatedAreaService;
        private readonly BaseFactory factory;
        private readonly PopulateDelegatedArea proccessor;

        public PopulateDelegatedAreaTest()
        {
            delegatedAreaService = Substitute.For<IDelegatedAreaService>();
            factory = Substitute.For<BaseFactory>();
            proccessor = new PopulateDelegatedArea(delegatedAreaService, factory);
        }

        [Fact]
        public void Process_ShouldNotPopulateDelegatedArea_IfDelegatedParameterIsNull()
        {
            // Arrange
            var args = new CopyItemsArgs();

            // Act
            proccessor.Process(args);

            // Assert
            delegatedAreaService.DidNotReceive().AddToDelegatedArea(Arg.Any<Item>(), Arg.Any<Item>());
        }

        [Fact]
        public void Process_ShouldNotPopulateDelegatedArea_IfDatabaseParameterIsNull()
        {
            // Arrange
            Database database = null;
            factory.GetDatabase(Arg.Any<string>()).Returns(database);

            var args = new CopyItemsArgs();
            args.Parameters.Add("delegatedArea", "true");

            // Act
            proccessor.Process(args);

            // Assert
            delegatedAreaService.DidNotReceive().AddToDelegatedArea(Arg.Any<Item>(), Arg.Any<Item>());
        }

        [Fact]
        public void Process_ShouldNotPopulateDelegatedArea_IfDestinationParameterIsNull()
        {
            // Arrange
            Item item = null;
            Database database = FakeUtil.FakeDatabase();
            database.GetItem(Arg.Any<string>()).Returns(item);
            factory.GetDatabase(Arg.Any<string>()).Returns(database);

            var args = new CopyItemsArgs();
            args.Parameters.Add("delegatedArea", "true");

            // Act
            proccessor.Process(args);

            // Assert
            delegatedAreaService.DidNotReceive().AddToDelegatedArea(Arg.Any<Item>(), Arg.Any<Item>());
        }

        [Fact]
        public void Process_ShouldNotPopulateDelegatedArea_IfArgsCopiesIsNull()
        {
            // Arrange
            Item item = new FakeItem();
            Database database = FakeUtil.FakeDatabase();
            database.GetItem(Arg.Any<string>()).Returns(item);
            factory.GetDatabase(Arg.Any<string>()).Returns(database);

            var args = new CopyItemsArgs()
            {
                Copies = null
            };

            args.Parameters.Add("delegatedArea", "true");

            // Act
            proccessor.Process(args);

            // Assert
            delegatedAreaService.DidNotReceive().AddToDelegatedArea(Arg.Any<Item>(), Arg.Any<Item>());
        }

        [Fact]
        public void Process_ShouldPopulateDelegatedArea_IfArgsCopiesIsNotNullAndTargetItemIsNotNull()
        {
            // Arrange
            Item item = new FakeItem();
            Database database = FakeUtil.FakeDatabase();
            database.GetItem(Arg.Any<string>()).Returns(item);
            factory.GetDatabase(Arg.Any<string>()).Returns(database);

            var args = new CopyItemsArgs()
            {
                Copies = new Item[] { item }
            };

            args.Parameters.Add("delegatedArea", "true");
            delegatedAreaService.AddToDelegatedArea(Arg.Any<Item>(), Arg.Any<Item>()).Returns(true);

            // Act
            proccessor.Process(args);

            // Assert
            delegatedAreaService.Received().AddToDelegatedArea(Arg.Any<Item>(), Arg.Any<Item>());
        }
    }
}
