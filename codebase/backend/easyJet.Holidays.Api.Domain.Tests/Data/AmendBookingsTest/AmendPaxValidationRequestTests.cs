using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using FluentAssertions;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests
{
    public class AmendPaxValidationRequestTests
    {
        [Theory]
        [MemberData(nameof(AmendPaxValidationRequestData))]
        public void AmendPaxValidationRequestTest_ValidationFail(AmendPaxValidationRequest request)
        {
            var validationContext = new ValidationContext(request);
            var act = request.Validate(validationContext);

            act.Count().Should().BePositive();
        }

        public static IEnumerable<object[]> AmendPaxValidationRequestData()
        {
            yield return [new AmendPaxValidationRequest { BookingReference = String.Empty, Guests = [new AmendPersonWithDetails()] }];
            yield return [new AmendPaxValidationRequest { BookingReference = String.Empty, Guests = [] }];
            yield return [new AmendPaxValidationRequest { BookingReference = "TestBooking", Guests = [] }];
        }
    }
}