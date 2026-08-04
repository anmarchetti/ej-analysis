using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;
using WireMock.Matchers;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;
using WireMock.Settings;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.AirportParking
{
    public class AirportParkingControllerTests : BaseComponentTest
    {
        [Fact(Skip = "TODO fix in the future, flaky test")]
        public async Task Search_AirportParkingExists_ReturnOkStatusWithAirportParkingResponse()
        {
            // Arrange

            // AtCom

            WireMockServer atcomServer = GetMockServer("Atcom");

            atcomServer.Given(
                    Request.Create()
                        .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                        .WithBody(new RegexMatcher($"AIRPORT_ANCILLARIES_PARKING"))
                        .UsingPost()
                )
                .RespondWith(
                    Response.Create()
                        .WithStatusCode(200)
                        .WithBody(
                            "<ns1:ItemSearchResponse xmlns:ns1=\"AtComRes/ItemSearchResponse\" xmlns:p2=\"AtComRes/Common\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"AtComRes/ItemSearchResponse ../api/ItemSearchResponse/ItemSearchResponse.xsd\">\n\t<!-- Response returned from: EZYCON.EJH.ATCOM -->\n\t<p2:Adm Xsd_Ver=\"TE3.22.15.2\">\n\t\t<p2:ReqId>12133</p2:ReqId>\n\t\t<p2:Tm>2024-10-31T07:35:21.74472+00:00</p2:Tm>\n\t\t<p2:Trk From=\"atcomres\" To=\"atcomres\" />\n\t</p2:Adm>\n\t<p2:CltInfo>\n\t\t<p2:Locale>en_EN</p2:Locale>\n\t\t<p2:CltSysContext>3</p2:CltSysContext>\n\t\t<p2:Agt_No>WAGBP</p2:Agt_No>\n\t\t<p2:TermCode>ABCD</p2:TermCode>\n\t\t<p2:User_Name>EZYVRP</p2:User_Name>\n\t\t<p2:Chan>inhouse</p2:Chan>\n\t\t<p2:Channel_Type>VRP</p2:Channel_Type>\n\t\t<p2:User_Role>INTERNAL</p2:User_Role>\n\t</p2:CltInfo>\n\t<p2:Offer_Ctl>\n\t\t<p2:Sort>\n\t\t\t<p2:Sort_Dir>ascending</p2:Sort_Dir>\n\t\t\t<p2:Order>RANKING</p2:Order>\n\t\t</p2:Sort>\n\t\t<p2:Sort>\n\t\t\t<p2:Sort_Dir>ascending</p2:Sort_Dir>\n\t\t\t<p2:Order>HOTELNAME</p2:Order>\n\t\t</p2:Sort>\n\t</p2:Offer_Ctl>\n\t<p2:Offers>\n\t\t" +
                            "<p2:Item_Set Set_Type=\"AIRPORT_PARKING\">\n\t\t\t" +
                            "<p2:Item Code=\"LTM9\" Name=\"Javi Extras Meet and Greet\">\n\t\t\t\t" +
                            "<p2:St_Dt>2024-11-30</p2:St_Dt>\n\t\t\t\t" +
                            "<p2:End_Dt>2024-12-08</p2:End_Dt>\n\t\t\t\t" +
                            "<p2:Desc>Holiday Extras Meet and Greet</p2:Desc>\n\t\t\t\t" +
                            "<p2:Item_Type Code=\"AIRPORT_PARKING\">" +
                            "</p2:Item_Type>\n\t\t\t\t" +
                            "<p2:CarPark>\n\t\t\t\t\t<p2:Start_Time>04:00:00</p2:Start_Time>\n\t\t\t\t\t<p2:End_Time>18:55:00</p2:End_Time>\n\t\t\t\t\t<p2:Type>MEET_AND_GREET</p2:Type>\n\t\t\t\t</p2:CarPark>\n\t\t\t\t" +
                            "<p2:Prom Code=\"AUCI\" Issue=\"1\" Name=\"Common Items\" />\n\t\t\t\t<p2:Avl State=\"AVAILABLE\" />\n\t\t\t\t<p2:Ser_Sts>FIX</p2:Ser_Sts>\n\t\t\t\t<p2:Ser_Sts>OPTION</p2:Ser_Sts>\n\t\t\t\t<p2:Ser_Sts>QUOTE</p2:Ser_Sts>\n\t\t\t\t<p2:Adt_Prc>73.99</p2:Adt_Prc>\n\t\t\t\t<p2:Tot_Prc>73.99</p2:Tot_Prc>\n\t\t\t\t<p2:Corporate_Cd>HEXTRAS_LTM9</p2:Corporate_Cd>\n\t\t\t\t<p2:Item_InvState>EXTERNAL</p2:Item_InvState>\n\t\t\t\t<p2:SrcData>\n\t\t\t\t\t<p2:System>holidayextras</p2:System>\n\t\t\t\t\t<p2:KeyValuePair Key=\"KeyData\">\n\t\t\t\t\t\t<![CDATA[<KeyData><BookingURL>/sandbox/v1/carpark/HPLTM9</BookingURL><Ticket><AvailabilityList><Availability Code=\"LTM9\" Name=\"Holiday Extras Meet and Greet\"><AirportTransfer TravelDuration=\"\" Frequency=\"\" Price=\"\"/><Prices TotalPrice=\"73.99\"/><Raw><Filter><meet_and_greet>1</meet_and_greet><car_parked_for_you>1</car_parked_for_you><lead_time>120</lead_time></Filter>\n        </Raw>\n      </Availability>\n    </AvailabilityList>\n  </Ticket></KeyData>\n]]>\n</p2:KeyValuePair>\n<p2:KeyValuePair Key=\"TotalPrice\">73.99</p2:KeyValuePair>\n</p2:SrcData>\n</p2:Item>\n</p2:Item_Set>\n</p2:Offers>\n</ns1:ItemSearchResponse>")
                );

            ApplyManyConfigurationFields(new[]
            {
                new KeyValuePair<string, string>("Atcom:Search:Host", atcomServer.Url),
                new KeyValuePair<string, string>("Atcom:Booking:Host", atcomServer.Url)
            });

            // Holiday Extras

            WireMockServer holidayExtrasServer = GetMockServer("HolidayExtras");

            holidayExtrasServer.Given(
                    Request.Create()
                        .WithUrl("*/v1/product/*")
                        .UsingGet()
                )
                .RespondWith(
                    Response.Create()
                        .WithStatusCode(200)
                        .WithBody(
                            "{\"API_Reply\":{\"Product\":[{\"name\":\"Summer Special \",\"tripappcarparkname\":\"Summer Special \",\"tripappimages\":\"/imageLibrary/Images/Gatwick-Summer-Special-South.jpg;/imageLibrary/Images/83917-gatwick-summer-special-1.png;/imageLibrary/Images/83917-gatwick-summer-special-2.png;/imageLibrary/Images/83917-gatwick-summer-special-3.png;/imageLibrary/Images/83917-gatwick-summer-special-4.png;/imageLibrary/Images/83917-gatwick-summer-special-5.png;/imageLibrary/Images/83917-gatwick-summer-special-6.png;/imageLibrary/Images/83917-gatwick-summer-special-7.png;/imageLibrary/Images/83917-gatwick-summer-special-8.png;/imageLibrary/Images/83917-gatwick-summer-special-9.png\",\"tripappcarparksellpoint\":\"Budget parking, 10 minutes from the airport\",\"tripapptransfertip\":\"run every 15-20 minutes, take 10 minutes and are included in the price\",\"key\":\"mytestkey\",\"v\":1,\"format\":\"js\",\"version\":\"lite\"}}}}")
                );

            ApplyManyConfigurationFields(new[]
            {
                new KeyValuePair<string, string>("HolidayExtras:Host", holidayExtrasServer.Url + "/v1/product")
            });

            // Mock Offer object
            var fixture = new Fixture();
            var mockRequest = fixture.Create<AirportParkingSearchRequest>();
            
            // Act

            var response = await Client.PostAsJsonAsync(new Uri(Client.BaseAddress + "api/v1/airport-parking/search"),
                mockRequest);

            // Assert
            var airportParkingResponse = await response.Content.ReadFromJsonAsync<AirportParkingResponse>();

            response.StatusCode.Should().Be(HttpStatusCode.OK);

            Assert.NotNull(airportParkingResponse);
        }

        private WireMockServer GetMockServer(string name)
        {
            WireMockServer server = SpawnServer($"{name}WiremockServer",
                new WireMockServerSettings
                {
                    FileSystemHandler = new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, name),
                    StartAdminInterface = true,
                    ReadStaticMappings = true,
                    WatchStaticMappings = true,
                    WatchStaticMappingsInSubdirectories = true,
                });
            return server;
        }
    }
}