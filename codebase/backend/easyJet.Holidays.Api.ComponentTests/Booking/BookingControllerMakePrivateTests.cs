using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using WireMock.Matchers;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Settings;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Booking
{
    /// <summary>
    /// Component tests for <see cref="BookingController"/>
    /// </summary>
    public class BookingControllerMakePrivateTests : BaseComponentTest
    {
        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/make-private")]
        [Theory]
        [InlineAutoData("/api/v1.0/booking/make-private", "VALID_REF", "Johnson", "2020-01-01", true)]
        public async Task Error_Change_Privacy_Without_Owner_Cookies(string apiUrl, string bookingReference, string lastName, string date, bool isPrivate)
        {
            // Arrange 
            var body = JsonConvert.SerializeObject(new
            {
                bookingReference,
                lastName,
                date,
                isPrivate
            });

            var message = new HttpRequestMessage(HttpMethod.Post, apiUrl);
            message.Content = new StringContent(body, Encoding.UTF8, "application/json");

            // Act            
            var response = await Client.SendAsync(message);

            // Assert  
            await response.AssertErrorResponse(ApiExceptionCodes.BookingCannotSetPrivacy, HttpStatusCode.BadRequest, "Can not change a booking privacy. Only booking owner can do this.");
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/make-private")]
        [Theory]
        [InlineAutoData("/api/v1.0/booking/make-private", "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;", "VALID_REF", "Johnson", "2020-01-01", true)]
        public async Task Success_Change_Privacy_With_Owner_Cookies(string apiUrl, string cookie, string bookingReference, string lastName, string date, bool isPrivate)
        {
            // Arrange 
            var atcomServer = SpawnServer("AtcomWiremockServer",
                new WireMockServerSettings
                {
                    FileSystemHandler = new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, "Atcom"),
                    StartAdminInterface = true,
                    ReadStaticMappings = true,
                    WatchStaticMappings = true,
                    WatchStaticMappingsInSubdirectories = true,
                });
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:Memo_Cd>PRVC</p1:Memo_Cd>"))
                    .UsingPost()

            )
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("<p2:ModifyMemoResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyMemoResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:09.584+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa0rAAm</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079763</p1:BkgId></p1:BkgNum><p1:Memo><p1:Memo_Dt>2020-06-07T01:00:09.000+01:00</p1:Memo_Dt><p1:Memo_Cd>PRVC</p1:Memo_Cd><p1:Memo_Name>Customer Credit</p1:Memo_Name><p1:Memo_Des>False</p1:Memo_Des><p1:Memo_User_Name>EZYVRP</p1:Memo_User_Name><p1:Memo_User_Desc>easyJet Holidays VRP User</p1:Memo_User_Desc><p1:Memo_Key>1267062</p1:Memo_Key><p1:Memo_Rights>READ</p1:Memo_Rights><p1:Memo_Rights>WRITE</p1:Memo_Rights><p1:Memo_Rights>DELETE</p1:Memo_Rights><p1:Memo_Seq>24</p1:Memo_Seq><p1:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" /></p1:Memo></p2:ModifyMemoResponse>")
            );

            ApplyManyConfigurationFields(new[]
            {
                new KeyValuePair<string, string>("Atcom:Search:Host", atcomServer.Url),
                new KeyValuePair<string, string>("Atcom:Booking:Host", atcomServer.Url)
            });


            var body = JsonConvert.SerializeObject(new
            {
                bookingReference,
                lastName,
                date,
                isPrivate
            });

            var message = new HttpRequestMessage(HttpMethod.Post, apiUrl);
            message.Headers.Add(HeaderNames.Cookie, cookie);
            message.Content = new StringContent(body, Encoding.UTF8, "application/json");

            // Act            
            var response = await Client.SendAsync(message);

            // Assert  
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}