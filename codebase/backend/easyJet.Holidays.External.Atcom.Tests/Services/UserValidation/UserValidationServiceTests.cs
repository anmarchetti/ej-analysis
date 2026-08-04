using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Atcom.Mappers.UserValidation;
using easyJet.Holidays.External.Atcom.Services.UserValidation;
using easyJet.Holidays.External.Domain.Api;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.UserValidation;


public class UserValidationServiceTests
{
    private readonly Mock<IUserValidationMapper> _mockUserValidationMapper;
    private readonly Mock<IApiService> _mockApiService;
    private readonly UserValidationService _service;

    public UserValidationServiceTests()
    {
        _mockUserValidationMapper = new Mock<IUserValidationMapper>();
        _mockApiService = new Mock<IApiService>();
        _service = new UserValidationService(_mockUserValidationMapper.Object, _mockApiService.Object);
    }

    [Fact]
    public async Task IsUserValid_ShouldReturnTrue_WhenUserIsValid()
    {
        var userValidationRequest = new easyJet.Holidays.Api.Domain.Data.Authentication.UserValidationRequest();
        var userValidationResponse = new Models.UserValidation.UserValidationResponse();

        _mockUserValidationMapper
            .Setup(m => m.CreateRequest(userValidationRequest))
            .ReturnsAsync(new Models.UserValidation.UserValidationRequest());

        _mockApiService
            .Setup(s => s.GetResponseContentAsyncCustomErrorHandling<Models.UserValidation.UserValidationRequest, Models.UserValidation.UserValidationResponse>(
                It.IsAny<Models.UserValidation.UserValidationRequest>()))
            .ReturnsAsync(userValidationResponse);

        var result = await _service.IsUserValid(userValidationRequest);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task IsUserValid_ShouldReturnFalse_WhenUserHasErrors()
    {
        var userValidationRequest = new easyJet.Holidays.Api.Domain.Data.Authentication.UserValidationRequest();
        var userValidationResponseMock = new Mock<Models.UserValidation.UserValidationResponse>();

        userValidationResponseMock
            .SetupGet(r => r.ApiErrors)
            .Returns(new[]
            {
                new ApiError { Code = "ERR001", Message = "Some error" }
            });

        _mockUserValidationMapper
            .Setup(m => m.CreateRequest(userValidationRequest))
            .ReturnsAsync(new Models.UserValidation.UserValidationRequest());

        _mockApiService
            .Setup(s => s.GetResponseContentAsyncCustomErrorHandling<Models.UserValidation.UserValidationRequest, Models.UserValidation.UserValidationResponse>(
                It.IsAny<Models.UserValidation.UserValidationRequest>()))
            .ReturnsAsync(userValidationResponseMock.Object);

        var result = await _service.IsUserValid(userValidationRequest);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task IsUserValid_ShouldReturnFalse_WhenApiThrowsException()
    {
        var userValidationRequest = new easyJet.Holidays.Api.Domain.Data.Authentication.UserValidationRequest();

        _mockUserValidationMapper
            .Setup(m => m.CreateRequest(userValidationRequest))
            .ReturnsAsync(new Models.UserValidation.UserValidationRequest());

        _mockApiService
            .Setup(s => s.GetResponseContentAsyncCustomErrorHandling<Models.UserValidation.UserValidationRequest, Models.UserValidation.UserValidationResponse>(
                It.IsAny<Models.UserValidation.UserValidationRequest>()))
#pragma warning disable CA2201
            .ThrowsAsync(new Exception());
#pragma warning restore CA2201

        var result = await _service.IsUserValid(userValidationRequest);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task IsUserValid_ShouldThrowArgumentNullException_WhenRequestIsNull()
    {
        Func<Task> act = async () => await _service.IsUserValid(null);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }
}
