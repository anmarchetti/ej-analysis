using AutoFixture;
using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.ContactUs;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers;

#pragma warning disable CA1001 // Types that own disposable fields should be disposable
public class ContactUsControllerTests
#pragma warning restore CA1001 // Types that own disposable fields should be disposable
{
    private readonly IFixture _fixture;

    private readonly ContactUsController _sut;

    private readonly Mock<IContactUsService> _contactUsServiceMock;
    private readonly Mock<ICaptchaService> _captchaService;
    private readonly Mock<IMarketService> _marketService;

    public ContactUsControllerTests()
    {
        _fixture = FixtureUtils.AutoMoqFixture();

        _contactUsServiceMock = new Mock<IContactUsService>();
        _captchaService = new Mock<ICaptchaService>();
        _marketService = new Mock<IMarketService>();

        _fixture.Inject(Options.Create(new ContactUsSettings { RequestFormEnableRecaptcha = false }));

        _sut = new ContactUsController(_contactUsServiceMock.Object, _fixture.Create<IOptions<ContactUsSettings>>(), _captchaService.Object, _marketService.Object);
    }
    [Theory]
    [InlineAutoData("", "", "", false)]
    [InlineAutoData("Valid about", "", "", true)]
    [InlineAutoData("Valid about", "2023-08-03", "", true)]
    [InlineAutoData("Valid about", "2023-08-03", "053284", false)]

    public async Task FormValidationTest_ShouldReturnValidationErrors(string about, string depart, string booking, bool isPastHoliday)
    {
        // Arrange
        _marketService.Setup(y => y.GetCurrentMarket()).Returns(new MarketSettings { Code = "UK" });

        var request = new ContactFormRequest()
        {
            About = about,
            DepartureAndReturnDate = depart,
            BookingReference = booking,
            IsPastHoliday = isPastHoliday
        };

        // Act
        var response = await _sut.CreateCase(request) as ObjectResult;

        // Assert
        response!.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
    }
}
