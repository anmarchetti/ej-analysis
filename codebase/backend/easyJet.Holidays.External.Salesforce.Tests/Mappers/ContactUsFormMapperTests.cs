using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.External.Salesforce.Mappers;
using easyJet.Holidays.External.Salesforce.Models;
using easyJet.Holidays.External.Salesforce.Models.ContactUs;
using FluentAssertions;
namespace easyJet.Holidays.External.Salesforce.Tests.Mappers;

public class ContactUsFormMapperTests
{
    
    [Theory]
    [InlineData(true, "easyJet holidays Customer Resolution")]
    [InlineData(false, "easyJet holidays Customer Service")]
    public void GetSubject_ShouldReturnCorrectSubject(bool isPastHoliday, string expectedSubject)
    {
        // Act
        var subject = ContactUsFormMapper.GetSubject(isPastHoliday);

        // Assert
        subject.Should().Be(expectedSubject);
    }

    [Fact]
    public async Task ToSalesforceContactUsFormRequest_ShouldCreateCompositeRequestBody()
    {
        // Arrange
        var contactFormRequest = new ContactFormRequest
        {
            BookingReference = "ABC123",
            Question = "Test question",
            EmailAddress = "test@example.com",
            LeadPassengerFirstName = "John",
            LeadPassengerLastName = "Doe",
            ContactNumber = "123456789",
            IsPastHoliday = false,
        };

        var caseCategory = "General";
        var language = "en";

        // Act
        var result = await ContactUsFormMapper.ToSalesforceContactUsFormRequest(contactFormRequest, caseCategory, language);

        // Assert
        result.Should().NotBeNull();
        result.Requests.Should().HaveCount(3); // Get RecordType, Create case, and get case number
        result.Requests[0].Should().BeOfType<SalesforceGetRequest>(); // Get RecordType
        result.Requests[1].Should().BeOfType<SalesforcePostRequest<CaseBody>>(); // Create case
        result.Requests[2].Should().BeOfType<SalesforceGetRequest>(); // Get case number
    }
}