using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Interfaces.Salesforce;
using easyJet.Holidays.Api.Domain.Services.ContactUs;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.ContactUs;

public class ContactUsServiceTests
{
    private readonly Mock<ISalesforceService> _salesforceServiceMock;
    private readonly Mock<IReferenceDataService> _referenceDataService;
    private readonly ContactUsService _sut;

    public ContactUsServiceTests()
    {
        _salesforceServiceMock = new();
        Mock<ILanguageService> langService = new();
        _referenceDataService = new();

        var contactUsSettings = new ContactUsSettings();

        _sut = new(_salesforceServiceMock.Object, langService.Object,
            Options.Create(contactUsSettings), new Mock<ILogger<ContactUsService>>().Object,
            _referenceDataService.Object);
    }

    [Fact]
    public async Task CreateCase_WhenSalesforceSpecified_SendCaseOnlyToSalesforce()
    {
        // Arrange
        var request = new ContactFormRequest { About = "Accommodation" };
        var result = new ContactUsResult { IsSuccessful = true, CaseNumber = "0001378" };
        _salesforceServiceMock
            .Setup(x => x.SendContacUsFormRequest(request, "Accommodation/Destination", It.IsAny<string>()))
            .ReturnsAsync(result);
        _referenceDataService.Setup(x => x.GetContactUsCaseTypes()).ReturnsAsync(new CaseTypes
        {
            Children =
            [
                new()
                {
                    Question = "Accommodation",
                    SendTo = ContactUsSendTo.Salesforce,
                    SalesforceCategory = "Accommodation/Destination",
                    State = "Future"
                }
            ]
        });
        // Act
        var res = await _sut.CreateCase(request);

        // Assert
        res.Should().Be(result);
        _salesforceServiceMock.Verify(
            x => x.SendContacUsFormRequest(request, "Accommodation/Destination", It.IsAny<string>()), Times.Once);
    }

    [Theory]
    [InlineData("Coffee")]
    [InlineData("SendTo has default value of None")]
    public async Task CreateCase_WhenCaseTypeDoesntExistOrDestinationIsUnknown_ReturnUnsuccessfulResult(string about)
    {
        // Arrange
        var request = new ContactFormRequest { About = about };
        _referenceDataService.Setup(x => x.GetContactUsCaseTypes()).ReturnsAsync(new CaseTypes
        {
            Children =
            [
                new()
                {
                    Question = "Accommodation",
                    SendTo = ContactUsSendTo.Salesforce,
                    SalesforceCategory = "Accommodation/Destination"
                }
            ]
        });
        // Act
        var res = await _sut.CreateCase(request);

        // Assert
        res.IsSuccessful.Should().BeFalse();
    }

    [Theory]
    [InlineData("Accommodation", true, "Past Accommodation/Destination")]
    [InlineData("Accommodation", false, "Future Accommodation/Destination")]
    public async Task GetCaseType_WhenCaseTypeExistsInFutureAndPostBooking_ReturnProperCategory(string about,
        bool isPastHoliday, string expectedSalesforceCategory)
    {
        // Arrange
        var request = new ContactFormRequest { About = about, IsPastHoliday = isPastHoliday };
        _referenceDataService.Setup(x => x.GetContactUsCaseTypes()).ReturnsAsync(new CaseTypes
        {
            Children =
            [
                new()
                {
                    Question = "Accommodation",
                    SendTo = ContactUsSendTo.Salesforce,
                    SalesforceCategory = "Past Accommodation/Destination",
                    State = "Past"
                },

                new()
                {
                    Question = "Accommodation",
                    SendTo = ContactUsSendTo.Salesforce,
                    SalesforceCategory = "Future Accommodation/Destination",
                    State = "Future"
                }
            ]
        });
        // Act
        var caseType = await _sut.GetCaseType(request);

        // Assert
        caseType.Should().NotBeNull();
        caseType?.SalesforceCategory.Should().Be(expectedSalesforceCategory);
    }
}