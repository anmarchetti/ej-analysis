using AutoFixture.Xunit2;
using easyJet.Feature.Booking.Commands;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Feature.Booking.Tests.Commands
{
    public class StopBulkToolProcessCommandTests
    {
        private readonly StopBulkToolProcessCommand command;

        public StopBulkToolProcessCommandTests()
        {
            command = new StopBulkToolProcessCommand();
        }

        [Fact]
        public void QueryState_ShouldHideCommand_IfContextItemIsNull()
        {
            // Act
            var actual = command.QueryState(new CommandContext(items: null));

            // Assert
            actual.Should().Be(CommandState.Hidden);
        }

        [Theory]
        [AutoData]
        public void QueryState_ShouldEnabledCommand_IfContextItemIsValid(Db db)
        {
            // Arrange
            var dbItem = new DbItem("Cancellation and refund item", ID.NewID, Constants.TemplateIds.CancellationAndRefund);
            dbItem.Fields.Add(new DbField(Constants.Fields.CancellationAndRefund.Status) { Value = Constants.ProgressStatuses.InProgress });

            db.Add(dbItem);

            // Act
            var actual = command.QueryState(new CommandContext(db.GetItem(dbItem.ID)));

            // Assert
            actual.Should().Be(CommandState.Enabled);
        }
    }
}
