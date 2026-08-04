using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;

using FluentAssertions;

using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking
{
    public class AmendPassengerValidationServiceTests
    {
        private readonly AmendPassengerValidationService sub;

        public AmendPassengerValidationServiceTests()
        {
            sub = new AmendPassengerValidationService();
        }

        [Theory]
        [InlineData("Pavel", "Pavel", 0)]
        [InlineData("Levap", "Pavel", 4)]
        [InlineData("Pavel", "", 5)]
        [InlineData("", "Pavel", 5)]
        [InlineData("PavVel", "Pavel", 1)]
        [InlineData("PPavvell", "Pavel", 3)]
        public void ValidationNumberChangedCharactersTest_Success(string oldName, string newName, int differenceCount)
        {
            var result = sub.CalculateNumberChangedCharacters(oldName, newName);

            result.Should().Be(differenceCount);
        }

        [Theory]
        [InlineData((string)null, "Pavel")]
        [InlineData("Levap", (string)null)]
        public void ValidationNumberChangedCharactersTest_NameIsNull_ThrowException(string oldName, string newName)
        {
            Func<int> act = () => sub.CalculateNumberChangedCharacters(oldName, newName);

            act.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [InlineData("1", true)]
        [InlineData("4", false)]
        public void IsAmendingLeadPassenger(string amendPassengerId, bool isLeadPassenger)
        {
            var guests = new List<PersonWithDetails>
            {
                new PersonWithDetails
                {
                    FirstName= "Test",
                    LastName= "Test",
                    Index = "1",
                    IsLead = true
                },
                new PersonWithDetails
                {
                    FirstName= "Test",
                    LastName= "Test",
                    Index = "2",
                    IsLead = true
                },
            };

            var result = sub.IsAmendingLeadPassenger(guests, amendPassengerId);

            result.Should().Be(isLeadPassenger);
        }

        [Theory]
        [InlineData("1", 1)]
        [InlineData("2", 0)]
        [InlineData("3", 2)]
        public void CalculateNameChangeCount(string amendPassengerId, int changesCount)
        {
            var guests = new List<AmendPaxHistoryItem>
            {
                new AmendPaxHistoryItem
                {
                    Index = "1",
                    PaxNameChanged= AmendPaxCondition.Yes
                },
                new AmendPaxHistoryItem
                {
                    Index = "2",
                    PaxNameChanged = AmendPaxCondition.No
                },
                new AmendPaxHistoryItem
                {
                    Index = "3",
                    PaxNameChanged= AmendPaxCondition.Yes
                },
                new AmendPaxHistoryItem
                {
                    Index = "3",
                    PaxNameChanged = AmendPaxCondition.Yes
                },
            };

            var result = sub.CalculateNameChangeCount(guests, amendPassengerId);

            result.Should().Be(changesCount);
        }
    }
}