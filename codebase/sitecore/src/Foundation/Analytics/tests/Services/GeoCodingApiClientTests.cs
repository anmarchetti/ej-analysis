using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using AutoFixture.Xunit2;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Models.Geolocation;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.SitecoreExtensions.Utils;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using RichardSzalay.MockHttp;
using Sitecore.Configuration;
using Xunit;

namespace easyJet.Foundation.Analytics.Tests.Services
{
    public class GeoCodingApiClientTests
    {
        private const string BaseEndpoint = "https://maps.googleapis.com/maps/api/geocode/json";
        private readonly GeoCodingApiClient sut;
        private readonly IAnalyticsLogger logger;
        private readonly MockHttpMessageHandler httpMessageHandler;

        public GeoCodingApiClientTests()
        {
            logger = Substitute.For<IAnalyticsLogger>();
            httpMessageHandler = new MockHttpMessageHandler();
            using (new SettingsSwitcher("GoogleMaps.BaseEndpoint", BaseEndpoint))
            {
                sut = new GeoCodingApiClient(logger, httpMessageHandler);
            }
        }

        [Theory]
        [AutoData]
        public void GetPostalTown_ShouldLogError_IfStatusCodeIsNotOk(string apiKey, string lat, string lon)
        {
            // Arrange
            var endpoint = GetEndPoint(apiKey, lat, lon);
            var mockResponse = new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.BadRequest,
                Content = new StringContent(string.Empty)
            };
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { "GoogleMaps.ApiKey", apiKey } }))
            {
                httpMessageHandler.When(endpoint).Respond(req => mockResponse);
                var result = sut.GetPostalTown(lat, lon);

                result.Should().BeNull();
                logger.Received(3).Debug(Arg.Any<string>(), sut);
                logger.Received().Error($"Could not get response from google for request: {endpoint}. Status code: BadRequest.", sut);
            }
        }

        [Theory]
        [AutoData]
        public void GetPostalTown_ShouldLogError_IfResponseIsNull(string apiKey, string lat, string lon)
        {
            // Arrange
            var endpoint = GetEndPoint(apiKey, lat, lon);
            var mockResponse = new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.BadRequest,
                Content = null
            };
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { "GoogleMaps.ApiKey", apiKey } }))
            {
                httpMessageHandler.When(endpoint).Respond(req => mockResponse);
                var result = sut.GetPostalTown(lat, lon);

                result.Should().BeNull();
                logger.Received(3).Debug(Arg.Any<string>(), sut);
                logger.Received().Error($"Could not get response from google for request: {endpoint}. Status code: BadRequest.", sut);
                logger.Received().Error("Couldn't process/receive response form google.", Arg.Any<NullReferenceException>(), sut);
            }
        }

        [Theory]
        [AutoData]
        public void GetPostalTown_ShouldLogError_IfErrorIsThrown(string apiUrl, string apiKey, string lat, string lon)
        {
            // Arrange
            using (new SettingsSwitcher("GoogleMaps.BaseEndpoint", apiUrl))
            {
                var client = new GeoCodingApiClient(logger);
                using (new SecretsManagerSwitcher(new Dictionary<string, string> { { "GoogleMaps.ApiKey", apiKey } }))
                {
                    var result = client.GetPostalTown(lat, lon);

                    result.Should().BeNull();
                    logger.Received(3).Debug(Arg.Any<string>(), client);
                    logger.Received().Error($"Couldn't process/receive response form google.", Arg.Any<InvalidOperationException>(), client);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetPostalTown_ShouldReturnData(string apiKey, string lat, string lon, string longName, string shortName)
        {
            // Arrange
            var endpoint = GetEndPoint(apiKey, lat, lon);
            var responseData = new GeoApiResponse
            {
                Locations = new[]
                {
                    new Address
                    {
                        AddressComponents = new[]
                        {
                            new Location
                            {
                                Longname = longName,
                                Shortname = shortName,
                                Types = new List<string>
                                {
                                    "postal_town"
                                }
                            }
                        }
                    }
                }
            };
            var responseString = JsonConvert.SerializeObject(responseData);
            var mockResponse = new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(responseString)
            };
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { "GoogleMaps.ApiKey", apiKey } }))
            {
                httpMessageHandler.When(endpoint).Respond(req => mockResponse);
                var result = sut.GetPostalTown(lat, lon);

                result.Should().NotBeNullOrEmpty();
                result.Should().Be(longName);
                logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), sut);
                logger.DidNotReceive().Error(Arg.Any<string>(), sut);
                logger.Received().Debug($"[GoogleMaps] Google maps request for: {lat} {lon}", sut);
                logger.Received().Debug($"[GoogleMaps] Raw result of google maps request for: {lat} {lon} is {responseString}", sut);
                logger.Received().Debug($"[GoogleMaps] Result of google maps request for: {lat} {lon} is {longName}", sut);
            }
        }

        private string GetEndPoint(string apiKey, string latitude, string longitude)
        {
            return $"{BaseEndpoint}?latlng={latitude},{longitude}&key={apiKey}&result_type=postal_town";
        }
    }
}