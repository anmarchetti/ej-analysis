using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Utils;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Models.Domain;
using easyJet.Foundation.TripAdvisor.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Xunit;

namespace easyJet.Foundation.TripAdvisor.Tests.Services
{
    public class MasterDataServiceTests
    {
        private readonly ITripAdvisorLogger logger;
        private readonly ICustomCacheRepository customCache;

        public MasterDataServiceTests()
        {
            logger = Substitute.For<ITripAdvisorLogger>();
            customCache = Substitute.For<ICustomCacheRepository>();
        }

        [Theory]
        [AutoData]
        public void GetLocation_ShouldGetLocationFromCache_IfCacheHasData(Uri endpoint, string locationId, Location expected)
        {
            // Arrange
            using (new SettingsSwitcher("TripAdvisor.Endpoint", endpoint.ToString()))
            using (new SecretsManagerDisabler())
            {
                var service = Substitute.ForPartsOf<MasterDataService>(logger, customCache);
                customCache.GetItem<Location>(Arg.Any<string>()).Returns(expected);

                // Act
                var actual = service.GetLocation(locationId);

                // Assert
                actual.Name.Should().Be(expected.Name);
                actual.NumberOfReviews.Should().Be(expected.NumberOfReviews);
                actual.Rating.Should().Be(expected.Rating);
            }
        }

        [Theory]
        [AutoData]
        public void GetLocation_ShouldReturnNull_WhenGetResponseReturnsNull(Uri endpoint, string locationId)
        {
            // Arrange
            using (new SettingsSwitcher("TripAdvisor.Endpoint", endpoint.ToString()))
            using (new SecretsManagerDisabler())
            {
                var service = Substitute.ForPartsOf<MasterDataService>(logger, customCache);
                customCache.GetItem<Location>(Arg.Any<string>()).Returns((Location)null);
                service.GetResponse<Location>(Arg.Any<string>()).Returns((Location)null);

                // Act
                var actual = service.GetLocation(locationId);

                // Assert
                actual.Should().BeNull();
                customCache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<Location>());
            }
        }

        [Theory]
        [AutoData]
        public void GetLocation_ShouldGetLocationFromExternalCall_IfCacheHasNoData(Uri endpoint, string locationId, Location expected)
        {
            // Arrange
            expected.Error = null;
            using (new SettingsSwitcher("TripAdvisor.Endpoint", endpoint.ToString()))
            using (new SecretsManagerDisabler())
            {
                var service = Substitute.ForPartsOf<MasterDataService>(logger, customCache);
                customCache.GetItem<Location>(Arg.Any<string>()).Returns((Location)null);
                service.GetResponse<Location>(Arg.Any<string>()).Returns(expected);
                customCache.StoreItem(Arg.Any<string>(), Arg.Is<Location>(x => x.Name == expected.Name)).Returns(expected);

                // Act
                var actual = service.GetLocation(locationId);

                // Assert
                actual.Name.Should().Be(expected.Name);
                actual.NumberOfReviews.Should().Be(expected.NumberOfReviews);
                actual.Rating.Should().Be(expected.Rating);
                customCache.Received().StoreItem(Arg.Any<string>(), Arg.Is<Location>(x => x.Name == expected.Name));
            }
        }

        [Theory]
        [AutoData]
        public void GetLocationByCoordinatesAndHotelName_ShouldGetLocationFromCache_IfCacheHasData(Uri endpoint, string latitude, string longitude, string name, MappedLocation expected)
        {
            // Arrange
            using (new SettingsSwitcher("TripAdvisor.Endpoint", endpoint.ToString()))
            using (new SecretsManagerDisabler())
            {
                var service = Substitute.ForPartsOf<MasterDataService>(logger, customCache);

                customCache
                    .GetItem<MappedLocations>(Arg.Any<string>())
                    .Returns(new MappedLocations() { Locations = new List<MappedLocation> { expected } });

                // Act
                var actual = service.GetLocationByCoordinatesAndHotelName(latitude, longitude, name);

                // Assert
                actual.Name.Should().Be(expected.Name);
                actual.Distance.Should().Be(expected.Distance);
            }
        }

