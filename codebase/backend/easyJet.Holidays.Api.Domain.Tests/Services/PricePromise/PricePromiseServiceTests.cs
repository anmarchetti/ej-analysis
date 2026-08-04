using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PrisePromise;
using easyJet.Holidays.Api.Domain.Interfaces.Notification;
using easyJet.Holidays.Api.Domain.Interfaces.PricePromise;
using easyJet.Holidays.Api.Domain.Services.PricePromise;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.PricePromise
{
    public class PricePromiseServiceTests
    {
        private IFixture _fixture;

        public PricePromiseServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
        }

        [Fact]
        public async Task Create_CallServices_WithCorrectArgs()
        {
            // Arrange
            var repMock = _fixture.Freeze<Mock<IPricePromiseRepository>>();
            repMock.Setup(x => x.Create(It.IsAny<PricePromiseModel>())).ReturnsAsync(new[] {
                new PriceAttachment {
                    FileName= "file-name-012345.txt",
                    FilePath = "s3://bucket-name/file-name-012345.txt"
                }
            });

            var notifMock = _fixture.Freeze<Mock<INotificationRepository>>();
            notifMock.Setup(x => x.Send(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync("result-id");

            _fixture.Inject(Options.Create(ApiSettings()));
            _fixture.Inject(Options.Create(new AwsSettings
            {
                S3 = new AwsSettingsS3
                {
                    Buckets = new AwsSettingsS3Buckets
                    {
                        PricePromise = "price-promise-bucket"
                    }
                },
                SNS = new AwsSettingsSNS
                {
                    Topics = new AwsSettingsSNSTopics
                    {
                        PricePromise = "topic-id"
                    }
                }
            }));


            var sut = _fixture.Freeze<PricePromiseService>();
            var model = new PricePromiseModel
            {
                Name = "test item",
                BookingReference = "TST01",
                DepartureDate = new DateTimeOffset(2020, 05, 5, 2, 0, 0, TimeSpan.Zero),
                DifferentCompany = true,
                SameDatesOfTravel = true,
                SameFlights = false,
                SamePartyComposition = true,
                SameRoomType = false,
                InclusiveOfTransfers = true,
                InclusiveOn23kg = false,
                BookedWithinLast24h = true,
                Link = "https://test-link",
                Screenshots = new[] { new FormFile(new MemoryStream(Encoding.ASCII.GetBytes("file content")), 0, 10, "file-name", "input.txt") }
            };

            // Act
            var result = await sut.Create(model);

            // Assert
            result.Should().Be("result-id");
            repMock.Verify(mock => mock.Create(It.IsAny<PricePromiseModel>()), Times.Once());
            notifMock.Verify(mock => mock.Send(
                    "topic-id",
                    "New Price Promise request",
                    It.Is<string>(m =>
                        m.Contains("Name: test item\nBooking Reference: TST01\nMarket Code: -\nDeparture Date: 2020-05-05\nDifferent Company: True\nSame dates of travel: True\nSame flights: False\nSame party composition: True\nSame room type and board basis: False\nInclusive on 23kg bag: False\nBookedWithinLast24h: True\nInclusive of transfers: True\nLink to Holiday in Question: https://test-link \n\nScreen of holiday in question: ")
                        && m.Contains("https://xxx.cloudfront.net/file-name-012345.txt?Expires="))
                ), Times.Once());
        }

        [Fact]
        public async Task Create_CallServices_WithCorrectArgs_And_Unescaped_Screenshot_Filename()
        {
            // Arrange
            var repMock = _fixture.Freeze<Mock<IPricePromiseRepository>>();
            repMock.Setup(x => x.Create(It.IsAny<PricePromiseModel>())).ReturnsAsync(new[] {
                new PriceAttachment {
                    FileName= "file-name-012345   (1).txt",
                    FilePath = "s3://bucket-name/file-name-012345   (1).txt"
                }
            });

            var notifMock = _fixture.Freeze<Mock<INotificationRepository>>();
            notifMock.Setup(x => x.Send(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync("result-id");

            _fixture.Inject(Options.Create(ApiSettings()));
            _fixture.Inject(Options.Create(new AwsSettings
            {
                S3 = new AwsSettingsS3
                {
                    Buckets = new AwsSettingsS3Buckets
                    {
                        PricePromise = "price-promise-bucket"
                    }
                },
                SNS = new AwsSettingsSNS
                {
                    Topics = new AwsSettingsSNSTopics
                    {
                        PricePromise = "topic-id"
                    }
                }
            }));


            var sut = _fixture.Freeze<PricePromiseService>();
            var model = new PricePromiseModel
            {
                Name = "test item",
                BookingReference = "TST01",
                DepartureDate = new DateTimeOffset(2020, 05, 5, 2, 0, 0, TimeSpan.Zero),
                DifferentCompany = true,
                SameDatesOfTravel = true,
                SameFlights = false,
                SamePartyComposition = true,
                SameRoomType = false,
                InclusiveOfTransfers = true,
                InclusiveOn23kg = false,
                BookedWithinLast24h = true,
                Link = "https://test-link",
                Screenshots = new[] { new FormFile(new MemoryStream(Encoding.ASCII.GetBytes("file content")), 0, 10, "file-name", "input.txt") }
            };


            // Act
            var result = await sut.Create(model);

            // Assert
            result.Should().Be("result-id");
            repMock.Verify(mock => mock.Create(It.IsAny<PricePromiseModel>()), Times.Once());
            notifMock.Verify(mock => mock.Send(
                    "topic-id",
                    "New Price Promise request",
                    It.Is<string>(m =>
                        m.Contains("Name: test item\nBooking Reference: TST01\nMarket Code: -\nDeparture Date: 2020-05-05\nDifferent Company: True\nSame dates of travel: True\nSame flights: False\nSame party composition: True\nSame room type and board basis: False\nInclusive on 23kg bag: False\nBookedWithinLast24h: True\nInclusive of transfers: True\nLink to Holiday in Question: https://test-link \n\nScreen of holiday in question: ")
                        && m.Contains("https://xxx.cloudfront.net/file-name-012345%20%20%20(1).txt?Expires="))
                ), Times.Once());
        }

        private ApiSettings ApiSettings()
        {
            return new ApiSettings
            {
                PricePromise = new PricePromiseSettings
                {
                    Subject = "New Price Promise request",
                    BodyTemplate = "Name: {Name}\nBooking Reference: {BookingReference}\nMarket Code: {MarketCode}\nDeparture Date: {DepartureDate}\nDifferent Company: {DifferentCompany}\nSame dates of travel: {SameDatesOfTravel}\nSame flights: {SameFlights}\nSame party composition: {SamePartyComposition}\nSame room type and board basis: {SameRoomType}\nInclusive on 23kg bag: {InclusiveOn23kg}\nBookedWithinLast24h: {BookedWithinLast24h}\nInclusive of transfers: {InclusiveOfTransfers}\nLink to Holiday in Question: {Link} \n\nScreen of holiday in question: {Screen}",
                    CloudFront = new CloudFrontSettings
                    {
                        BaseUrl = "https://xxx.cloudfront.net",
                        ExpirationDays = 970,
                        KeyPairId = "keypairId",
                        PrivateKey = Base64Helper.Encode("-----BEGIN RSA PRIVATE KEY-----\r\nMIIEpQIBAAKCAQEAwTsej3FNhpD7FzNyLlN7FXM9iu/cRv7EUy+YAJBlKibSGdg4\r\nQJ5JbCwu+P8VUfUY9gC5Byaze5tx88299bkK1+oyVar2/b5LDeBJHOK+1ylaYlPV\r\npaEij5TO1J0WfmkEsiTevHS1UJCA2kIBna4TqkhYnO15d2kD8ZU1kPKS7pegc+pD\r\nsNfb5WKLO0qSre2lA3O8MsRVPMqeHqYe3kqCwQUP7eAKLnx7Fi5CCXdxioa1GalT\r\nRwaU7+75nDUlmLK/iftZcSH5msz2/BP+yg7fCe1i2ccfQEaWhTaw7fEFNnQAkoAe\r\nQsnOYn93zXRYI7XI1xX/mY4NlhyC7URnWf+puwIDAQABAoIBAQCHHhLxlPX0Cf86\r\nKwRFtqRTzICVXcJ3doDL9nTguBe1kO3LmrFDJiwLUx4JiT1cUPoCU2EOyhYpcfoN\r\n1KlnYNxfPOmzk9ggeOc8rcASTc/K3qTQKvUzW2iyZAj5DVuES2U4OKXzu9xpmJIx\r\njIRawTYJFYu5OCl+wVU7oe2SDL2HzhFTX+OZhpBhAwTWUUqF8EJtLbNw6HcT9YoD\r\nkhkRe/SHZdI7z0ilSAmRNG8w9tDsJwMfcKXcyjk2c+LQYb+DkBIXfNZlitKuoh/H\r\na97flBtjoqid96nYKfEsNYgiz6kPCxRv9AmTLJ2Qlz0F0xRKwV6fIOv8KaDJ9/nC\r\n0n64gp2pAoGBAO7RhHm473bZntFeud6c68zPZ/o0Lz+SJNU+cY+Lnruk4FPqwZ1h\r\nBY8dka8T43cuq56/+zxplvpDBWdaNjM91Nj3iQYuKcZTTEYa9+P+NC/T/aPzbao9\r\naqYUcbP71mBJqndfu+eIGv5P0I5gl4t+mHcAdUiB7mj/36+qV3lhZj0lAoGBAM8h\r\n/F8UR4GfMxl2Xr8kg/lBKtG/8zq5Js3nHWbApC4wyzeamm5dE7eBArAlJQwcrQtJ\r\nfKH8zVi+Nl6IjtZZdh24xLvg2hEjqwscUIeee6bWn8FPPvwo4sIUXo6dpxO9lqSJ\r\ngEsicLwItoLg55SFZdfzIZsGz6xuo14V+55KBEVfAoGBAKTyXy53ViXffvsbEwO3\r\nnIG0SxucCXo95WTHoUXE6FiwMySiwyGBDobfpGypLvV1baHS9aKvR1EJE2VkAIV5\r\n0lYc+i4jmkTZ6ZeOLuLxA3h5Ufl4O6lWjB+zhSkL6vBMUQnsPGtZLVOzKtf7zQ/S\r\n21luHpN68oDhIc1BuPMkG6plAoGBALeRVhlpXono7h91wThDA1cGQw2KwOPdLR+z\r\n4GGs/pQVGDSaJp0CjjPF+PzknnWigFWNdhAVfGNWh9a1zWj39e8XTft3pask4jRB\r\njrjyYoGUmhZ2xcox7ey0oqxf2a9sCTKezX1I84IhcqaA7Zu5sW12AuViXvBhSRVc\r\nBBffXvOfAoGAE+VHAVWKywtY8qTmakE6vfmOyKHMbhOqFyE5YB0I/L+FLTyzhUxE\r\n+O4FF+11Xry49HeY2YN0s4KCePFrapscHHZjh9fWRCqDhgBH7sFbC0oxh0CWucie\r\n3yCFAeg6A52YTtYOKQ2jJIVlIMOloaSoLs8IaWQWjnoWEfLm6+dXBGE=\r\n-----END RSA PRIVATE KEY-----")
                    }
                }
            };
        }
    }
}
