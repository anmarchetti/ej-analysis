using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Models.Request;
using easyJet.Foundation.BeCause.Models.Response;
using easyJet.Foundation.BeCause.Services;
using easyJet.Foundation.BeCause.Services.Api;
using easyJet.Foundation.BeCause.Settings;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using NSubstitute.ReturnsExtensions;
using Xunit;

namespace easyJet.Foundation.BeCause.Tests.Services
{
    public class CertificationDataServiceTests
    {
        private readonly CertificationDataService sut;
        private readonly IMasterDataService dataService;
        private readonly IBeCauseLogger logger;
        private readonly ISettingsService settingsService;

        public CertificationDataServiceTests()
        {
            dataService = Substitute.For<IMasterDataService>();
            logger = Substitute.For<IBeCauseLogger>();
            settingsService = Substitute.For<ISettingsService>();
            sut = new CertificationDataService(dataService, logger, settingsService);
        }

        [Fact]
        public void GetCertifiedHotelIds_ShouldReturnNull_IfSettingsAreNull()
        {
            // Arrange
            settingsService.GetSettings().ReturnsNull();

            // Act
            var result = sut.GetCertifiedHotelIds();

            // Assert
            result.codes.Should().BeNullOrEmpty();
        }

        [Fact]
        public void GetCertifiedHotelIds_ShouldReturnNull_IfFeatureIsDisabled()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = false
            });

            // Act
            var result = sut.GetCertifiedHotelIds();

            // Assert
            result.codes.Should().BeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void GetCertifiedHotelIds_ShouldReturnNull_IfCertificatesAreNotConfigured()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true
            });

            // Act
            var result = sut.GetCertifiedHotelIds();

            // Assert
            result.codes.Should().BeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetCertifiedHotelIds_ShouldReturnNull_IfSelectedResultFieldNamesAreEmpty(Guid certificate, string endpoint)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                Certificates = new HashSet<string> { certificate.ToString("D") },
                Endpoint = endpoint
            });

            dataService.GetCompaniesSearchResultAsync(Arg.Any<CompaniesSearchRequest>()).ReturnsNullForAnyArgs();

            // Act
            var result = sut.GetCertifiedHotelIds();

            // Assert
            result.codes.Should().BeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetCertifiedHotelIds_ShouldReturnNull_IfDataServiceReturnsNull(Guid certificate, string[] fieldNames, string endpoint)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                Certificates = new HashSet<string> { certificate.ToString("D") },
                SelectedResultFieldNames = new HashSet<string>(fieldNames),
                Endpoint = endpoint
            });

            dataService.GetCompaniesSearchResultAsync(Arg.Any<CompaniesSearchRequest>()).ReturnsNullForAnyArgs();

            // Act
            var result = sut.GetCertifiedHotelIds();

            // Assert
            result.codes.Should().BeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetCertifiedHotelIds_ShouldReturnNull_IfDataServiceThrowsError(Guid certificate, string endpoint, string[] fieldNames)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                Certificates = new HashSet<string> { certificate.ToString("D") },
                SelectedResultFieldNames = new HashSet<string>(fieldNames),
                Endpoint = endpoint
            });

            dataService.GetCompaniesSearchResultAsync(Arg.Any<CompaniesSearchRequest>()).ThrowsForAnyArgs(new Exception());

            // Act
            var result = sut.GetCertifiedHotelIds();

            // Assert
            result.codes.Should().BeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetCertifiedHotelIds_ShouldReturnNull_IfDataServiceReturnsEmpty(Guid certificate, string endpoint, string[] fieldNames)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                Certificates = new HashSet<string> { certificate.ToString("D") },
                SelectedResultFieldNames = new HashSet<string>(fieldNames),
                Endpoint = endpoint
            });
            var response = CreateCompaniesSearchResponse();
            response.Companies = new Company[] { };

            dataService.GetCompaniesSearchResultAsync(Arg.Any<CompaniesSearchRequest>()).Returns(response);

            // Act
            var result = sut.GetCertifiedHotelIds();

            // Assert
            result.codes.Should().BeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetCertifiedHotelIds_ShouldReturnNull_IfCertificateIsInvalidGuid(string certificate, string endpoint)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                Certificates = new HashSet<string> { certificate },
                Endpoint = endpoint,
                SelectedResultFieldNames = new HashSet<string> { "Name" }
            });
            var response = CreateCompaniesSearchResponse();

            dataService.GetCompaniesSearchResultAsync(Arg.Any<CompaniesSearchRequest>()).Returns(response);

            // Act
            var result = sut.GetCertifiedHotelIds();

            // Assert
            result.codes.Should().BeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetCertifiedHotelIds_ShouldReturnData(Guid certificate, string endpoint)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                Certificates = new HashSet<string> { certificate.ToString("D") },
                Endpoint = endpoint,
                SelectedResultFieldNames = new HashSet<string> { "Name" }
            });
            var response = CreateCompaniesSearchResponse();

            dataService.GetCompaniesSearchResultAsync(Arg.Any<CompaniesSearchRequest>()).Returns(response);

            // Act
            var result = sut.GetCertifiedHotelIds();

            // Assert
            result.codes.Should().NotBeNullOrEmpty();
            result.codes.Should().HaveCount(1);
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
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