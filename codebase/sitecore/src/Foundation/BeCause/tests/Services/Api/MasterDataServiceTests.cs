using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoFixture.Xunit2;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Models.Request;
using easyJet.Foundation.BeCause.Models.Response;
using easyJet.Foundation.BeCause.Services.Api;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using NSubstitute.ReturnsExtensions;
using Xunit;

namespace easyJet.Foundation.BeCause.Tests.Services.Api
{
    public class MasterDataServiceTests
    {
        private readonly IEndpointService endpointService;
        private readonly IClientService clientService;
        private readonly IBeCauseLogger logger;
        private readonly MasterDataService sut;

        public MasterDataServiceTests()
        {
            endpointService = Substitute.For<IEndpointService>();
            clientService = Substitute.For<IClientService>();
            logger = Substitute.For<IBeCauseLogger>();
            sut = new MasterDataService(endpointService, clientService, logger);
        }

        [Fact]
        public void GetStandardsSearchResultAsync_ShouldThrowException_IfRequestIsNull()
        {
            // Arrange
            // Act
            // Assert
            Assert.ThrowsAsync<ArgumentNullException>(() => sut.GetStandardsSearchResultAsync(null));
        }

        [Theory]
        [AutoData]
        public async Task GetStandardsSearchResultAsync_ShouldReturnNull_IfCorrelationIdIsNull(string url)
        {
            // Arrange
            endpointService.GetStatusEndpoint.Returns(url);
            var request = CreateStandardsSearchRequest();
            clientService.GetResultAsync(url, Arg.Any<string>()).ReturnsForAnyArgs(string.Empty);

            // Act
            var result = await sut.GetStandardsSearchResultAsync(request);

            // Assert
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetStandardsSearchResultAsync_ShouldReturnNull_IfGetStatusIsNull(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetStandardsSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateStandardsSearchRequest();
            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(string.Empty);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(correlationId);

            // Act
            var result = await sut.GetStandardsSearchResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetStandardsSearchResultAsync_ShouldReturnNull_IfGetStatusHasIncorrectFormat(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetStandardsSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateStandardsSearchRequest();
            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(" ");
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(correlationId);

            // Act
            var result = await sut.GetStandardsSearchResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetStandardsSearchResultAsync_ShouldReturnNull_IfGetStatusIsError(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetStandardsSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateStandardsSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Error);
            status.Result = null;

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(correlationId);

            // Act
            var result = await sut.GetStandardsSearchResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetStandardsSearchResultAsync_ShouldReturnNull_IfGetStatusIsCancelled(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetStandardsSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateStandardsSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Cancelled);
            status.Result = null;

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(correlationId);

            // Act
            var result = await sut.GetStandardsSearchResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetStandardsSearchResultAsync_ShouldReturnNull_IfResultIsNull(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetStandardsSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateStandardsSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Success);

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(correlationId);
            clientService.GetDataAsync(status.Result.ResultUrl).ReturnsNull();

            // Act
            var result = await sut.GetStandardsSearchResultAsync(request);

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetStandardsSearchResultAsync_ShouldReturnNull_IfResultIsIncorrect(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetStandardsSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateStandardsSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Success);

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(correlationId);
            clientService.GetDataAsync(status.Result.ResultUrl).Returns(" ");

            // Act
            var result = await sut.GetStandardsSearchResultAsync(request);

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetStandardsSearchResultAsync_ShouldReturnNull_IfExceptionIsThrown(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetStandardsSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateStandardsSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Success);

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(correlationId);
            clientService.GetDataAsync(status.Result.ResultUrl).ThrowsForAnyArgs(new Exception());

            // Act
            var result = await sut.GetStandardsSearchResultAsync(request);

            // Assert
            result.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetStandardsSearchResultAsync_ShouldReturnData(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetStandardsSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateStandardsSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Success);
            var data = CreateStandardsSearchResponse();

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(correlationId);
            clientService.GetDataAsync(status.Result.ResultUrl).Returns(JsonConvert.SerializeObject(data));

            // Act
            var result = await sut.GetStandardsSearchResultAsync(request);

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            result.Should().NotBeNull();
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Certifications.Should().NotBeEmpty();
            result.Awards.Should().NotBeEmpty();
            result.Commitments.Should().NotBeEmpty();
        }

        [Fact]
        public void GetCompaniesSearchResultAsync_ShouldThrowException_IfRequestIsNull()
        {
            // Arrange
            // Act
            // Assert
            Assert.ThrowsAsync<ArgumentNullException>(() => sut.GetCompaniesSearchResultAsync(null));
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfCorrelationIdIsNull(string url)
        {
            // Arrange
            endpointService.GetStatusEndpoint.Returns(url);
            var request = CreateCompaniesSearchRequest();
            clientService.GetResultAsync(url, Arg.Any<string>()).ReturnsForAnyArgs(string.Empty);

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfCorrelationIdIsNull2(string url)
        {
            // Arrange
            endpointService.GetStatusEndpoint.Returns(url);
            var request = CreateCompaniesSearchRequest();
            var createTaskResponse = new CreateTaskResponse();
            clientService.GetResultAsync(url, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfGetStatusIsNull(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateCompaniesSearchRequest();
            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(string.Empty);
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfCreateTaskResponseIsIncorrect(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateCompaniesSearchRequest();
            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(string.Empty);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(correlationId);

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfGetStatusHasIncorrectFormat(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateCompaniesSearchRequest();
            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(" ");
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfGetStatusIsError(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateCompaniesSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Error);
            status.Result = null;

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfGetStatusIsCancelled(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateCompaniesSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Cancelled);
            status.Result = null;

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfResultIsNull(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateCompaniesSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Success);

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));
            clientService.GetDataAsync(status.Result.ResultUrl).ReturnsNull();

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfResultIsIncorrect(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateCompaniesSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Success);

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));
            clientService.GetDataAsync(status.Result.ResultUrl).Returns(" ");

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            result.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfExceptionIsThrown(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateCompaniesSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Success);

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));
            clientService.GetDataAsync(status.Result.ResultUrl).ThrowsForAnyArgs(new Exception());

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            result.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnData(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            var request = CreateCompaniesSearchRequest();
            var status = CreateStatusResponse(ApiStatus.Success);
            var data = CreateCompaniesSearchResponse();

            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(status));
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));
            clientService.GetDataAsync(status.Result.ResultUrl).Returns(JsonConvert.SerializeObject(data));

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            result.Should().NotBeNull();
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Companies.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnDataWithPolling(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            endpointService.GetPollingDelay.Returns(TimeSpan.FromSeconds(1));

            var request = CreateCompaniesSearchRequest();
            var statusSuccess = CreateStatusResponse(ApiStatus.Success);
            var statusPending = CreateStatusResponse(ApiStatus.Pending);
            var data = CreateCompaniesSearchResponse();
            clientService.GetStatusAsync(Arg.Any<string>()).ReturnsForAnyArgs(x => JsonConvert.SerializeObject(statusPending), x => JsonConvert.SerializeObject(statusSuccess));
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));
            clientService.GetDataAsync(statusSuccess.Result.ResultUrl).Returns(JsonConvert.SerializeObject(data));

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            result.Should().NotBeNull();
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            result.Companies.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]
        public async Task GetCompaniesSearchResultAsync_ShouldReturnNull_IfStatusThrowsError(string resultUrl, string statusUrl, string correlationId)
        {
            // Arrange
            endpointService.GetCompaniesSearchEndpoint.Returns(resultUrl);
            endpointService.GetStatusEndpoint.Returns(statusUrl);
            endpointService.GetPollingDelay.Returns(TimeSpan.FromSeconds(1));

            var request = CreateCompaniesSearchRequest();
            var statusSuccess = CreateStatusResponse(ApiStatus.Success);
            var data = CreateCompaniesSearchResponse();
            clientService.GetStatusAsync(Arg.Any<string>()).ThrowsForAnyArgs(new Exception());
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(resultUrl, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));
            clientService.GetDataAsync(statusSuccess.Result.ResultUrl).Returns(JsonConvert.SerializeObject(data));

