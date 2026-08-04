using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using AutoFixture;
using easyJet.Feature.Tracker.Models.Dflo;
using easyJet.Feature.Tracker.Services;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using NSubstitute.Extensions;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Services
{
    public class DfloServiceTests
    {
        private readonly Fixture fixture;
        private readonly DfloService sut;

        public DfloServiceTests()
        {
            fixture = new Fixture();
            sut = Substitute.ForPartsOf<DfloService>();
        }

        [Fact]
        public async void GetEmailBodyByIdAsync_OnExceptionDuringRequest_ReturnsIdWithEmptyBody()
        {
            // Arrange
            var settingsMock = new DfloSettings
            {
                Endpoint = "anyValidEndpoint",
                Account = "someAccountName",
                Password = "thePasswordForThisAccount",
                SkipSslVerification = false
            };
            var emailID = Guid.NewGuid().ToString();

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetSettings(default)).DoNotCallBase();
            sut.Configure().GetSettings(default).ReturnsForAnyArgs(settingsMock);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromException<HttpResponseMessage>(new Exception()));

            // Act
            (string Id, string Body) result = await sut.GetEmailBodyByIdAsync(emailID);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().BeEquivalentTo(emailID);
            result.Body.Should().NotBeNull();
            result.Body.Should().BeEmpty();
        }

        [Fact]
        public async void GetEmailBodyByIdAsync_OnUnsuccessfulRequest_ReturnsIdWithEmptyBody()
        {
            // Arrange
            var settingsMock = new DfloSettings
            {
                Endpoint = "anyValidEndpoint",
                Account = "someAccountName",
                Password = "thePasswordForThisAccount",
                SkipSslVerification = false
            };
            var emailID = Guid.NewGuid().ToString();

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetSettings(default)).DoNotCallBase();
            sut.Configure().GetSettings(default).ReturnsForAnyArgs(settingsMock);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.InternalServerError)));

            // Act
            (string Id, string Body) result = await sut.GetEmailBodyByIdAsync(emailID);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().BeEquivalentTo(emailID);
            result.Body.Should().NotBeNull();
            result.Body.Should().BeEmpty();
        }

        [Theory]
        [MemberData(nameof(DfloServiceTestsData.InvalidDfloSettings), MemberType = typeof(DfloServiceTestsData))]
        public async void GetEmailBodyByIdAsync_WithInvalidSettings_ReturnsIdWithEmptyBody(DfloSettings invalidSettings)
        {
            // Arrange
            var emailID = Guid.NewGuid().ToString();
            var mailBody = fixture.Create<string>();

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetSettings(default)).DoNotCallBase();
            sut.Configure().GetSettings(default).ReturnsForAnyArgs(invalidSettings);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(mailBody)
                }));

            // Act
            (string Id, string Body) result = await sut.GetEmailBodyByIdAsync(emailID);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().BeEquivalentTo(emailID);
            result.Body.Should().NotBeNull();
            result.Body.Should().NotBe(mailBody);
            result.Body.Should().BeEmpty();
        }

        [Fact]
        public async void GetEmailBodyByIdAsync_WithValidSettingsAndSuccessfulRequest_ReturnsIdWithBody()
        {
            // Arrange
            var settingsMock = new DfloSettings
            {
                Endpoint = "anyValidEndpoint",
                Account = "someAccountName",
                Password = "thePasswordForThisAccount",
                SkipSslVerification = false
            };
            var emailID = Guid.NewGuid().ToString();
            var mailBody = fixture.Create<string>();

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetSettings(default)).DoNotCallBase();
            sut.Configure().GetSettings(default).ReturnsForAnyArgs(settingsMock);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(mailBody)
                }));

            // Act
            (string Id, string Body) result = await sut.GetEmailBodyByIdAsync(emailID);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().BeEquivalentTo(emailID);
            result.Body.Should().NotBeNullOrEmpty();
            result.Body.Should().BeEquivalentTo(mailBody);
        }

        [Fact]
        public async void GetEmailsByEmailAsync_OnExceptionDuringRequest_ReturnsResultWithEmptyLists()
        {
            // Arrange
            var settingsMock = new DfloSettings
            {
                Endpoint = "anyValidEndpoint",
                Account = "someAccountName",
                Password = "thePasswordForThisAccount",
                SkipSslVerification = false
            };
            var email = "test@te.st";

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetSettings(default)).DoNotCallBase();
            sut.Configure().GetSettings(default).ReturnsForAnyArgs(settingsMock);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromException<HttpResponseMessage>(new Exception()));

            // Act
            var result = await sut.GetEmailsByEmailAsync(new[] { email });

            // Assert
            result.Should().NotBeNull();
            result.Should().ContainKey(email);
            result[email].Should().NotBeNull();
            result[email].Should().BeEmpty();
        }

        [Fact]
        public async void GetEmailsByEmailAsync_OnUnsuccessfulRequests_ReturnsResultWithEmptyLists()
        {
            // Arrange
            var settingsMock = new DfloSettings
            {
                Endpoint = "anyValidEndpoint",
                Account = "someAccountName",
                Password = "thePasswordForThisAccount",
                SkipSslVerification = false
            };
            var email = "test@te.st";

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetSettings(default)).DoNotCallBase();
            sut.Configure().GetSettings(default).ReturnsForAnyArgs(settingsMock);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.InternalServerError)));

            // Act
            var result = await sut.GetEmailsByEmailAsync(new[] { email });

            // Assert
            result.Should().NotBeNull();
            result.Should().ContainKey(email);
            result[email].Should().NotBeNull();
            result[email].Should().BeEmpty();
        }

        [Theory]
        [MemberData(nameof(DfloServiceTestsData.InvalidDfloSettings), MemberType = typeof(DfloServiceTestsData))]
        public async void GetEmailsByEmailAsync_WithInvalidSettings_ReturnsEmptyResult(DfloSettings invalidSettings)
        {
            // Arrange
            var email = "test@te.st";

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetSettings(default)).DoNotCallBase();
            sut.Configure().GetSettings(default).ReturnsForAnyArgs(invalidSettings);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(new List<Document>()
                    {
                        fixture.Create<Document>(), fixture.Create<Document>(), fixture.Create<Document>()
                    }))
                }));

            // Act
            var result = await sut.GetEmailsByEmailAsync(new[] { email });

            // Assert
            result.Should().NotBeNull();
            result.Should().NotContainKey(email);
        }

        [Fact]
        public async void GetEmailsByEmailAsync_WithValidSettingsAndSuccessfulRequests_ReturnsEmailsForEmail()
        {
            // Arrange
            var settingsMock = new DfloSettings
            {
                Endpoint = "anyValidEndpoint",
                Account = "someAccountName",
                Password = "thePasswordForThisAccount",
                SkipSslVerification = false
            };
            var email = "test@te.st";

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetSettings(default)).DoNotCallBase();
            sut.Configure().GetSettings(default).ReturnsForAnyArgs(settingsMock);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(new List<Document>()
                    {
                        fixture.Create<Document>(), fixture.Create<Document>(), fixture.Create<Document>()
                    }))
                }));

            // Act
            var result = await sut.GetEmailsByEmailAsync(new[] { email });

            // Assert
            result.Should().NotBeNull();
            result.Should().ContainKey(email);
            result[email].Should().NotBeNullOrEmpty();
        }
    }
}