        [Theory]
        [AutoData]
        public void GetLocationByCoordinatesAndHotelName_ShouldGetLocationFromExternalCall_IfCacheHasNoData(Uri endpoint, string latitude, string longitude, string name, MappedLocation expected)
        {
            // Arrange
            expected.Error = null;
            using (new SettingsSwitcher("TripAdvisor.Endpoint", endpoint.ToString()))
            using (new SecretsManagerDisabler())
            {
                var service = Substitute.ForPartsOf<MasterDataService>(logger, customCache);
                customCache.GetItem<MappedLocations>(Arg.Any<string>()).Returns((MappedLocations)null);
                var locations = new MappedLocations()
                {
                    Locations = new List<MappedLocation> { expected }
                };
                service.GetResponse<MappedLocations>(Arg.Any<string>()).Returns(locations);
                customCache.StoreItem(
                    Arg.Any<string>(),
                    Arg.Is<MappedLocations>(x => x.Locations.FirstOrDefault().Name == expected.Name))
                    .Returns(locations);

                // Act
                var actual = service.GetLocationByCoordinatesAndHotelName(latitude, longitude, name);

                // Assert
                actual.Name.Should().Be(expected.Name);
                actual.Distance.Should().Be(expected.Distance);
                customCache.Received().StoreItem(
                    Arg.Any<string>(),
                    Arg.Is<MappedLocations>(x => x.Locations.FirstOrDefault().Name == expected.Name));
            }
        }