            // Act
            var result = await sut.GetCompaniesSearchResultAsync(request);

            // Assert
            result.Should().BeNull();
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void GetHotelMappingResultAsync_ShouldThrowException_IfRequestIsNull()
        {
            // Arrange
            // Act
            // Assert
            Assert.ThrowsAsync<ArgumentNullException>(() => sut.GetHotelMappingResultAsync(null));
        }

        [Theory]
        [AutoData]
        public async Task GetHotelMappingResultAsync_ShouldReturnNull_IfCorrelationIdIsNull(string url)
        {
            // Arrange
            endpointService.GetCompanyMappingsEndpoint.Returns(url);
            var request = CreateHotelMappingRequest();
            clientService.GetResultAsync(url, Arg.Any<string>()).ReturnsForAnyArgs(string.Empty);

            // Act
            await sut.GetHotelMappingResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetHotelMappingResultAsync_ShouldReturnNull_IfCorrelationIdIsNull2(string url)
        {
            // Arrange
            endpointService.GetCompanyMappingsEndpoint.Returns(url);
            var request = CreateHotelMappingRequest();
            var createTaskResponse = new CreateTaskResponse();
            clientService.GetResultAsync(url, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));

            // Act
            await sut.GetHotelMappingResultAsync(request);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetHotelMappingResultAsync_ShouldReturnNull_IfExceptionIsThrown(string url, string correlationId)
        {
            // Arrange
            endpointService.GetCompanyMappingsEndpoint.Returns(url);
            var request = CreateHotelMappingRequest();
            clientService.GetResultAsync(url, Arg.Any<string>()).ThrowsForAnyArgs(new Exception());

            // Act
            await sut.GetHotelMappingResultAsync(request);

            // Assert
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public async Task GetHotelMappingResultAsync_ShouldReturnData(string url, string correlationId)
        {
            // Arrange
            endpointService.GetCompanyMappingsEndpoint.Returns(url);
            var request = CreateHotelMappingRequest();
            var createTaskResponse = CreateTaskResponse(correlationId);
            clientService.GetResultAsync(url, Arg.Any<string>()).ReturnsForAnyArgs(JsonConvert.SerializeObject(createTaskResponse));

            // Act
            await sut.GetHotelMappingResultAsync(request);

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        private CreateTaskResponse CreateTaskResponse(string correlationId)
        {
            return new CreateTaskResponse
            {
                CorrelationId = correlationId
            };
        }

        private HotelMappingRequest CreateHotelMappingRequest()
        {
            return new HotelMappingRequest
            {
                CustomIdentifierId = "c681c7c0-7c83-4287-bd34-6808d8e9f4e6",
                Hotels = new List<HotelMapping>
                {
                    new HotelMapping
                    {
                        City = "Copenhagen",
                        GiataCode = "12345",
                        Latitude = 12.123456m,
                        Longitude = 12.123456m,
                        Name = "BeCause",
                        ThreeLetterCountryCode = "DNK",
                        Region = "Capital/state/etc.",
                        Street = "Njalsgade 21E",
                        ZipCode = "2300"
                    }
                }
            };
        }

        private CompaniesSearchRequest CreateCompaniesSearchRequest()
        {
            return new CompaniesSearchRequest
            {
                Certifications = new[]
                {
                    "Certification1:guid",
                    "Certification2:guid",
                    "Certification3:guid"
                },
                IncludeCompanyAddress = false,
                IncludeExpiredData = false,
                IncludeNonValidatedData = false
            };
        }

        private StandardsSearchResponse CreateStandardsSearchResponse()
        {
            return new StandardsSearchResponse
            {
                Certifications = new Certification[]
                {
                    new Certification
                    {
                        Id = "id",
                        LogoUrl = "url",
                        Name = "name"
                    }
                },
                Awards = new Award[]
                {
                    new Award
                    {
                        Id = "id",
                        LogoUrl = "url",
                        Name = "name"
                    }
                },
                Commitments = new Commitment[]
                {
                    new Commitment
                    {
                        Id = "id",
                        LogoUrl = "url",
                        Name = "name"
                    }
                }
            };
        }

        private StatusResponse CreateStatusResponse(ApiStatus status)
        {
            return new StatusResponse
            {
                Error = new StatusResponseError
                {
                    ErrorUrl = "url"
                },
                Status = status,
                Result = new StatusResponseResult
                {
                    ResultUrl = "url"
                },
                CorrelationId = "id",
                CreatedAtUtc = "date",
                RequestType = RequestType.Other,
                UpdatedAtUtc = "date"
            };
        }

        private StandardsSearchRequest CreateStandardsSearchRequest()
        {
            return new StandardsSearchRequest
            {
                Certifications = new[]
                {
                    "Certification1:guid",
                    "Certification2:guid",
                    "Certification3:guid"
                },
                Awards = new[]
                {
                    "Award1:guid",
                    "Award2:guid",
                    "Award3:guid"
                },
                Commitments = new[]
                {
                    "Commitment1:guid",
                    "Commitment2:guid",
                    "Commitment3:guid"
                }
            };
        }

        private CompaniesSearchResponse CreateCompaniesSearchResponse()
        {
            return new CompaniesSearchResponse
            {
                Companies = new[]
                {
                    new Company
                    {
                        Name = "Name",
                        Id = "Id",
                        Website = "Url",
                        Fields = new CompanyField[]
                        {
                            new CompanyField
                            {
                                Name = "Name",
                                Id = "Id",
                                Value = "Value"
                            }
                        },
                        Certifications = new CompanyCertification[]
                        {
                            new CompanyCertification
                            {
                                Id = "Id",
                                StandardHolderId = "Id",
                                IsValidated = true,
                                ExpiryDateUtc = "date",
                                StandardLevel = "guid",
                                StartDateUtc = "date"
                            }
                        },
                        Address = new CompanyAddress
                        {
                            Region = "region",
                            City = "city",
                            CountryCode = "code",
                            CountryName = "name",
                            Latitude = "lat",
                            Longitude = "lon",
                            StreetAddress = "address",
                            ZipCode = "code"
                        },
                        Awards = new CompanyAward[]
                        {
                            new CompanyAward
                            {
                                ExpiryDateUtc = "date",
                                Id = "id",
                                StandardLevel = "guid",
                                StartDateUtc = "date",
                                IsValidated = true,
                                StandardHolderId = "id"
                            }
                        },
                        Commitments = new CompanyCommitment[]
                        {
                            new CompanyCommitment
                            {
                                Id = "id",
                                StartDateUtc = "date",
                                StandardLevel = "guid",
                                IsValidated = true,
                                StandardHolderId = "id",
                                ExpiryDateUtc = "date"
                            }
                        }
                    }
                }
            };
        }
    }
}