        [Theory]
        [AutoData]
        public void GetLocationByCoordinatesAndHotelName_ShouldReturnNullAndNotCache_WhenResponseIsNull(Uri endpoint, string latitude, string longitude, string name)
        {
            // Arrange
            using (new SettingsSwitcher("TripAdvisor.Endpoint", endpoint.ToString()))
            using (new SecretsManagerDisabler())
            {
                var service = Substitute.ForPartsOf<MasterDataService>(logger, customCache);
                customCache.GetItem<MappedLocations>(Arg.Any<string>()).Returns((MappedLocations)null);
                service.GetResponse<MappedLocations>(Arg.Any<string>()).Returns((MappedLocations)null);

                // Act
                var actual = service.GetLocationByCoordinatesAndHotelName(latitude, longitude, name);

                // Assert
                actual.Should().BeNull();
                customCache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<MappedLocations>());
            }
        }

        [Fact]
        public void GetResponse_ShouldReturnNull_WhenBaseAddressIsNull()
        {
            using (new SettingsSwitcher("TripAdvisor.Endpoint", "not-a-valid-uri"))
            using (new SecretsManagerDisabler())
            {
                var service = new MasterDataService(logger, customCache);

                var result = service.GetResponse<Location>("location/123")
                    .ConfigureAwait(false).GetAwaiter().GetResult();

                result.Should().BeNull();
                logger.Received(1).Warn(
                    Arg.Is<string>(s => s.Contains("BaseAddress is not set")), Arg.Any<object>());
            }
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void GetResponse_ShouldThrow_WhenPathIsNullOrEmpty(string path)
        {
            using (new SettingsSwitcher("TripAdvisor.Endpoint", "https://api.tripadvisor.com/api/partner/2.0/"))
            using (new SecretsManagerDisabler())
            {
                var service = new MasterDataService(logger, customCache);

                Action act = () => service.GetResponse<Location>(path)
                    .ConfigureAwait(false).GetAwaiter().GetResult();

                act.Should().Throw<ArgumentException>();
            }
        }

        [Fact]
        public void GetResponse_ShouldDeserializeResponse_WhenStatusIsSuccess()
        {
            var json = @"{ ""location_id"": ""282538"", ""name"": ""Test Hotel"", ""rating"": 4.5, ""num_reviews"": 100 }";
            var handler = new MockHttpMessageHandler(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json)
            });

            using (new SettingsSwitcher("TripAdvisor.Endpoint", "https://api.tripadvisor.com/api/partner/2.0/"))
            using (new SecretsManagerDisabler())
            {
                var service = new MasterDataService(logger, customCache);
                SetHttpClient(service, new HttpClient(handler)
                {
                    BaseAddress = new Uri("https://api.tripadvisor.com/api/partner/2.0/")
                });

                var result = service.GetResponse<Location>("location/282538?key=abc")
                    .ConfigureAwait(false).GetAwaiter().GetResult();

                result.Should().NotBeNull();
                result.LocationId.Should().Be("282538");
                result.Name.Should().Be("Test Hotel");
                result.Rating.Should().Be(4.5f);
                result.NumberOfReviews.Should().Be(100);
                logger.Received(1).Debug(Arg.Is<string>(s => s.StartsWith("Request:")), Arg.Any<object>());
                logger.Received(1).Debug(Arg.Is<string>(s => s.StartsWith("Response:")), Arg.Any<object>());
            }
        }

        [Fact]
        public void GetResponse_ShouldDeserializeErrorAndLogWarning_WhenStatusIsError()
        {
            var json = @"{ ""error"": { ""code"": ""160"", ""type"": ""UnauthorizedException"", ""message"": ""invalid key"" } }";
            var handler = new MockHttpMessageHandler(new HttpResponseMessage(HttpStatusCode.Forbidden)
            {
                Content = new StringContent(json)
            });

            using (new SettingsSwitcher("TripAdvisor.Endpoint", "https://api.tripadvisor.com/api/partner/2.0/"))
            using (new SecretsManagerDisabler())
            {
                var service = new MasterDataService(logger, customCache);
                SetHttpClient(service, new HttpClient(handler)
                {
                    BaseAddress = new Uri("https://api.tripadvisor.com/api/partner/2.0/")
                });

                var result = service.GetResponse<Location>("location/282538?key=bad")
                    .ConfigureAwait(false).GetAwaiter().GetResult();

                result.Should().NotBeNull();
                result.Error.Should().NotBeNull();
                result.Error.Code.Should().Be("160");
                result.Error.Type.Should().Be("UnauthorizedException");
                logger.Received(1).Warn(
                    Arg.Is<string>(s => s.Contains("received error")), Arg.Any<object>());
            }
        }

        [Fact]
        public void GetResponse_ShouldReturnNullAndLogError_WhenHttpRequestExceptionThrown()
        {
            var handler = new MockHttpMessageHandler(_ => throw new HttpRequestException("Connection refused"));

            using (new SettingsSwitcher("TripAdvisor.Endpoint", "https://api.tripadvisor.com/api/partner/2.0/"))
            using (new SecretsManagerDisabler())
            {
                var service = new MasterDataService(logger, customCache);
                SetHttpClient(service, new HttpClient(handler)
                {
                    BaseAddress = new Uri("https://api.tripadvisor.com/api/partner/2.0/")
                });

                var result = service.GetResponse<Location>("location/282538?key=abc")
                    .ConfigureAwait(false).GetAwaiter().GetResult();

                result.Should().BeNull();
                logger.Received(1).Error(
                    Arg.Is<string>(s => s.Contains("request failed") && s.Contains("Connection refused")),
                    Arg.Any<HttpRequestException>(),
                    Arg.Any<object>());
            }
        }

        [Theory]
        [InlineData("https://api.tripadvisor.com/api/partner/2.0")]
        [InlineData("https://api.tripadvisor.com/api/partner/2.0/")]
        public void Constructor_ShouldEnsureBaseAddressEndsWithTrailingSlash(string endpoint)
        {
            using (new SettingsSwitcher("TripAdvisor.Endpoint", endpoint))
            using (new SecretsManagerDisabler())
            {
                var service = new MasterDataService(logger, customCache);
                var httpClient = (HttpClient)typeof(MasterDataService)
                    .GetField("httpClient", BindingFlags.NonPublic | BindingFlags.Instance)
                    .GetValue(service);

                httpClient.BaseAddress.ToString().Should().EndWith("/");
            }
        }

        [Fact]
        public void GetResponse_ShouldPreserveVersionSegment_WhenEndpointHasNoTrailingSlash()
        {
            Uri capturedUri = null;
            var handler = new MockHttpMessageHandler(request =>
            {
                capturedUri = request.RequestUri;
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(@"{ ""location_id"": ""123"" }")
                };
            });

            using (new SettingsSwitcher("TripAdvisor.Endpoint", "https://api.tripadvisor.com/api/partner/2.0"))
            using (new SecretsManagerDisabler())
            {
                var service = new MasterDataService(logger, customCache);
                var baseAddress = ((HttpClient)typeof(MasterDataService)
                    .GetField("httpClient", BindingFlags.NonPublic | BindingFlags.Instance)
                    .GetValue(service)).BaseAddress;

                SetHttpClient(service, new HttpClient(handler) { BaseAddress = baseAddress });

                service.GetResponse<Location>("location/282538?key=abc")
                    .ConfigureAwait(false).GetAwaiter().GetResult();

                capturedUri.Should().NotBeNull();
                capturedUri.AbsolutePath.Should().Contain("/2.0/");
            }
        }

        private static void SetHttpClient(MasterDataService service, HttpClient client)
        {
            typeof(MasterDataService)
                .GetField("httpClient", BindingFlags.NonPublic | BindingFlags.Instance)
                .SetValue(service, client);
        }

        private class MockHttpMessageHandler : HttpMessageHandler
        {
            private readonly Func<HttpRequestMessage, HttpResponseMessage> handler;

            public MockHttpMessageHandler(HttpResponseMessage response)
            {
                handler = _ => response;
            }

            public MockHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
            {
                this.handler = handler;
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                return Task.FromResult(handler(request));
            }
        }
    }
}
