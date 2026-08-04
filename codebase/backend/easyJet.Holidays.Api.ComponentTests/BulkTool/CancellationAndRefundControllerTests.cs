using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using FluentAssertions.Execution;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using WireMock.Matchers;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Settings;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.BulkTool
{
    /// <summary>
    /// Component tests for <see cref="CancellationAndRefundController"/>
    /// </summary>
    public class CancellationAndRefundControllerTests : BaseComponentTest
    {
        [Trait("Api", "/api/v1.0/cancellationandrefund/cancelandrefund")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineData("email@email.com", "add credit", "refund", "simple text for memo", "1000")]
        public async Task CancelAndRefund_ShouldSuccessfullyPassAddCreditCommand_IfDataValid(string email, string flag, string reason, string memo, string amount)
        {
            // Arrange
            var request = new BulkToolRequest()
            {
                Booking = new Domain.Data.BulkToolBooking.Booking()
                {
                    Email = email,
                    Flag = flag,
                    Reason = reason,
                    Memo = memo,
                    Amount = amount
                }
            };

            HttpContent content = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");

            // Mock create voucherify customer

            var voucherifyServer = SpawnServer("VoucherifyMockServer",
                new WireMockServerSettings
                {
                    FileSystemHandler =
                        new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, "voucherify"),
                    StartAdminInterface = true,
                    ReadStaticMappings = true,
                    WatchStaticMappings = true,
                    WatchStaticMappingsInSubdirectories = true
                });

            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithParam("email", request.Booking.Email)
                    .WithParam("limit", "1")
                    .UsingGet()
            )
            .InScenario("Get customer")
            .WillSetStateTo("Customer is not created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBodyAsJson(new { })
            );


            // Mock get creating customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithBody(new JsonMatcher(new { name = "email@email.com", email = request.Booking.Email, metadata = new Dictionary<string, string>() { { "lang", "eng" } } }))
                    .UsingPost()
            )
            .InScenario("Get customer")
            .WhenStateIs("Customer is not created")
            .WillSetStateTo("Customer created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"source_id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"name\":\"Oleg\",\"email\":\"email@email.com\",\"description\":\"Premium user, ACME Inc.\",\"address\":{\"city\":\"Melbourne\",\"state\":\"FL\",\"line_1\":\"226 E Fee Ave\",\"line_2\":null,\"country\":\"Australia\",\"postal_code\":\"32901\"},\"summary\":{\"redemptions\":{\"total_redeemed\":0,\"total_failed\":0,\"total_succeeded\":0,\"total_rolled_back\":0,\"total_rollback_failed\":0,\"total_rollback_succeeded\":0,\"gift\":{\"redeemed_amount\":0,\"amount_to_go\":0}},\"orders\":{\"total_amount\":0,\"total_count\":0,\"average_amount\":0,\"last_order_amount\":0,\"last_order_date\":null}},\"loyalty\":{\"points\":0,\"referred_customers\":0},\"metadata\":{\"lang\":\"en\"},\"created_at\":\"2016-11-15T15:41:44Z\",\"object\":\"customer\"}")
            );


            // Mock get customer
            // Customer Response
            string recivedCustomerResponse = "{" +
                "\"object\":\"list\"," +
                "\"has_more\":false," +
                "\"total\":1," +
                "\"data_ref\":\"customers\"," +
                "\"customers\":" +
                    "[{\"object\":\"customer\"," +
                        "\"id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\"," +
                        "\"source_id\":null," +
                        "\"name\":\" \"," +
                        "\"description\":null," +
                        $"\"email\":\"{email}\"," +
                        "\"metadata\":" +
                        "{" +
                            "\"lang\":\"end\"" +
                        "}," +
                        "\"created_at\":\"2020-06-07T14:15:16.073Z\"," +
                        "\"address\":" +
                        "{" +
                            "\"city\":null," +
                            "\"state\":null," +
                            "\"line_1\":null," +
                            "\"line_2\":null," +
                            "\"country\":null," +
                            "\"postal_code\":null" +
                        "}," +
                        "\"summary\":" +
                        "{" +
                            "\"redemptions\":" +
                            "{" +
                                "\"total_redeemed\":0," +
                                "\"total_failed\":0," +
                                "\"total_succeeded\":0," +
                                "\"total_rolled_back\":0," +
                                "\"total_rollback_failed\":0," +
                                "\"total_rollback_succeeded\":0" +
                            "}," +
                            "\"orders\":" +
                            "{" +
                                "\"total_amount\":0," +
                                "\"total_count\":0," +
                                "\"average_amount\":0," +
                                "\"last_order_amount\":0," +
                                "\"last_order_date\":null" +
                            "}" +
                         "}," +
                         "\"loyalty\":" +
                         "{" +
                            "\"points\":0," +
                            "\"referred_customers\":0," +
                            "\"campaigns\":{}" +
                         "}," +
                         "\"updated_at\":null," +
                         "\"phone\":null," +
                         "\"birthday\":null" +
                         "}" +
                    "]" +
            "}";


            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithParam("email", request.Booking.Email)
                    .WithParam("limit", "1")
                    .UsingGet()
            )
            .InScenario("Get customer")
            .WhenStateIs("Customer created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody(recivedCustomerResponse)
            );


            // Mock creating voucher
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/bulk-tool-*")
                    .WithBody(new JmesPathMatcher(
                        "type == 'GIFT_VOUCHER'",
                        "campaign == 'easyJet-credit'",
                        "category == 'ej Holidays'",
                        $"metadata.currency == 'GBP'",
                        $"metadata.source == 'Bulk Tool'",
                        $"metadata.action == 'add credit'",
                        $"metadata.memo == '{memo}'",
                        $"metadata.reason == '{reason}'"
                        ))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WillSetStateTo("Voucher is created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"v_30XK8y8H438FXJk7ag54sMuJzhzpvSkI\",\"code\":\"bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":12000,\"balance\":12000},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"publish\":{\"object\":\"list\",\"count\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/redemptions?page=1&limit=10\"},\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1067166\"},\"is_referral_code\":false,\"updated_at\":null,\"object\":\"voucher\"}")
            );


            // Add amount to voucher
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JsonMatcher(new { amount = int.Parse(request.Booking.Amount) }))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher is created")
            .WillSetStateTo("Voucher ready to publish")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("")
            );


            // Mock pusblish voucher
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/vouchers/publish")
                    .WithBody(new JmesPathMatcher("customer.id == 'cust_ZJwRsO3KEQaeizIkeNk7ZqPo'"))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher ready to publish")
            .WillSetStateTo("Voucher is published")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"pub_a78ylda8fw6JpM7pqBU6g6QdWnwjyWcq\",\"object\":\"publication\",\"created_at\":\"2020-06-07T00:00:09.367Z\",\"customer_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"tracking_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"metadata\":{},\"channel\":\"API\",\"result\":\"SUCCESS\",\"customer\":{\"object\":\"customer\",\"id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\"},\"voucher\":{\"id\":\"v_w2FrJM04dw34Nx50flsGwweHJf0PxNKS\",\"code\":\"bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1000,\"balance\":1000},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00.000Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1079763\"},\"is_referral_code\":false,\"created_at\":\"2020-06-07T00:00:09.266Z\",\"updated_at\":\"2020-06-07T00:00:09.377Z\",\"holder_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"object\":\"voucher\",\"publish\":{\"object\":\"list\",\"count\":1,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/redemptions?page=1&limit=10\"}}}")
            );

            ApplyConfigurationField("Voucherify:Host", voucherifyServer.Url);

            Client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("yeymtmwg0mzdt80chqveeopojn897s58yciqfhvl508mpq4dmna9w907617q");

            // Act
            var response = await Client.PostAsync($"/api/v1/cancellationandrefund/cancelandrefund", content);

            var responseContent = await response.Content.ReadAsStringAsync();
            var bulkToolResponse = JsonConvert.DeserializeObject<BulkToolResponse>(responseContent);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            bulkToolResponse.CorrelationId.Should().NotBeNull();
            bulkToolResponse.Reference.Should().Be(email);
            bulkToolResponse.Message.Should().Be("Credit successfully added");
        }

        [Trait("Api", "/api/v1.0/cancellationandrefund/cancelandrefund")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineData("1011010", "add credit", "goodwill", "simple text for memo", "1000")]
        public async Task CancelAndRefund_ShouldSuccessfullyPassAddCreditCommand_IfDataValidAndEmailIsBookingReference(string reference, string flag, string reason, string memo, string amount)
        {
            // Arrange
            var request = new BulkToolRequest()
            {
                Booking = new Domain.Data.BulkToolBooking.Booking()
                {
                    Reference = reference,
                    Flag = flag,
                    Reason = reason,
                    Memo = memo,
                    Amount = amount
                }
            };

            var expectedEmail = "email@email.com";

            HttpContent content = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");

            var atcomServer = SpawnServer("AtcomWireMockServer");

            // Get booking
            // Expected booking response
            var bookingDespositAmount = 100;
            var bookingPaymentAmount = 100;

            string expectedBookingResponse = $"<p1:DisplayResponse xmlns:p2=\"AtComRes/Common\" xmlns:p1=\"AtComRes/DisplayResponse\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"AtComRes/DisplayResponse ../api/DisplayResponse/DisplayResponse.xsd\">    <!-- Response returned from: EZYTST.EJH.ATCOM -->" +
                $"    <p2:Adm Xsd_Ver=\"T3.20.4.8\">        <p2:ReqId>12133</p2:ReqId>        <p2:Tm>2020-06-11T10:31:26.135+01:00</p2:Tm>        <p2:Trk From=\"atcomres\" To=\"musyk\" />    </p2:Adm>    <p2:CltInfo>        <p2:Locale>en_EN</p2:Locale>        <p2:CltSysContext>3</p2:CltSysContext>        <p2:Agt_No>WAGBP</p2:Agt_No>" +
                $"        <p2:TermCode>ABCD</p2:TermCode>        <p2:User_Name>EZYVRP</p2:User_Name>        <p2:Chan>inhouse</p2:Chan>        <p2:Channel_Type>VRP</p2:Channel_Type>        <p2:User_Role>INTERNAL</p2:User_Role>    </p2:CltInfo>    <p2:BkgNum>        <p2:BkgId>" + reference + "</p2:BkgId>        <p2:CurrentVersion>4</p2:CurrentVersion>        <p2:AtcomresBkgVersion></p2:AtcomresBkgVersion>    </p2:BkgNum>    <p2:BkgSts>CANCELED</p2:BkgSts>    <p2:ResSts>CONFIRMED</p2:ResSts>    <p2:HasAgt_Notice>false</p2:HasAgt_Notice>    <p2:His>        <p2:Bkg_Dt_Tm>2020-05-26T15:22:01.000+01:00</p2:Bkg_Dt_Tm>        <p2:Bkg_User>EZYVRP</p2:Bkg_User>        <p2:Bkg_Term_Code>ABCD</p2:Bkg_Term_Code>        <p2:Bkg_Chan>inhouse</p2:Bkg_Chan>        <p2:Amd_Dt_Tm>2020-06-03T14:16:56.000+01:00</p2:Amd_Dt_Tm>        <p2:Amd_User>EZYVRP</p2:Amd_User>        <p2:Amd_Term_Code>ABCD</p2:Amd_Term_Code>        <p2:Amd_Chan>inhouse</p2:Amd_Chan>    </p2:His>    <p2:Bkg_Ent>        <p2:Package>            <p2:Accom>                <p2:Id>1</p2:Id>                <p2:St_Dt>2020-08-15</p2:St_Dt>                <p2:End_Dt>2020-08-22</p2:End_Dt>                <p2:HtlPrd>                    <p2:Name>                        <![CDATA[Iberostar Creta Panorama & Mare]]>                    </p2:Name>                    <p2:Prom Code=\"EUBF\" Issue=\"1\" Name=\"easyJet Holidays Beach - Family\" />                    <p2:Acc_Cd Accom_Id=\"2151635610/2\">GRCR0009</p2:Acc_Cd>                    <p2:Acc_InvState>INTERNAL</p2:Acc_InvState>                    <p2:Hotel>                        <p2:Add>                            <p2:Name>                                <![CDATA[Iberostar Creta Panorama & Mare]]>                            </p2:Name>                            <p2:Street>Panorama, Ag Rafail</p2:Street>                            <p2:HouseNo>741</p2:HouseNo>                            <p2:ZipCode>28300</p2:ZipCode>                            <p2:City>Rethymnon</p2:City>                            <p2:Region>Crete</p2:Region>                            <p2:CountryISOCode>GR</p2:CountryISOCode>                        </p2:Add>                        <p2:Comm>                            <p2:CommType>TYPE_PHONE</p2:CommType>                            <p2:Sphere>SPHERE_BUSINESS</p2:Sphere>                            <p2:AreaCode></p2:AreaCode>                            <p2:Num>2834051502</p2:Num>                        </p2:Comm>                        <p2:Star_Rating>4</p2:Star_Rating>                        <p2:Loc>                            <p2:Loc_Cd>GRCRRE</p2:Loc_Cd>                            <p2:Loc_Tp>CITY</p2:Loc_Tp>                            <p2:Loc_Name>Rethymnon</p2:Loc_Name>                        </p2:Loc>                    </p2:Hotel>                    <p2:Cat_Page>                        <p2:Catalog Code=\"EUBF\" Name=\"easyJet Holidays Beach - Family\" />                        <p2:Cat_Page_No>0</p2:Cat_Page_No>                        <p2:Prc_Cat_Page_No>0</p2:Prc_Cat_Page_No>                    </p2:Cat_Page>                    <p2:Corporate_Cd>GRCR0009</p2:Corporate_Cd>                </p2:HtlPrd>                <p2:Rm_Cd>                    <p2:Rm_No>1</p2:Rm_No>                    <p2:Code>B01</p2:Code>                    <p2:Desc>Bungalow with Garden View and Balcony or Terrace</p2:Desc>                    <p2:Fac_List>Garden View, Balcony or Terrace, Double or Twin Beds, Shower or Bath, Air Conditioning, WC, 1 Extra Bed in Bedroom</p2:Fac_List>                    <p2:Facility_List>                        <p2:Facility Code=\"GV\" Name=\"Garden View\" />                        <p2:Facility Code=\"BOT\" Name=\"Balcony or Terrace\" />                        <p2:Facility Code=\"DOTB\" Name=\"Double or Twin Beds\" />                        <p2:Facility Code=\"SOB\" Name=\"Shower or Bath\" />                        <p2:Facility Code=\"AC\" Name=\"Air Conditioning\" />                        <p2:Facility Code=\"WC\" Name=\"WC\" />                        <p2:Facility Code=\"EB1\" Name=\"1 Extra Bed in Bedroom\" />                    </p2:Facility_List>                    <p2:Inf_Inc_Occ>true</p2:Inf_Inc_Occ>                    <p2:Min_Pax>2</p2:Min_Pax>                    <p2:Max_Pax>3</p2:Max_Pax>                    <p2:Max_Adu>3</p2:Max_Adu>                    <p2:Max_Chd>2</p2:Max_Chd>                    <p2:Max_Inf>1</p2:Max_Inf>                    <p2:BB_Cd>HB</p2:BB_Cd>                    <p2:BB_Name>Half Board</p2:BB_Name>                    <p2:Alt_BB_Cd>AI</p2:Alt_BB_Cd>                    <p2:Ser_Sts>FIX</p2:Ser_Sts>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">981.25</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">981.25</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Prices>                        <p2:Price>                            <p2:Prc_Cd>AA</p2:Prc_Cd>                            <p2:Prc_Cd_Name>Package Price</p2:Prc_Cd_Name>                            <p2:Prc_Cd_Tp>ACC</p2:Prc_Cd_Tp>                            <p2:Qty>2</p2:Qty>                            <p2:Prc CurISO=\"GBP\">981.25</p2:Prc>                            <p2:Prc_Dt>2020-05-26T15:22:01.000+01:00</p2:Prc_Dt>                            <p2:PricePaxs>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Id>2</p2:Pax_Id>                            </p2:PricePaxs>                            <p2:Visible>true</p2:Visible>                            <p2:Prc_Sts>STK</p2:Prc_Sts>                        </p2:Price>                    </p2:Prices>                </p2:Rm_Cd>                <p2:Ref_Prd_Id>2</p2:Ref_Prd_Id>                <p2:Free_Car_Rental_Poss>false</p2:Free_Car_Rental_Poss>                <p2:Atol_Mth>APP</p2:Atol_Mth>            </p2:Accom>            <p2:Route_List>                <p2:Routing Routing_Type=\"OW\">                    <p2:Routing_Id>2</p2:Routing_Id>                    <p2:Route Rt_Dir=\"outbound\">                        <p2:RouteCd>HERLTN6ALTNHER</p2:RouteCd>                        <p2:Flt_Inv_Id>2150961969</p2:Flt_Inv_Id>                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>                        <p2:Dep_Air_Cd>LTN</p2:Dep_Air_Cd>                        <p2:Arr_Air_Cd>HER</p2:Arr_Air_Cd>                        <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                            <p2:Local>2020-08-15T14:45:00+01:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                            <p2:Local>2020-08-15T20:45:00+03:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Duration>7</p2:Duration>                        <p2:Cycle_Dt>2020-08-15</p2:Cycle_Dt>                        <p2:JnyDur>04:00</p2:JnyDur>                        <p2:Prom Code=\"EUFO\" Issue=\"1\" Name=\"Flight Only\" />                        <p2:Car_Cd>EZY</p2:Car_Cd>                        <p2:Flt_No>2351</p2:Flt_No>                        <p2:Bkg_Cls Code=\"Y\" />                        <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                        <p2:Flt_Seq_Cd>A</p2:Flt_Seq_Cd>                        <p2:Sec>                            <p2:Id>2</p2:Id>                            <p2:SecId>1</p2:SecId>                            <p2:Dep_Air_Cd>LTN</p2:Dep_Air_Cd>                            <p2:Arr_Air_Cd>HER</p2:Arr_Air_Cd>                            <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                                <p2:Local>2020-08-15T14:45:00+01:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                                <p2:Local>2020-08-15T20:45:00+03:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:JnyDur>04:00</p2:JnyDur>                            <p2:Car_Cd>EZY</p2:Car_Cd>                            <p2:Flt_No>2351</p2:Flt_No>                            <p2:Bkg_Cls Code=\"Y\" />                            <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                            <p2:Eqmt>A320</p2:Eqmt>                            <p2:EqmtDescription>Airbus Family</p2:EqmtDescription>                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        </p2:Sec>                        <p2:Ser_Sts>FIX</p2:Ser_Sts>                        <p2:SubServPaxs>                            <p2:SubServPax>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                            <p2:SubServPax>                                <p2:Pax_Id>2</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                        </p2:SubServPaxs>                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        <p2:Check_In Dir=\"DEPARTURE\">Main Terminal</p2:Check_In>                    </p2:Route>                    <p2:Route Rt_Dir=\"inbound\">                        <p2:RouteCd>HERLTN6AHERLTN</p2:RouteCd>                        <p2:Flt_Inv_Id>2150962255</p2:Flt_Inv_Id>                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>                        <p2:Dep_Air_Cd>HER</p2:Dep_Air_Cd>                        <p2:Arr_Air_Cd>LTN</p2:Arr_Air_Cd>                        <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                            <p2:Local>2020-08-22T21:30:00+03:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                            <p2:Local>2020-08-22T23:35:00+01:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Duration>7</p2:Duration>                        <p2:Cycle_Dt>2020-08-22</p2:Cycle_Dt>                        <p2:JnyDur>04:05</p2:JnyDur>                        <p2:Prom Code=\"EUFO\" Issue=\"1\" Name=\"Flight Only\" />                        <p2:Car_Cd>EZY</p2:Car_Cd>                        <p2:Flt_No>2352</p2:Flt_No>                        <p2:Bkg_Cls Code=\"Y\" />                        <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                        <p2:Flt_Seq_Cd>A</p2:Flt_Seq_Cd>                        <p2:Sec>                            <p2:Id>3</p2:Id>                            <p2:SecId>2</p2:SecId>                            <p2:Dep_Air_Cd>HER</p2:Dep_Air_Cd>                            <p2:Arr_Air_Cd>LTN</p2:Arr_Air_Cd>                            <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                                <p2:Local>2020-08-22T21:30:00+03:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                                <p2:Local>2020-08-22T23:35:00+01:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:JnyDur>04:05</p2:JnyDur>                            <p2:Car_Cd>EZY</p2:Car_Cd>                            <p2:Flt_No>2352</p2:Flt_No>                            <p2:Bkg_Cls Code=\"Y\" />                            <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                            <p2:Eqmt>A320</p2:Eqmt>                            <p2:EqmtDescription>Airbus Family</p2:EqmtDescription>                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        </p2:Sec>                        <p2:Ser_Sts>FIX</p2:Ser_Sts>                        <p2:SubServPaxs>                            <p2:SubServPax>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                            <p2:SubServPax>                                <p2:Pax_Id>2</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                        </p2:SubServPaxs>                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        <p2:Check_In Dir=\"DEPARTURE\">Main Terminal</p2:Check_In>                    </p2:Route>                </p2:Routing>            </p2:Route_List>        </p2:Package>        <p2:Item Code=\"GRCR0009HERS\" Name=\"Shared Transfer\" Auto_Inc=\"false\" Short_Name=\"Shared Transfer\">            <p2:Id>4</p2:Id>            <p2:St_Dt>2020-08-15</p2:St_Dt>            <p2:Set_Type>EXTRA</p2:Set_Type>            <p2:Item_Type Code=\"TF\">                <p2:Item_Type_Desc>                    <p2:Locale>EN_EN</p2:Locale>                    <p2:Desc>Transfer</p2:Desc>                </p2:Item_Type_Desc>            </p2:Item_Type>            <p2:Prom Code=\"AUCI\" Issue=\"1\" Name=\"Common Items\" />            <p2:Bkg_Qty>2</p2:Bkg_Qty>            <p2:Ser_Sts>FIX</p2:Ser_Sts>            <p2:SubServPaxs>                <p2:SubServPax>                    <p2:Pax_Id>1</p2:Pax_Id>                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>                    <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                </p2:SubServPax>                <p2:SubServPax>                    <p2:Pax_Id>2</p2:Pax_Id>                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>                    <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                </p2:SubServPax>            </p2:SubServPaxs>            <p2:Rate_Rule>DAY</p2:Rate_Rule>            <p2:Item_Method>PP</p2:Item_Method>            <p2:Atol_Mth>APP</p2:Atol_Mth>        </p2:Item>        <p2:Flt_Extra_Cat_List>            <p2:Flt_Inv_Id>2150961969</p2:Flt_Inv_Id>            <p2:Flt_Extra_Cat Code=\"BAG\" Name=\"Baggage\" Method=\"BAG\">                <p2:Flt_Extra Code=\"BAG\" Name=\"Baggage\">                    <p2:Class>Y</p2:Class>                    <p2:Baggage>                        <p2:Weight Cd=\"23\">                            <p2:Piece Cd=\"1\">0</p2:Piece>                        </p2:Weight>                    </p2:Baggage>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Atol_Mth>NONE</p2:Atol_Mth>                </p2:Flt_Extra>            </p2:Flt_Extra_Cat>        </p2:Flt_Extra_Cat_List>        <p2:Flt_Extra_Cat_List>            <p2:Flt_Inv_Id>2150962255</p2:Flt_Inv_Id>            <p2:Flt_Extra_Cat Code=\"BAG\" Name=\"Baggage\" Method=\"BAG\">                <p2:Flt_Extra Code=\"BAG\" Name=\"Baggage\">                    <p2:Class>Y</p2:Class>                    <p2:Baggage>                        <p2:Weight Cd=\"23\">                            <p2:Piece Cd=\"1\">0</p2:Piece>                        </p2:Weight>                    </p2:Baggage>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Atol_Mth>NONE</p2:Atol_Mth>                </p2:Flt_Extra>            </p2:Flt_Extra_Cat>        </p2:Flt_Extra_Cat_List>        <p2:CurISO>GBP</p2:CurISO>        <p2:Fast_Seller>S</p2:Fast_Seller>        <p2:Acc_Prc_Zero_Fg>false</p2:Acc_Prc_Zero_Fg>        <p2:Acc_Cost_Zero_Fg>false</p2:Acc_Cost_Zero_Fg>        <p2:Atol_Prot_Tp>PKG</p2:Atol_Prot_Tp>        <p2:Atol_Prot_By>TO</p2:Atol_Prot_By>        <p2:Atol_Prot_Issuer>TO</p2:Atol_Prot_Issuer>        <p2:Summary_Prices>            <p2:Summary_Price>                <p2:Prc_Tp_Cd>ACC</p2:Prc_Tp_Cd>                <p2:Prc_Tp_Name>Package Price</p2:Prc_Tp_Name>                <p2:Qty>2</p2:Qty>                <p2:Prc>981.25</p2:Prc>            </p2:Summary_Price>        </p2:Summary_Prices>    </p2:Bkg_Ent>    <p2:Agt_No>WAGBP</p2:Agt_No>    <p2:Cus CusId=\"39850\" SysId=\"MUSY\" MandatorId=\"T\" />    <p2:CusDet>        <p2:CusId>39850</p2:CusId>        <p2:SysId>MUSY</p2:SysId>        <p2:MandatorId>T</p2:MandatorId>        <p2:Person>            <p2:Add>                <p2:Name>Test Address</p2:Name>                <p2:Street>Test Address Second Line</p2:Street>                <p2:ZipCode>CR 3WR</p2:ZipCode>                <p2:City>Test Town</p2:City>                <p2:CountryISOCode>GBR</p2:CountryISOCode>            </p2:Add>            <p2:Comm>                <p2:CommType>TYPE_MOBILE</p2:CommType>                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>                <p2:AreaCode></p2:AreaCode>                <p2:Num>44 11101110111</p2:Num>            </p2:Comm>   " +
                $"         <p2:Email>                <p2:Address>{expectedEmail}</p2:Address>                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>            </p2:Email>            <p2:Sex>SEX_UNKNOWN</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>    </p2:CusDet>    <p2:TrvDox>        <p2:DocumentReceiver>PAYER</p2:DocumentReceiver>        <p2:DoxLang>en_EN</p2:DoxLang>        <p2:Next_Travel_Dox_Prt_Dt>2020-07-04T23:59:59.000+01:00</p2:Next_Travel_Dox_Prt_Dt>        <p2:ConfPrt>false</p2:ConfPrt>        <p2:Travel_Dox_Stop>false</p2:Travel_Dox_Stop>        <p2:Conf_Stop>false</p2:Conf_Stop>        <p2:Travel_Dox_No_Price>false</p2:Travel_Dox_No_Price>        <p2:Travel_Dox_Per_Person>false</p2:Travel_Dox_Per_Person>        <p2:Print_Voucher_Immed>false</p2:Print_Voucher_Immed>        <p2:EDox_Generation>false</p2:EDox_Generation>    </p2:TrvDox>    <p2:PayData>        <p2:Dpt Type=\"LOW\">            <p2:CurISO>GBP</p2:CurISO>            " +
                $"<p2:Amt>{bookingDespositAmount}</p2:Amt>            <p2:Dep_Dt>2020-05-26</p2:Dep_Dt>        </p2:Dpt>        <p2:Bkg_Prc_Ex>            <p2:CurISO>GBP</p2:CurISO>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>        </p2:Bkg_Prc_Ex>        <p2:Bkg_Prc_Inc>            <p2:CurISO>GBP</p2:CurISO>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>            <p2:Bal_Due_Amt>0.00</p2:Bal_Due_Amt>            <p2:Bal_Due_Dt>2020-06-16</p2:Bal_Due_Dt>        </p2:Bkg_Prc_Inc>        <p2:Pay>            <p2:CCPay CCType=\"CARD\" Card_Issuer=\"DL\" Card_Cd=\"DL\" Card_Desc=\"Visa Debit\">                <p2:CNum>XXXXXXXXXXXX1111</p2:CNum>                <p2:ExpDate>10/20</p2:ExpDate> " +
                $"               <p2:PayAmt>{bookingPaymentAmount}</p2:PayAmt>                <p2:Is_Loyalty_Card>false</p2:Is_Loyalty_Card>            </p2:CCPay>            <p2:Pay_Seq>1</p2:Pay_Seq>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>            <p2:Exch_Rate>1.00</p2:Exch_Rate>            <p2:CurISO>GBP</p2:CurISO>            <p2:AuthCode>500040609</p2:AuthCode>            <p2:TransNo>883590502923253A</p2:TransNo>            <p2:PayDtTm>2020-05-26T15:22:06.000+01:00</p2:PayDtTm>            <p2:PayDetails>ADYEN</p2:PayDetails>            <p2:Pay_Group Code=\"CARD\" Name=\"Card\" />            <p2:AuthSys>EasyJetPGS</p2:AuthSys>            <p2:Pay_Type_Code>DL</p2:Pay_Type_Code>            <p2:Pay_Method Code=\"DL\" Name=\"Visa Debit\" />            <p2:Settle_Method>L</p2:Settle_Method>            <p2:Recon_Type>CARD</p2:Recon_Type>            <p2:Recon_Method>MAN</p2:Recon_Method>            <p2:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holdiays VRP User\" />            <p2:Pay_Id>2153016388</p2:Pay_Id> " +
                $"           <p2:Bal_Refund_Amt>{bookingPaymentAmount}</p2:Bal_Refund_Amt>        </p2:Pay>        <p2:Pay>            <p2:Pay_Seq>2</p2:Pay_Seq>     " +
                $"       <p2:Amt>{bookingDespositAmount}</p2:Amt>            <p2:Exch_Rate>1.00</p2:Exch_Rate>            <p2:CurISO>GBP</p2:CurISO>            <p2:PayDtTm>2020-05-26T15:22:07.000+01:00</p2:PayDtTm>            <p2:Pay_Group Code=\"CA\" Name=\"Cash\" />            <p2:Pay_Type_Code>TRF</p2:Pay_Type_Code>            <p2:Pay_Method Code=\"CR\" Name=\"Credit Refund Redeemed\" />            <p2:Settle_Method>Y</p2:Settle_Method>            <p2:Recon_Type>CASH</p2:Recon_Type>            <p2:Recon_Method>MAN</p2:Recon_Method>            <p2:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holdiays VRP User\" />            <p2:Pay_Id>2153016579</p2:Pay_Id>" +
                $"            <p2:Bal_Refund_Amt>{bookingDespositAmount}</p2:Bal_Refund_Amt>        </p2:Pay>" +
                $"        <p2:Tot_Amt>{bookingDespositAmount + 1100}</p2:Tot_Amt>        <p2:Agt_Com>0.00</p2:Agt_Com>        <p2:Comm_Inc_VAT>0.00</p2:Comm_Inc_VAT>        <p2:VAT>0.00</p2:VAT>        <p2:Payment_Received>1962.50</p2:Payment_Received>        <p2:TO_Comm_Amt>0.00</p2:TO_Comm_Amt>        <p2:TO_Comm_Amt_Calc>0.00</p2:TO_Comm_Amt_Calc>    </p2:PayData>    <p2:Pax Age=\"31\" Index=\"1\">        <p2:Person>            <p2:FirstName>First Guest Name</p2:FirstName>            <p2:LastName>First Guest Surname</p2:LastName>            <p2:DateOfBirth>1989-07-10</p2:DateOfBirth>            <p2:Title>Miss</p2:Title>            <p2:Sex>SEX_FEMALE</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>        <p2:Pax_Tp>ADULT</p2:Pax_Tp>        <p2:Lead_Pax>true</p2:Lead_Pax>    </p2:Pax>    <p2:Pax Age=\"30\" Index=\"2\">        <p2:Person>            <p2:FirstName>Kjghkjg</p2:FirstName>            <p2:LastName>Dfgdfg</p2:LastName>            <p2:Title>Miss</p2:Title>            <p2:Sex>SEX_FEMALE</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>        <p2:Pax_Tp>ADULT</p2:Pax_Tp>    </p2:Pax>    <p2:DD_Marketing_Sts>V0</p2:DD_Marketing_Sts>    <p2:Prom Code=\"EUBF\" Issue=\"1\" Name=\"easyJet Holidays Beach - Family\" Prom_Group_Code=\"EJH\" />    <p2:Incident_Sts>NA</p2:Incident_Sts>    <p2:Insurance_Method>INT</p2:Insurance_Method>    <p2:Retail_Bkg_Id>-1</p2:Retail_Bkg_Id>    <p2:Bkg_Type_Mth>RET</p2:Bkg_Type_Mth>    <p1:Amendments>        <p1:Bkg Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Route Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Accom Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Item Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Flight_Extra Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Car_Rental Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Cruise Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Pax Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Memo Add=\"true\" Amend=\"true\" Cancel=\"true\" />    </p1:Amendments></p1:DisplayResponse>";

            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()
            )
            .InScenario("Credit booking when email is booking reference")
            .WillSetStateTo("Check booking on lock")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody(expectedBookingResponse)
            );

            // DisplayMemoCodes
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()
            )
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Atcom", "DisplayMemoResponse_VALID_REF.xml")))
            );


            // Check on lock status
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()
            )
            .InScenario("Credit booking when email is booking reference")
            .WhenStateIs("Check booking on lock")
            .WillSetStateTo("Memo checked")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("<p1:DisplayMemoResponse xmlns:p1=\"AtComRes/DisplayMemoResponse\" xmlns:p2=\"AtComRes/Common\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"AtComRes/DisplayMemoResponse ../api/DisplayMemoResponse/DisplayMemoResponse.xsd\">    <!-- Response returned from: EZYTST.EJH.ATCOM -->    <p2:Adm Xsd_Ver=\"T3.20.4.8\">        <p2:ReqId>xxx</p2:ReqId>        <p2:Tm>2020-06-11T10:42:44.750+01:00</p2:Tm>        <p2:Trk From=\"atcomres\" To=\"musyk\" />    </p2:Adm>    <p2:CltInfo>        <p2:Locale>en_EN</p2:Locale>        <p2:CltSysContext>3</p2:CltSysContext>        <p2:Agt_No>WAGBP</p2:Agt_No>        <p2:TermCode>ABCD</p2:TermCode>        <p2:User_Name>EZYVRP</p2:User_Name>        <p2:Chan>inhouse</p2:Chan>        <p2:Channel_Type>VRP</p2:Channel_Type>        <p2:User_Role>INTERNAL</p2:User_Role>    </p2:CltInfo>    <p2:BkgNum>        <p2:BkgId>1000001</p2:BkgId>        <p2:CurrentVersion>8</p2:CurrentVersion>    </p2:BkgNum>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:38.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:OC</p2:Memo_Cd>        <p2:Memo_Name>Opt created</p2:Memo_Name>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28909</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>1</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:42.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:OB</p2:Memo_Cd>        <p2:Memo_Name>Opt to booking</p2:Memo_Name>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28912</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>4</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:44.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:AB</p2:Memo_Cd>        <p2:Memo_Name>Amended Booking</p2:Memo_Name>        <p2:Memo_Des>Fees calculated using Amendment Market: B2CU B2C £</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28915</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>7</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>bulk cancelation</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48503</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>8</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:CNXO</p2:Memo_Cd>        <p2:Memo_Name>Cancellation Charge Overridden</p2:Memo_Name>        <p2:Memo_Des>Cancellation Charge Overridden from 899.20</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48504</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>9</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:CB</p2:Memo_Cd>        <p2:Memo_Name>Cancelled Booking</p2:Memo_Name>        <p2:Memo_Des>Fees calculated using Amendment Market: B2CU B2C £</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48502</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>10</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T13:50:43.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67805</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>13</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T13:57:34.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67765</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>14</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T14:13:02.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67775</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>15</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T14:23:00.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67777</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>16</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-06T10:15:47.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>Simple text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>69027</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>18</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo></p1:DisplayMemoResponse>")
            );

            var voucherifyServer = SpawnServer("VoucherifyMockServer");

            // Mock create voucherify customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithParam("email", expectedEmail)
                    .WithParam("limit", "1")
                    .UsingGet()
            )
            .InScenario("Get customer")
            .WillSetStateTo("Customer is not created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBodyAsJson(new { })
            );


            // Mock get creating customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithBody(new JsonMatcher(new { name = "email@email.com", email = expectedEmail, metadata = new Dictionary<string, string>() { { "lang", "eng" } } }))
                    .UsingPost()
            )
            .InScenario("Get customer")
            .WhenStateIs("Customer is not created")
            .WillSetStateTo("Customer created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"source_id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"name\":\"Oleg\"," +
                    $"\"email\":\"{expectedEmail}\"," +
                    "\"description\":\"Premium user, ACME Inc.\",\"address\":{\"city\":\"Melbourne\",\"state\":\"FL\",\"line_1\":\"226 E Fee Ave\",\"line_2\":null,\"country\":\"Australia\",\"postal_code\":\"32901\"},\"summary\":{\"redemptions\":{\"total_redeemed\":0,\"total_failed\":0,\"total_succeeded\":0,\"total_rolled_back\":0,\"total_rollback_failed\":0,\"total_rollback_succeeded\":0,\"gift\":{\"redeemed_amount\":0,\"amount_to_go\":0}},\"orders\":{\"total_amount\":0,\"total_count\":0,\"average_amount\":0,\"last_order_amount\":0,\"last_order_date\":null}},\"loyalty\":{\"points\":0,\"referred_customers\":0},\"metadata\":{\"lang\":\"en\"},\"created_at\":\"2016-11-15T15:41:44Z\",\"object\":\"customer\"}")
            );


            // Mock get customer
            // Customer Response
            string recivedCustomerResponse = "{" +
                "\"object\":\"list\"," +
                "\"has_more\":false," +
                "\"total\":1," +
                "\"data_ref\":\"customers\"," +
                "\"customers\":" +
                    "[{\"object\":\"customer\"," +
                        "\"id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\"," +
                        "\"source_id\":null," +
                        "\"name\":\" \"," +
                        "\"description\":null," +
                        $"\"email\":\"{expectedEmail}\"," +
                        "\"metadata\":" +
                        "{" +
                            "\"lang\":\"end\"" +
                        "}," +
                        "\"created_at\":\"2020-06-07T14:15:16.073Z\"," +
                        "\"address\":" +
                        "{" +
                            "\"city\":null," +
                            "\"state\":null," +
                            "\"line_1\":null," +
                            "\"line_2\":null," +
                            "\"country\":null," +
                            "\"postal_code\":null" +
                        "}," +
                        "\"summary\":" +
                        "{" +
                            "\"redemptions\":" +
                            "{" +
                                "\"total_redeemed\":0," +
                                "\"total_failed\":0," +
                                "\"total_succeeded\":0," +
                                "\"total_rolled_back\":0," +
                                "\"total_rollback_failed\":0," +
                                "\"total_rollback_succeeded\":0" +
                            "}," +
                            "\"orders\":" +
                            "{" +
                                "\"total_amount\":0," +
                                "\"total_count\":0," +
                                "\"average_amount\":0," +
                                "\"last_order_amount\":0," +
                                "\"last_order_date\":null" +
                            "}" +
                         "}," +
                         "\"loyalty\":" +
                         "{" +
                            "\"points\":0," +
                            "\"referred_customers\":0," +
                            "\"campaigns\":{}" +
                         "}," +
                         "\"updated_at\":null," +
                         "\"phone\":null," +
                         "\"birthday\":null" +
                         "}" +
                    "]" +
            "}";


            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithParam("email", expectedEmail)
                    .WithParam("limit", "1")
                    .UsingGet()
            )
            .InScenario("Get customer")
            .WhenStateIs("Customer created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody(recivedCustomerResponse)
            );


            // Mock creating voucher
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/bulk-tool-*")
                    .WithBody(new JmesPathMatcher(
                        "type == 'GIFT_VOUCHER'",
                        "campaign == 'easyJet-credit'",
                        "category == 'ej Holidays'",
                        $"metadata.currency == 'GBP'",
                        $"metadata.source == 'Bulk Tool'",
                        $"metadata.action == 'add credit'",
                        $"metadata.memo == '{memo}'",
                        $"metadata.reason == '{reason}'"
                        ))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WillSetStateTo("Voucher is created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"v_30XK8y8H438FXJk7ag54sMuJzhzpvSkI\",\"code\":\"bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":12000,\"balance\":12000},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"publish\":{\"object\":\"list\",\"count\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/redemptions?page=1&limit=10\"},\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1067166\"},\"is_referral_code\":false,\"updated_at\":null,\"object\":\"voucher\"}")
            );


            // Add amount to voucher
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JsonMatcher(new { amount = int.Parse(request.Booking.Amount) }))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher is created")
            .WillSetStateTo("Voucher ready to publish")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("")
            );


            // Mock pusblish voucher
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/vouchers/publish")
                    .WithBody(new JmesPathMatcher("customer.id == 'cust_ZJwRsO3KEQaeizIkeNk7ZqPo'"))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher ready to publish")
            .WillSetStateTo("Voucher is published")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"pub_a78ylda8fw6JpM7pqBU6g6QdWnwjyWcq\",\"object\":\"publication\",\"created_at\":\"2020-06-07T00:00:09.367Z\",\"customer_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"tracking_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"metadata\":{},\"channel\":\"API\",\"result\":\"SUCCESS\",\"customer\":{\"object\":\"customer\",\"id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\"},\"voucher\":{\"id\":\"v_w2FrJM04dw34Nx50flsGwweHJf0PxNKS\",\"code\":\"bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1000,\"balance\":1000},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00.000Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1079763\"},\"is_referral_code\":false,\"created_at\":\"2020-06-07T00:00:09.266Z\",\"updated_at\":\"2020-06-07T00:00:09.377Z\",\"holder_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"object\":\"voucher\",\"publish\":{\"object\":\"list\",\"count\":1,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/redemptions?page=1&limit=10\"}}}")
            );

            ApplyManyConfigurationFields(new[]
            {
                new KeyValuePair<string, string>("Voucherify:Host", voucherifyServer.Url),
                new KeyValuePair<string, string>("Atcom:Search:Host", atcomServer.Url),
                new KeyValuePair<string, string>("Atcom:Booking:Host", atcomServer.Url)
            });

            Client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("yeymtmwg0mzdt80chqveeopojn897s58yciqfhvl508mpq4dmna9w907617q");

            // Act
            var response = await Client.PostAsync($"/api/v1/cancellationandrefund/cancelandrefund", content);

            var responseContent = await response.Content.ReadAsStringAsync();
            var bulkToolResponse = JsonConvert.DeserializeObject<BulkToolResponse>(responseContent);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            bulkToolResponse.CorrelationId.Should().NotBeNull();
            bulkToolResponse.Reference.Should().Be(expectedEmail);
            bulkToolResponse.Message.Should().Be("Credit successfully added");
        }

        [Trait("Api", "/api/v1.0/cancellationandrefund/cancelandrefund")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineData("1000001", "cancel and credit", 120, 1000)]
        public async Task CancelAndRefund_ShouldSuccessfullyPassCancelAndCreditCommand_IfBookingValid(string reference, string flag, int bookingDespositAmount, int bookingPaymentAmount)
        {
            // Arrange
            var request = new BulkToolRequest()
            {
                Booking = new Domain.Data.BulkToolBooking.Booking()
                {
                    Reference = reference,
                    Flag = flag,
                }
            };

            HttpContent content = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");

            var atcomServer = SpawnServer("AtcomWireMockServer");

            // Get booking
            // Expected booking response
            string expectedBookingResponse = $"<p1:DisplayResponse xmlns:p2=\"AtComRes/Common\" xmlns:p1=\"AtComRes/DisplayResponse\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"AtComRes/DisplayResponse ../api/DisplayResponse/DisplayResponse.xsd\">    <!-- Response returned from: EZYTST.EJH.ATCOM -->    <p2:Adm Xsd_Ver=\"T3.20.4.8\">        <p2:ReqId>12133</p2:ReqId>        <p2:Tm>2020-06-11T10:31:26.135+01:00</p2:Tm>        <p2:Trk From=\"atcomres\" To=\"musyk\" />    </p2:Adm>    <p2:CltInfo>        <p2:Locale>en_EN</p2:Locale>        <p2:CltSysContext>3</p2:CltSysContext>        <p2:Agt_No>WAGBP</p2:Agt_No>        <p2:TermCode>ABCD</p2:TermCode>        <p2:User_Name>EZYVRP</p2:User_Name>        <p2:Chan>inhouse</p2:Chan>        <p2:Channel_Type>VRP</p2:Channel_Type>        <p2:User_Role>INTERNAL</p2:User_Role>    </p2:CltInfo>    <p2:BkgNum>        <p2:BkgId>" + reference + "</p2:BkgId>        <p2:CurrentVersion>4</p2:CurrentVersion>        <p2:AtcomresBkgVersion></p2:AtcomresBkgVersion>    </p2:BkgNum>    <p2:BkgSts>CANCELED</p2:BkgSts>    <p2:ResSts>CONFIRMED</p2:ResSts>    <p2:HasAgt_Notice>false</p2:HasAgt_Notice>    <p2:His>        <p2:Bkg_Dt_Tm>2020-05-26T15:22:01.000+01:00</p2:Bkg_Dt_Tm>        <p2:Bkg_User>EZYVRP</p2:Bkg_User>        <p2:Bkg_Term_Code>ABCD</p2:Bkg_Term_Code>        <p2:Bkg_Chan>inhouse</p2:Bkg_Chan>        <p2:Amd_Dt_Tm>2020-06-03T14:16:56.000+01:00</p2:Amd_Dt_Tm>        <p2:Amd_User>EZYVRP</p2:Amd_User>        <p2:Amd_Term_Code>ABCD</p2:Amd_Term_Code>        <p2:Amd_Chan>inhouse</p2:Amd_Chan>    </p2:His>    <p2:Bkg_Ent>        <p2:Package>            <p2:Accom>                <p2:Id>1</p2:Id>                <p2:St_Dt>2020-08-15</p2:St_Dt>                <p2:End_Dt>2020-08-22</p2:End_Dt>                <p2:HtlPrd>                    <p2:Name>                        <![CDATA[Iberostar Creta Panorama & Mare]]>                    </p2:Name>                    <p2:Prom Code=\"EUBF\" Issue=\"1\" Name=\"easyJet Holidays Beach - Family\" />                    <p2:Acc_Cd Accom_Id=\"2151635610/2\">GRCR0009</p2:Acc_Cd>                    <p2:Acc_InvState>INTERNAL</p2:Acc_InvState>                    <p2:Hotel>                        <p2:Add>                            <p2:Name>                                <![CDATA[Iberostar Creta Panorama & Mare]]>                            </p2:Name>                            <p2:Street>Panorama, Ag Rafail</p2:Street>                            <p2:HouseNo>741</p2:HouseNo>                            <p2:ZipCode>28300</p2:ZipCode>                            <p2:City>Rethymnon</p2:City>                            <p2:Region>Crete</p2:Region>                            <p2:CountryISOCode>GR</p2:CountryISOCode>                        </p2:Add>                        <p2:Comm>                            <p2:CommType>TYPE_PHONE</p2:CommType>                            <p2:Sphere>SPHERE_BUSINESS</p2:Sphere>                            <p2:AreaCode></p2:AreaCode>                            <p2:Num>2834051502</p2:Num>                        </p2:Comm>                        <p2:Star_Rating>4</p2:Star_Rating>                        <p2:Loc>                            <p2:Loc_Cd>GRCRRE</p2:Loc_Cd>                            <p2:Loc_Tp>CITY</p2:Loc_Tp>                            <p2:Loc_Name>Rethymnon</p2:Loc_Name>                        </p2:Loc>                    </p2:Hotel>                    <p2:Cat_Page>                        <p2:Catalog Code=\"EUBF\" Name=\"easyJet Holidays Beach - Family\" />                        <p2:Cat_Page_No>0</p2:Cat_Page_No>                        <p2:Prc_Cat_Page_No>0</p2:Prc_Cat_Page_No>                    </p2:Cat_Page>                    <p2:Corporate_Cd>GRCR0009</p2:Corporate_Cd>                </p2:HtlPrd>                <p2:Rm_Cd>                    <p2:Rm_No>1</p2:Rm_No>                    <p2:Code>B01</p2:Code>                    <p2:Desc>Bungalow with Garden View and Balcony or Terrace</p2:Desc>                    <p2:Fac_List>Garden View, Balcony or Terrace, Double or Twin Beds, Shower or Bath, Air Conditioning, WC, 1 Extra Bed in Bedroom</p2:Fac_List>                    <p2:Facility_List>                        <p2:Facility Code=\"GV\" Name=\"Garden View\" />                        <p2:Facility Code=\"BOT\" Name=\"Balcony or Terrace\" />                        <p2:Facility Code=\"DOTB\" Name=\"Double or Twin Beds\" />                        <p2:Facility Code=\"SOB\" Name=\"Shower or Bath\" />                        <p2:Facility Code=\"AC\" Name=\"Air Conditioning\" />                        <p2:Facility Code=\"WC\" Name=\"WC\" />                        <p2:Facility Code=\"EB1\" Name=\"1 Extra Bed in Bedroom\" />                    </p2:Facility_List>                    <p2:Inf_Inc_Occ>true</p2:Inf_Inc_Occ>                    <p2:Min_Pax>2</p2:Min_Pax>                    <p2:Max_Pax>3</p2:Max_Pax>                    <p2:Max_Adu>3</p2:Max_Adu>                    <p2:Max_Chd>2</p2:Max_Chd>                    <p2:Max_Inf>1</p2:Max_Inf>                    <p2:BB_Cd>HB</p2:BB_Cd>                    <p2:BB_Name>Half Board</p2:BB_Name>                    <p2:Alt_BB_Cd>AI</p2:Alt_BB_Cd>                    <p2:Ser_Sts>FIX</p2:Ser_Sts>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">981.25</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">981.25</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Prices>                        <p2:Price>                            <p2:Prc_Cd>AA</p2:Prc_Cd>                            <p2:Prc_Cd_Name>Package Price</p2:Prc_Cd_Name>                            <p2:Prc_Cd_Tp>ACC</p2:Prc_Cd_Tp>                            <p2:Qty>2</p2:Qty>                            <p2:Prc CurISO=\"GBP\">981.25</p2:Prc>                            <p2:Prc_Dt>2020-05-26T15:22:01.000+01:00</p2:Prc_Dt>                            <p2:PricePaxs>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Id>2</p2:Pax_Id>                            </p2:PricePaxs>                            <p2:Visible>true</p2:Visible>                            <p2:Prc_Sts>STK</p2:Prc_Sts>                        </p2:Price>                    </p2:Prices>                </p2:Rm_Cd>                <p2:Ref_Prd_Id>2</p2:Ref_Prd_Id>                <p2:Free_Car_Rental_Poss>false</p2:Free_Car_Rental_Poss>                <p2:Atol_Mth>APP</p2:Atol_Mth>            </p2:Accom>            <p2:Route_List>                <p2:Routing Routing_Type=\"OW\">                    <p2:Routing_Id>2</p2:Routing_Id>                    <p2:Route Rt_Dir=\"outbound\">                        <p2:RouteCd>HERLTN6ALTNHER</p2:RouteCd>                        <p2:Flt_Inv_Id>2150961969</p2:Flt_Inv_Id>                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>                        <p2:Dep_Air_Cd>LTN</p2:Dep_Air_Cd>                        <p2:Arr_Air_Cd>HER</p2:Arr_Air_Cd>                        <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                            <p2:Local>2020-08-15T14:45:00+01:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                            <p2:Local>2020-08-15T20:45:00+03:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Duration>7</p2:Duration>                        <p2:Cycle_Dt>2020-08-15</p2:Cycle_Dt>                        <p2:JnyDur>04:00</p2:JnyDur>                        <p2:Prom Code=\"EUFO\" Issue=\"1\" Name=\"Flight Only\" />                        <p2:Car_Cd>EZY</p2:Car_Cd>                        <p2:Flt_No>2351</p2:Flt_No>                        <p2:Bkg_Cls Code=\"Y\" />                        <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                        <p2:Flt_Seq_Cd>A</p2:Flt_Seq_Cd>                        <p2:Sec>                            <p2:Id>2</p2:Id>                            <p2:SecId>1</p2:SecId>                            <p2:Dep_Air_Cd>LTN</p2:Dep_Air_Cd>                            <p2:Arr_Air_Cd>HER</p2:Arr_Air_Cd>                            <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                                <p2:Local>2020-08-15T14:45:00+01:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                                <p2:Local>2020-08-15T20:45:00+03:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:JnyDur>04:00</p2:JnyDur>                            <p2:Car_Cd>EZY</p2:Car_Cd>                            <p2:Flt_No>2351</p2:Flt_No>                            <p2:Bkg_Cls Code=\"Y\" />                            <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                            <p2:Eqmt>A320</p2:Eqmt>                            <p2:EqmtDescription>Airbus Family</p2:EqmtDescription>                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        </p2:Sec>                        <p2:Ser_Sts>FIX</p2:Ser_Sts>                        <p2:SubServPaxs>                            <p2:SubServPax>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                            <p2:SubServPax>                                <p2:Pax_Id>2</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                        </p2:SubServPaxs>                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        <p2:Check_In Dir=\"DEPARTURE\">Main Terminal</p2:Check_In>                    </p2:Route>                    <p2:Route Rt_Dir=\"inbound\">                        <p2:RouteCd>HERLTN6AHERLTN</p2:RouteCd>                        <p2:Flt_Inv_Id>2150962255</p2:Flt_Inv_Id>                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>                        <p2:Dep_Air_Cd>HER</p2:Dep_Air_Cd>                        <p2:Arr_Air_Cd>LTN</p2:Arr_Air_Cd>                        <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                            <p2:Local>2020-08-22T21:30:00+03:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                            <p2:Local>2020-08-22T23:35:00+01:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Duration>7</p2:Duration>                        <p2:Cycle_Dt>2020-08-22</p2:Cycle_Dt>                        <p2:JnyDur>04:05</p2:JnyDur>                        <p2:Prom Code=\"EUFO\" Issue=\"1\" Name=\"Flight Only\" />                        <p2:Car_Cd>EZY</p2:Car_Cd>                        <p2:Flt_No>2352</p2:Flt_No>                        <p2:Bkg_Cls Code=\"Y\" />                        <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                        <p2:Flt_Seq_Cd>A</p2:Flt_Seq_Cd>                        <p2:Sec>                            <p2:Id>3</p2:Id>                            <p2:SecId>2</p2:SecId>                            <p2:Dep_Air_Cd>HER</p2:Dep_Air_Cd>                            <p2:Arr_Air_Cd>LTN</p2:Arr_Air_Cd>                            <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                                <p2:Local>2020-08-22T21:30:00+03:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                                <p2:Local>2020-08-22T23:35:00+01:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:JnyDur>04:05</p2:JnyDur>                            <p2:Car_Cd>EZY</p2:Car_Cd>                            <p2:Flt_No>2352</p2:Flt_No>                            <p2:Bkg_Cls Code=\"Y\" />                            <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                            <p2:Eqmt>A320</p2:Eqmt>                            <p2:EqmtDescription>Airbus Family</p2:EqmtDescription>                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        </p2:Sec>                        <p2:Ser_Sts>FIX</p2:Ser_Sts>                        <p2:SubServPaxs>                            <p2:SubServPax>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                            <p2:SubServPax>                                <p2:Pax_Id>2</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                        </p2:SubServPaxs>                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        <p2:Check_In Dir=\"DEPARTURE\">Main Terminal</p2:Check_In>                    </p2:Route>                </p2:Routing>            </p2:Route_List>        </p2:Package>        <p2:Item Code=\"GRCR0009HERS\" Name=\"Shared Transfer\" Auto_Inc=\"false\" Short_Name=\"Shared Transfer\">            <p2:Id>4</p2:Id>            <p2:St_Dt>2020-08-15</p2:St_Dt>            <p2:Set_Type>EXTRA</p2:Set_Type>            <p2:Item_Type Code=\"TF\">                <p2:Item_Type_Desc>                    <p2:Locale>EN_EN</p2:Locale>                    <p2:Desc>Transfer</p2:Desc>                </p2:Item_Type_Desc>            </p2:Item_Type>            <p2:Prom Code=\"AUCI\" Issue=\"1\" Name=\"Common Items\" />            <p2:Bkg_Qty>2</p2:Bkg_Qty>            <p2:Ser_Sts>FIX</p2:Ser_Sts>            <p2:SubServPaxs>                <p2:SubServPax>                    <p2:Pax_Id>1</p2:Pax_Id>                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>                    <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                </p2:SubServPax>                <p2:SubServPax>                    <p2:Pax_Id>2</p2:Pax_Id>                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>                    <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                </p2:SubServPax>            </p2:SubServPaxs>            <p2:Rate_Rule>DAY</p2:Rate_Rule>            <p2:Item_Method>PP</p2:Item_Method>            <p2:Atol_Mth>APP</p2:Atol_Mth>        </p2:Item>        <p2:Flt_Extra_Cat_List>            <p2:Flt_Inv_Id>2150961969</p2:Flt_Inv_Id>            <p2:Flt_Extra_Cat Code=\"BAG\" Name=\"Baggage\" Method=\"BAG\">                <p2:Flt_Extra Code=\"BAG\" Name=\"Baggage\">                    <p2:Class>Y</p2:Class>                    <p2:Baggage>                        <p2:Weight Cd=\"23\">                            <p2:Piece Cd=\"1\">0</p2:Piece>                        </p2:Weight>                    </p2:Baggage>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Atol_Mth>NONE</p2:Atol_Mth>                </p2:Flt_Extra>            </p2:Flt_Extra_Cat>        </p2:Flt_Extra_Cat_List>        <p2:Flt_Extra_Cat_List>            <p2:Flt_Inv_Id>2150962255</p2:Flt_Inv_Id>            <p2:Flt_Extra_Cat Code=\"BAG\" Name=\"Baggage\" Method=\"BAG\">                <p2:Flt_Extra Code=\"BAG\" Name=\"Baggage\">                    <p2:Class>Y</p2:Class>                    <p2:Baggage>                        <p2:Weight Cd=\"23\">                            <p2:Piece Cd=\"1\">0</p2:Piece>                        </p2:Weight>                    </p2:Baggage>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Atol_Mth>NONE</p2:Atol_Mth>                </p2:Flt_Extra>            </p2:Flt_Extra_Cat>        </p2:Flt_Extra_Cat_List>        <p2:CurISO>GBP</p2:CurISO>        <p2:Fast_Seller>S</p2:Fast_Seller>        <p2:Acc_Prc_Zero_Fg>false</p2:Acc_Prc_Zero_Fg>        <p2:Acc_Cost_Zero_Fg>false</p2:Acc_Cost_Zero_Fg>        <p2:Atol_Prot_Tp>PKG</p2:Atol_Prot_Tp>        <p2:Atol_Prot_By>TO</p2:Atol_Prot_By>        <p2:Atol_Prot_Issuer>TO</p2:Atol_Prot_Issuer>        <p2:Summary_Prices>            <p2:Summary_Price>                <p2:Prc_Tp_Cd>ACC</p2:Prc_Tp_Cd>                <p2:Prc_Tp_Name>Package Price</p2:Prc_Tp_Name>                <p2:Qty>2</p2:Qty>                <p2:Prc>981.25</p2:Prc>            </p2:Summary_Price>        </p2:Summary_Prices>    </p2:Bkg_Ent>    <p2:Agt_No>WAGBP</p2:Agt_No>    <p2:Cus CusId=\"39850\" SysId=\"MUSY\" MandatorId=\"T\" />    <p2:CusDet>        <p2:CusId>39850</p2:CusId>        <p2:SysId>MUSY</p2:SysId>        <p2:MandatorId>T</p2:MandatorId>        <p2:Person>            <p2:Add>                <p2:Name>Test Address</p2:Name>                <p2:Street>Test Address Second Line</p2:Street>                <p2:ZipCode>CR 3WR</p2:ZipCode>                <p2:City>Test Town</p2:City>                <p2:CountryISOCode>GBR</p2:CountryISOCode>            </p2:Add>            <p2:Comm>                <p2:CommType>TYPE_MOBILE</p2:CommType>                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>                <p2:AreaCode></p2:AreaCode>                <p2:Num>44 11101110111</p2:Num>            </p2:Comm>  " +
                "          <p2:Email>                <p2:Address>email@email.com</p2:Address>                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>            </p2:Email>            <p2:Sex>SEX_UNKNOWN</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>    </p2:CusDet>    <p2:TrvDox>        <p2:DocumentReceiver>PAYER</p2:DocumentReceiver>        <p2:DoxLang>en_EN</p2:DoxLang>        <p2:Next_Travel_Dox_Prt_Dt>2020-07-04T23:59:59.000+01:00</p2:Next_Travel_Dox_Prt_Dt>        <p2:ConfPrt>false</p2:ConfPrt>        <p2:Travel_Dox_Stop>false</p2:Travel_Dox_Stop>        <p2:Conf_Stop>false</p2:Conf_Stop>        <p2:Travel_Dox_No_Price>false</p2:Travel_Dox_No_Price>        <p2:Travel_Dox_Per_Person>false</p2:Travel_Dox_Per_Person>        <p2:Print_Voucher_Immed>false</p2:Print_Voucher_Immed>        <p2:EDox_Generation>false</p2:EDox_Generation>    </p2:TrvDox>    <p2:PayData>        <p2:Dpt Type=\"LOW\">            <p2:CurISO>GBP</p2:CurISO>            " +
                $"<p2:Amt>{bookingDespositAmount}</p2:Amt>            <p2:Dep_Dt>2020-05-26</p2:Dep_Dt>        </p2:Dpt>        <p2:Bkg_Prc_Ex>            <p2:CurISO>GBP</p2:CurISO>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>        </p2:Bkg_Prc_Ex>        <p2:Bkg_Prc_Inc>            <p2:CurISO>GBP</p2:CurISO>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>            <p2:Bal_Due_Amt>0.00</p2:Bal_Due_Amt>            <p2:Bal_Due_Dt>2020-06-16</p2:Bal_Due_Dt>        </p2:Bkg_Prc_Inc>        <p2:Pay>            <p2:CCPay CCType=\"CARD\" Card_Issuer=\"DL\" Card_Cd=\"DL\" Card_Desc=\"Visa Debit\">                <p2:CNum>XXXXXXXXXXXX1111</p2:CNum>                <p2:ExpDate>10/20</p2:ExpDate> " +
                $"               <p2:PayAmt>{bookingPaymentAmount}</p2:PayAmt>                <p2:Is_Loyalty_Card>false</p2:Is_Loyalty_Card>            </p2:CCPay>            <p2:Pay_Seq>1</p2:Pay_Seq>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>            <p2:Exch_Rate>1.00</p2:Exch_Rate>            <p2:CurISO>GBP</p2:CurISO>            <p2:AuthCode>500040609</p2:AuthCode>            <p2:TransNo>883590502923253A</p2:TransNo>            <p2:PayDtTm>2020-05-26T15:22:06.000+01:00</p2:PayDtTm>            <p2:PayDetails>ADYEN</p2:PayDetails>            <p2:Pay_Group Code=\"CARD\" Name=\"Card\" />            <p2:AuthSys>EasyJetPGS</p2:AuthSys>            <p2:Pay_Type_Code>DL</p2:Pay_Type_Code>            <p2:Pay_Method Code=\"DL\" Name=\"Visa Debit\" />            <p2:Settle_Method>L</p2:Settle_Method>            <p2:Recon_Type>CARD</p2:Recon_Type>            <p2:Recon_Method>MAN</p2:Recon_Method>            <p2:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holdiays VRP User\" />            <p2:Pay_Id>2153016388</p2:Pay_Id> " +
                $"           <p2:Bal_Refund_Amt>{bookingPaymentAmount}</p2:Bal_Refund_Amt>        </p2:Pay>        <p2:Pay>            <p2:Pay_Seq>2</p2:Pay_Seq>     " +
                $"       <p2:Amt>{bookingDespositAmount}</p2:Amt>            <p2:Exch_Rate>1.00</p2:Exch_Rate>            <p2:CurISO>GBP</p2:CurISO>            <p2:PayDtTm>2020-05-26T15:22:07.000+01:00</p2:PayDtTm>            <p2:Pay_Group Code=\"CA\" Name=\"Cash\" />            <p2:Pay_Type_Code>TRF</p2:Pay_Type_Code>            <p2:Pay_Method Code=\"CR\" Name=\"Credit Refund Redeemed\" />            <p2:Settle_Method>Y</p2:Settle_Method>            <p2:Recon_Type>CASH</p2:Recon_Type>            <p2:Recon_Method>MAN</p2:Recon_Method>            <p2:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holdiays VRP User\" />            <p2:Pay_Id>2153016579</p2:Pay_Id>" +
                $"            <p2:Bal_Refund_Amt>{bookingDespositAmount}</p2:Bal_Refund_Amt>        </p2:Pay>" +
                $"        <p2:Tot_Amt>{bookingDespositAmount + bookingPaymentAmount}</p2:Tot_Amt>        <p2:Agt_Com>0.00</p2:Agt_Com>        <p2:Comm_Inc_VAT>0.00</p2:Comm_Inc_VAT>        <p2:VAT>0.00</p2:VAT>        <p2:Payment_Received>1962.50</p2:Payment_Received>        <p2:TO_Comm_Amt>0.00</p2:TO_Comm_Amt>        <p2:TO_Comm_Amt_Calc>0.00</p2:TO_Comm_Amt_Calc>    </p2:PayData>    <p2:Pax Age=\"31\" Index=\"1\">        <p2:Person>            <p2:FirstName>First Guest Name</p2:FirstName>            <p2:LastName>First Guest Surname</p2:LastName>            <p2:DateOfBirth>1989-07-10</p2:DateOfBirth>            <p2:Title>Miss</p2:Title>            <p2:Sex>SEX_FEMALE</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>        <p2:Pax_Tp>ADULT</p2:Pax_Tp>        <p2:Lead_Pax>true</p2:Lead_Pax>    </p2:Pax>    <p2:Pax Age=\"30\" Index=\"2\">        <p2:Person>            <p2:FirstName>Kjghkjg</p2:FirstName>            <p2:LastName>Dfgdfg</p2:LastName>            <p2:Title>Miss</p2:Title>            <p2:Sex>SEX_FEMALE</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>        <p2:Pax_Tp>ADULT</p2:Pax_Tp>    </p2:Pax>    <p2:DD_Marketing_Sts>V0</p2:DD_Marketing_Sts>    <p2:Prom Code=\"EUBF\" Issue=\"1\" Name=\"easyJet Holidays Beach - Family\" Prom_Group_Code=\"EJH\" />    <p2:Incident_Sts>NA</p2:Incident_Sts>    <p2:Insurance_Method>INT</p2:Insurance_Method>    <p2:Retail_Bkg_Id>-1</p2:Retail_Bkg_Id>    <p2:Bkg_Type_Mth>RET</p2:Bkg_Type_Mth>    <p1:Amendments>        <p1:Bkg Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Route Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Accom Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Item Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Flight_Extra Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Car_Rental Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Cruise Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Pax Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Memo Add=\"true\" Amend=\"true\" Cancel=\"true\" />    </p1:Amendments></p1:DisplayResponse>";

            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()
            )
            .InScenario("Credit booking")
            .WillSetStateTo("Check booking on lock")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody(expectedBookingResponse)
            );

            // DisplayMemoCodes
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()
            )
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Atcom", "DisplayMemoResponse_VALID_REF.xml")))
            );

            // Check on lock status
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()

            )
            .InScenario("Credit booking")
            .WhenStateIs("Check booking on lock")
            .WillSetStateTo("Modify memo CRED")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("<p1:DisplayMemoResponse xmlns:p1=\"AtComRes/DisplayMemoResponse\" xmlns:p2=\"AtComRes/Common\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"AtComRes/DisplayMemoResponse ../api/DisplayMemoResponse/DisplayMemoResponse.xsd\">    <!-- Response returned from: EZYTST.EJH.ATCOM -->    <p2:Adm Xsd_Ver=\"T3.20.4.8\">        <p2:ReqId>xxx</p2:ReqId>        <p2:Tm>2020-06-11T10:42:44.750+01:00</p2:Tm>        <p2:Trk From=\"atcomres\" To=\"musyk\" />    </p2:Adm>    <p2:CltInfo>        <p2:Locale>en_EN</p2:Locale>        <p2:CltSysContext>3</p2:CltSysContext>        <p2:Agt_No>WAGBP</p2:Agt_No>        <p2:TermCode>ABCD</p2:TermCode>        <p2:User_Name>EZYVRP</p2:User_Name>        <p2:Chan>inhouse</p2:Chan>        <p2:Channel_Type>VRP</p2:Channel_Type>        <p2:User_Role>INTERNAL</p2:User_Role>    </p2:CltInfo>    <p2:BkgNum>        <p2:BkgId>1000001</p2:BkgId>        <p2:CurrentVersion>8</p2:CurrentVersion>    </p2:BkgNum>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:38.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:OC</p2:Memo_Cd>        <p2:Memo_Name>Opt created</p2:Memo_Name>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28909</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>1</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:42.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:OB</p2:Memo_Cd>        <p2:Memo_Name>Opt to booking</p2:Memo_Name>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28912</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>4</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:44.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:AB</p2:Memo_Cd>        <p2:Memo_Name>Amended Booking</p2:Memo_Name>        <p2:Memo_Des>Fees calculated using Amendment Market: B2CU B2C £</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28915</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>7</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>bulk cancelation</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48503</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>8</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:CNXO</p2:Memo_Cd>        <p2:Memo_Name>Cancellation Charge Overridden</p2:Memo_Name>        <p2:Memo_Des>Cancellation Charge Overridden from 899.20</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48504</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>9</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:CB</p2:Memo_Cd>        <p2:Memo_Name>Cancelled Booking</p2:Memo_Name>        <p2:Memo_Des>Fees calculated using Amendment Market: B2CU B2C £</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48502</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>10</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T13:50:43.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67805</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>13</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T13:57:34.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67765</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>14</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T14:13:02.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67775</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>15</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T14:23:00.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67777</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>16</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-06T10:15:47.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>Simple text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>69027</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>18</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo></p1:DisplayMemoResponse>")
            );

            // Modify memo CRED
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .WithBody(new RegexMatcher($"<p1:Memo_Cd>CRED</p1:Memo_Cd>"))
                    .UsingPost()

            )
            .InScenario("Credit booking")
            .WhenStateIs("Modify memo CRED")
            .WillSetStateTo("Add payment info for goodwill")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("<p2:ModifyMemoResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyMemoResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:09.584+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa0rAAm</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079763</p1:BkgId></p1:BkgNum><p1:Memo><p1:Memo_Dt>2020-06-07T01:00:09.000+01:00</p1:Memo_Dt><p1:Memo_Cd>CRED</p1:Memo_Cd><p1:Memo_Name>Customer Credit</p1:Memo_Name><p1:Memo_Des>Voucher created with ids: bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund, 120 £</p1:Memo_Des><p1:Memo_User_Name>EZYVRP</p1:Memo_User_Name><p1:Memo_User_Desc>easyJet Holidays VRP User</p1:Memo_User_Desc><p1:Memo_Key>1267062</p1:Memo_Key><p1:Memo_Rights>READ</p1:Memo_Rights><p1:Memo_Rights>WRITE</p1:Memo_Rights><p1:Memo_Rights>DELETE</p1:Memo_Rights><p1:Memo_Seq>24</p1:Memo_Seq><p1:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" /></p1:Memo></p2:ModifyMemoResponse>")
            );

            // Add payment info for goodwill
            atcomServer.Given(
               Request.Create()
                   .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                   .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                   .WithBody(new RegexMatcher($"<p1:PayAmt>-{bookingDespositAmount}</p1:PayAmt>"))
                   .UsingPost()
           )
           .InScenario("Credit booking")
           .WhenStateIs("Add payment info for goodwill")
           .WillSetStateTo("Add payment info for refund")
           .RespondWith(
               Response.Create()
                   .WithStatusCode(200)
                   .WithBody("<p2:ModifyCustPaymentResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyCustPaymentResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:17.323+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa2iAAl</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079989</p1:BkgId><p1:CurrentVersion>14</p1:CurrentVersion></p1:BkgNum><p1:BkgSts>CANCELED</p1:BkgSts><p1:His><p1:Bkg_Dt_Tm>2020-02-16T16:07:40.000+01:00</p1:Bkg_Dt_Tm><p1:Bkg_User>EZYVRP</p1:Bkg_User><p1:Bkg_Term_Code>ABCD</p1:Bkg_Term_Code><p1:Bkg_Chan>inhouse</p1:Bkg_Chan><p1:Amd_Dt_Tm>2020-06-07T01:00:16.000+01:00</p1:Amd_Dt_Tm><p1:Amd_User>EZYVRP</p1:Amd_User><p1:Amd_Term_Code>ABCD</p1:Amd_Term_Code><p1:Amd_Chan>inhouse</p1:Amd_Chan></p1:His><p1:PayData><p1:Pay><p1:Pay_Seq>2</p1:Pay_Seq><p1:Amt>-120.00</p1:Amt><p1:Exch_Rate>1.00</p1:Exch_Rate><p1:CurISO>GBP</p1:CurISO><p1:PayDtTm>2020-06-07T01:00:17.000+01:00</p1:PayDtTm><p1:Pay_Group Code=\"CA\" Name=\"Cash\" /><p1:Pay_Type_Code>TRF</p1:Pay_Type_Code><p1:Pay_Method Code=\"CI\" Name=\"Credit Refund Issued\" /><p1:Settle_Method>Y</p1:Settle_Method><p1:Recon_Type>CASH</p1:Recon_Type><p1:Recon_Method>MAN</p1:Recon_Method><p1:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holidays VRP User\" /><p1:Pay_Id>2163234244</p1:Pay_Id><p1:Bal_Refund_Amt>-120.00</p1:Bal_Refund_Amt></p1:Pay></p1:PayData></p2:ModifyCustPaymentResponse>")
            );

            // Add payment info for refund
            atcomServer.Given(
               Request.Create()
                   .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                   .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                   .WithBody(new RegexMatcher($"<p1:PayAmt>-{bookingPaymentAmount}</p1:PayAmt>"))
                   .UsingPost()
           )
           .InScenario("Credit booking")
           .WhenStateIs("Add payment info for refund")
           .WillSetStateTo("Modify memo REP3")
           .RespondWith(
               Response.Create()
                   .WithStatusCode(200)
                   .WithBody("<p2:ModifyCustPaymentResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyCustPaymentResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:17.323+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa2iAAl</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079989</p1:BkgId><p1:CurrentVersion>14</p1:CurrentVersion></p1:BkgNum><p1:BkgSts>CANCELED</p1:BkgSts><p1:His><p1:Bkg_Dt_Tm>2020-02-16T16:07:40.000+01:00</p1:Bkg_Dt_Tm><p1:Bkg_User>EZYVRP</p1:Bkg_User><p1:Bkg_Term_Code>ABCD</p1:Bkg_Term_Code><p1:Bkg_Chan>inhouse</p1:Bkg_Chan><p1:Amd_Dt_Tm>2020-06-07T01:00:16.000+01:00</p1:Amd_Dt_Tm><p1:Amd_User>EZYVRP</p1:Amd_User><p1:Amd_Term_Code>ABCD</p1:Amd_Term_Code><p1:Amd_Chan>inhouse</p1:Amd_Chan></p1:His><p1:PayData><p1:Pay><p1:Pay_Seq>2</p1:Pay_Seq><p1:Amt>-120.00</p1:Amt><p1:Exch_Rate>1.00</p1:Exch_Rate><p1:CurISO>GBP</p1:CurISO><p1:PayDtTm>2020-06-07T01:00:17.000+01:00</p1:PayDtTm><p1:Pay_Group Code=\"CA\" Name=\"Cash\" /><p1:Pay_Type_Code>TRF</p1:Pay_Type_Code><p1:Pay_Method Code=\"CI\" Name=\"Credit Refund Issued\" /><p1:Settle_Method>Y</p1:Settle_Method><p1:Recon_Type>CASH</p1:Recon_Type><p1:Recon_Method>MAN</p1:Recon_Method><p1:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holidays VRP User\" /><p1:Pay_Id>2163234244</p1:Pay_Id><p1:Bal_Refund_Amt>-120.00</p1:Bal_Refund_Amt></p1:Pay></p1:PayData></p2:ModifyCustPaymentResponse>")
            );

            // Modify memo REP3
            atcomServer.Given(
               Request.Create()
                   .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                   .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                   .WithBody(new RegexMatcher($"<p1:Memo_Cd>REP3</p1:Memo_Cd>"))
                   .UsingPost()
           )
           .InScenario("Credit booking")
           .WhenStateIs("Modify memo REP3")
           .RespondWith(
               Response.Create()
                   .WithStatusCode(200)
                   .WithBody("<p2:ModifyMemoResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyMemoResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:09.584+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa0rAAm</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079763</p1:BkgId></p1:BkgNum><p1:Memo><p1:Memo_Dt>2020-06-07T01:00:09.000+01:00</p1:Memo_Dt><p1:Memo_Cd>Rep1</p1:Memo_Cd><p1:Memo_Name>Customer Credit</p1:Memo_Name><p1:Memo_Des>bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund</p1:Memo_Des><p1:Memo_User_Name>EZYVRP</p1:Memo_User_Name><p1:Memo_User_Desc>easyJet Holidays VRP User</p1:Memo_User_Desc><p1:Memo_Key>1267062</p1:Memo_Key><p1:Memo_Rights>READ</p1:Memo_Rights><p1:Memo_Rights>WRITE</p1:Memo_Rights><p1:Memo_Rights>DELETE</p1:Memo_Rights><p1:Memo_Seq>24</p1:Memo_Seq><p1:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" /></p1:Memo></p2:ModifyMemoResponse>")
            );

            var voucherifyServer = SpawnServer("VoucherifyMockServer",
                new WireMockServerSettings
                {
                    FileSystemHandler =
                        new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, "voucherify"),
                    StartAdminInterface = true,
                    ReadStaticMappings = true,
                    WatchStaticMappings = true,
                    WatchStaticMappingsInSubdirectories = true
                });

            // Mock create voucherify customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithParam("email", "email@email.com")
                    .WithParam("limit", "1")
                    .UsingGet()
            )
            .InScenario("Get customer")
            .WillSetStateTo("Customer is not created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBodyAsJson(new { })
            );

            // Mock get creating customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithBody(new JsonMatcher(new { name = "email@email.com", email = "email@email.com", metadata = new Dictionary<string, string>() { { "lang", "eng" } } }))
                    .UsingPost()
            )
            .InScenario("Get customer")
            .WhenStateIs("Customer is not created")
            .WillSetStateTo("Customer created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"source_id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"name\":\"Oleg\",\"email\":\"email@email.com\",\"description\":\"Premium user, ACME Inc.\",\"address\":{\"city\":\"Melbourne\",\"state\":\"FL\",\"line_1\":\"226 E Fee Ave\",\"line_2\":null,\"country\":\"Australia\",\"postal_code\":\"32901\"},\"summary\":{\"redemptions\":{\"total_redeemed\":0,\"total_failed\":0,\"total_succeeded\":0,\"total_rolled_back\":0,\"total_rollback_failed\":0,\"total_rollback_succeeded\":0,\"gift\":{\"redeemed_amount\":0,\"amount_to_go\":0}},\"orders\":{\"total_amount\":0,\"total_count\":0,\"average_amount\":0,\"last_order_amount\":0,\"last_order_date\":null}},\"loyalty\":{\"points\":0,\"referred_customers\":0},\"metadata\":{\"lang\":\"en\"},\"created_at\":\"2016-11-15T15:41:44Z\",\"object\":\"customer\"}")
            );

            // Mock get customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithParam("email", "email@email.com")
                    .WithParam("limit", "1")
                    .UsingGet()
            )
            .InScenario("Get customer")
            .WhenStateIs("Customer created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"object\":\"list\",\"has_more\":false,\"total\":1,\"data_ref\":\"customers\",\"customers\":[{\"object\":\"customer\",\"id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"source_id\":null,\"name\":\" \",\"description\":null,\"email\":\"email@email.com\",\"metadata\":{\"lang\":\"end\"},\"created_at\":\"2020-06-07T14:15:16.073Z\",\"address\":{\"city\":null,\"state\":null,\"line_1\":null,\"line_2\":null,\"country\":null,\"postal_code\":null},\"summary\":{\"redemptions\":{\"total_redeemed\":0,\"total_failed\":0,\"total_succeeded\":0,\"total_rolled_back\":0,\"total_rollback_failed\":0,\"total_rollback_succeeded\":0},\"orders\":{\"total_amount\":0,\"total_count\":0,\"average_amount\":0,\"last_order_amount\":0,\"last_order_date\":null}},\"loyalty\":{\"points\":0,\"referred_customers\":0,\"campaigns\":{}},\"updated_at\":null,\"phone\":null,\"birthday\":null}]}")
            );

            // Mock creating voucher goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JmesPathMatcher(
                        "type == 'GIFT_VOUCHER'",
                        "campaign == 'easyJet-credit'",
                        "category == 'ej Holidays'",
                        $"metadata.currency == 'GBP'",
                        $"metadata.source == 'Bulk Tool'",
                        $"metadata.action == 'cancel and credit'",
                        $"metadata.booking_ref == '{reference}'",
                        $"metadata.reason == 'goodwill'"
                        ))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WillSetStateTo("Voucher for goodwill is created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"v_30XK8y8H438FXJk7ag54sMuJzhzpvSkI\",\"code\":\"bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-goodwill\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1200,\"balance\":1200},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"publish\":{\"object\":\"list\",\"count\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/redemptions?page=1&limit=10\"},\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1067166\"},\"is_referral_code\":false,\"updated_at\":null,\"object\":\"voucher\"}")
            );

            // Mock add amount to voucher goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JsonMatcher(new { amount = bookingDespositAmount * 100 }))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher for goodwill is created")
            .WillSetStateTo("Voucher goodwill ready to publish")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("")
            );

            // Mock pusblish voucher for goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/vouchers/publish")
                    .WithBody(new JmesPathMatcher("customer.id == 'cust_ZJwRsO3KEQaeizIkeNk7ZqPo'"))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher goodwill ready to publish")
            .WillSetStateTo("Voucher for goodwill is published")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"pub_a78ylda8fw6JpM7pqBU6g6QdWnwjyWcq\",\"object\":\"publication\",\"created_at\":\"2020-06-07T00:00:09.367Z\",\"customer_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"tracking_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"metadata\":{},\"channel\":\"API\",\"result\":\"SUCCESS\",\"customer\":{\"object\":\"customer\",\"id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\"},\"voucher\":{\"id\":\"v_w2FrJM04dw34Nx50flsGwweHJf0PxNKS\",\"code\":\"bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1000,\"balance\":1000},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00.000Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1079763\"},\"is_referral_code\":false,\"created_at\":\"2020-06-07T00:00:09.266Z\",\"updated_at\":\"2020-06-07T00:00:09.377Z\",\"holder_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"object\":\"voucher\",\"publish\":{\"object\":\"list\",\"count\":1,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-goodwill\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/redemptions?page=1&limit=10\"}}}")
            );

            // Mock creating voucher refund
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JmesPathMatcher(
                        "type == 'GIFT_VOUCHER'",
                        "campaign == 'easyJet-credit'",
                        "category == 'ej Holidays'",
                        $"metadata.currency == 'GBP'",
                        $"metadata.source == 'Bulk Tool'",
                        $"metadata.action == 'cancel and credit'",
                        $"metadata.booking_ref == '{reference}'",
                        $"metadata.reason == 'refund'"
                        ))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher for goodwill is published")
            .WillSetStateTo("Voucher for refund is created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"v_30XK8y8H438FXJk7ag54sMuJzhzpvSkI\",\"code\":\"bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":184250,\"balance\":184250},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"publish\":{\"object\":\"list\",\"count\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/redemptions?page=1&limit=10\"},\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1067166\"},\"is_referral_code\":false,\"updated_at\":null,\"object\":\"voucher\"}")
            );

            // Mock add amount to voucher goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JsonMatcher(new { amount = bookingPaymentAmount * 100 }))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher for refund is created")
            .WillSetStateTo("Voucher refund ready to publish")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("")
            );

            // Mock pusblish voucher for refund
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/vouchers/publish")
                    .WithBody(new JmesPathMatcher("customer.id == 'cust_ZJwRsO3KEQaeizIkeNk7ZqPo'"))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher refund ready to publish")
            .WillSetStateTo("Voucher refund is published")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"pub_a78ylda8fw6JpM7pqBU6g6QdWnwjyWcq\",\"object\":\"publication\",\"created_at\":\"2020-06-07T00:00:09.367Z\",\"customer_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"tracking_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"metadata\":{},\"channel\":\"API\",\"result\":\"SUCCESS\",\"customer\":{\"object\":\"customer\",\"id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\"},\"voucher\":{\"id\":\"v_w2FrJM04dw34Nx50flsGwweHJf0PxNKS\",\"code\":\"bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1000,\"balance\":1000},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00.000Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1079763\"},\"is_referral_code\":false,\"created_at\":\"2020-06-07T00:00:09.266Z\",\"updated_at\":\"2020-06-07T00:00:09.377Z\",\"holder_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"object\":\"voucher\",\"publish\":{\"object\":\"list\",\"count\":1,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/redemptions?page=1&limit=10\"}}}")
            );

            ApplyManyConfigurationFields(new[]
            {
                new KeyValuePair<string, string>("Voucherify:Host", voucherifyServer.Url),
                new KeyValuePair<string, string>("Atcom:Search:Host", atcomServer.Url),
                new KeyValuePair<string, string>("Atcom:Booking:Host", atcomServer.Url)
            });

            Client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("yeymtmwg0mzdt80chqveeopojn897s58yciqfhvl508mpq4dmna9w907617q");

            // Act
            var response = await Client.PostAsync($"/api/v1/cancellationandrefund/cancelandrefund", content);

            var responseContent = await response.Content.ReadAsStringAsync();
            var bulkToolResponse = JsonConvert.DeserializeObject<BulkToolResponse>(responseContent);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            bulkToolResponse.CorrelationId.Should().NotBeNull();
            bulkToolResponse.Reference.Should().Be(reference);
            bulkToolResponse.Note.Should().NotBeNull();
            bulkToolResponse.Message.Should().Be("Successfully canceled and credited");
        }

        [Trait("Api", "/api/v1.0/cancellationandrefund/cancelandrefund")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineData("1000001", "cancel and credit", 120, 1000)]
        public async Task CancelAndRefund_BookingValidAndAcceptableErrorsInAtcomResponse_ShouldSuccessfullyPassCancelAndCreditCommand(string reference, string flag, int bookingDespositAmount, int bookingPaymentAmount)
        {
            // Arrange
            var request = new BulkToolRequest()
            {
                Booking = new Domain.Data.BulkToolBooking.Booking()
                {
                    Reference = reference,
                    Flag = flag,
                }
            };

            HttpContent content = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");

            var atcomServer = SpawnServer("AtcomWireMockServer");

            // Get booking
            // Expected booking response
            string expectedBookingResponse = $"<p1:DisplayResponse xmlns:p2=\"AtComRes/Common\" xmlns:p1=\"AtComRes/DisplayResponse\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"AtComRes/DisplayResponse ../api/DisplayResponse/DisplayResponse.xsd\">    <!-- Response returned from: EZYTST.EJH.ATCOM -->    <p2:Adm Xsd_Ver=\"T3.20.4.8\">        <p2:ReqId>12133</p2:ReqId>        <p2:Tm>2020-06-11T10:31:26.135+01:00</p2:Tm>        <p2:Trk From=\"atcomres\" To=\"musyk\" />        <p2:Ser_Msg>            <p2:Severity>ERROR</p2:Severity>            <p2:Code>E14543</p2:Code>            <p2:Desc>Flight Not Matched to Flight on Booking.</p2:Desc>        </p2:Ser_Msg> </p2:Adm>    <p2:CltInfo>        <p2:Locale>en_EN</p2:Locale>        <p2:CltSysContext>3</p2:CltSysContext>        <p2:Agt_No>WAGBP</p2:Agt_No>        <p2:TermCode>ABCD</p2:TermCode>        <p2:User_Name>EZYVRP</p2:User_Name>        <p2:Chan>inhouse</p2:Chan>        <p2:Channel_Type>VRP</p2:Channel_Type>        <p2:User_Role>INTERNAL</p2:User_Role>    </p2:CltInfo>    <p2:BkgNum>        <p2:BkgId>" + reference + "</p2:BkgId>        <p2:CurrentVersion>4</p2:CurrentVersion>        <p2:AtcomresBkgVersion></p2:AtcomresBkgVersion>    </p2:BkgNum>    <p2:BkgSts>CANCELED</p2:BkgSts>    <p2:ResSts>CONFIRMED</p2:ResSts>    <p2:HasAgt_Notice>false</p2:HasAgt_Notice>    <p2:His>        <p2:Bkg_Dt_Tm>2020-05-26T15:22:01.000+01:00</p2:Bkg_Dt_Tm>        <p2:Bkg_User>EZYVRP</p2:Bkg_User>        <p2:Bkg_Term_Code>ABCD</p2:Bkg_Term_Code>        <p2:Bkg_Chan>inhouse</p2:Bkg_Chan>        <p2:Amd_Dt_Tm>2020-06-03T14:16:56.000+01:00</p2:Amd_Dt_Tm>        <p2:Amd_User>EZYVRP</p2:Amd_User>        <p2:Amd_Term_Code>ABCD</p2:Amd_Term_Code>        <p2:Amd_Chan>inhouse</p2:Amd_Chan>    </p2:His>    <p2:Bkg_Ent>        <p2:Package>            <p2:Accom>                <p2:Id>1</p2:Id>                <p2:St_Dt>2020-08-15</p2:St_Dt>                <p2:End_Dt>2020-08-22</p2:End_Dt>                <p2:HtlPrd>                    <p2:Name>                        <![CDATA[Iberostar Creta Panorama & Mare]]>                    </p2:Name>                    <p2:Prom Code=\"EUBF\" Issue=\"1\" Name=\"easyJet Holidays Beach - Family\" />                    <p2:Acc_Cd Accom_Id=\"2151635610/2\">GRCR0009</p2:Acc_Cd>                    <p2:Acc_InvState>INTERNAL</p2:Acc_InvState>                    <p2:Hotel>                        <p2:Add>                            <p2:Name>                                <![CDATA[Iberostar Creta Panorama & Mare]]>                            </p2:Name>                            <p2:Street>Panorama, Ag Rafail</p2:Street>                            <p2:HouseNo>741</p2:HouseNo>                            <p2:ZipCode>28300</p2:ZipCode>                            <p2:City>Rethymnon</p2:City>                            <p2:Region>Crete</p2:Region>                            <p2:CountryISOCode>GR</p2:CountryISOCode>                        </p2:Add>                        <p2:Comm>                            <p2:CommType>TYPE_PHONE</p2:CommType>                            <p2:Sphere>SPHERE_BUSINESS</p2:Sphere>                            <p2:AreaCode></p2:AreaCode>                            <p2:Num>2834051502</p2:Num>                        </p2:Comm>                        <p2:Star_Rating>4</p2:Star_Rating>                        <p2:Loc>                            <p2:Loc_Cd>GRCRRE</p2:Loc_Cd>                            <p2:Loc_Tp>CITY</p2:Loc_Tp>                            <p2:Loc_Name>Rethymnon</p2:Loc_Name>                        </p2:Loc>                    </p2:Hotel>                    <p2:Cat_Page>                        <p2:Catalog Code=\"EUBF\" Name=\"easyJet Holidays Beach - Family\" />                        <p2:Cat_Page_No>0</p2:Cat_Page_No>                        <p2:Prc_Cat_Page_No>0</p2:Prc_Cat_Page_No>                    </p2:Cat_Page>                    <p2:Corporate_Cd>GRCR0009</p2:Corporate_Cd>                </p2:HtlPrd>                <p2:Rm_Cd>                    <p2:Rm_No>1</p2:Rm_No>                    <p2:Code>B01</p2:Code>                    <p2:Desc>Bungalow with Garden View and Balcony or Terrace</p2:Desc>                    <p2:Fac_List>Garden View, Balcony or Terrace, Double or Twin Beds, Shower or Bath, Air Conditioning, WC, 1 Extra Bed in Bedroom</p2:Fac_List>                    <p2:Facility_List>                        <p2:Facility Code=\"GV\" Name=\"Garden View\" />                        <p2:Facility Code=\"BOT\" Name=\"Balcony or Terrace\" />                        <p2:Facility Code=\"DOTB\" Name=\"Double or Twin Beds\" />                        <p2:Facility Code=\"SOB\" Name=\"Shower or Bath\" />                        <p2:Facility Code=\"AC\" Name=\"Air Conditioning\" />                        <p2:Facility Code=\"WC\" Name=\"WC\" />                        <p2:Facility Code=\"EB1\" Name=\"1 Extra Bed in Bedroom\" />                    </p2:Facility_List>                    <p2:Inf_Inc_Occ>true</p2:Inf_Inc_Occ>                    <p2:Min_Pax>2</p2:Min_Pax>                    <p2:Max_Pax>3</p2:Max_Pax>                    <p2:Max_Adu>3</p2:Max_Adu>                    <p2:Max_Chd>2</p2:Max_Chd>                    <p2:Max_Inf>1</p2:Max_Inf>                    <p2:BB_Cd>HB</p2:BB_Cd>                    <p2:BB_Name>Half Board</p2:BB_Name>                    <p2:Alt_BB_Cd>AI</p2:Alt_BB_Cd>                    <p2:Ser_Sts>FIX</p2:Ser_Sts>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">981.25</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">981.25</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Prices>                        <p2:Price>                            <p2:Prc_Cd>AA</p2:Prc_Cd>                            <p2:Prc_Cd_Name>Package Price</p2:Prc_Cd_Name>                            <p2:Prc_Cd_Tp>ACC</p2:Prc_Cd_Tp>                            <p2:Qty>2</p2:Qty>                            <p2:Prc CurISO=\"GBP\">981.25</p2:Prc>                            <p2:Prc_Dt>2020-05-26T15:22:01.000+01:00</p2:Prc_Dt>                            <p2:PricePaxs>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Id>2</p2:Pax_Id>                            </p2:PricePaxs>                            <p2:Visible>true</p2:Visible>                            <p2:Prc_Sts>STK</p2:Prc_Sts>                        </p2:Price>                    </p2:Prices>                </p2:Rm_Cd>                <p2:Ref_Prd_Id>2</p2:Ref_Prd_Id>                <p2:Free_Car_Rental_Poss>false</p2:Free_Car_Rental_Poss>                <p2:Atol_Mth>APP</p2:Atol_Mth>            </p2:Accom>            <p2:Route_List>                <p2:Routing Routing_Type=\"OW\">                    <p2:Routing_Id>2</p2:Routing_Id>                    <p2:Route Rt_Dir=\"outbound\">                        <p2:RouteCd>HERLTN6ALTNHER</p2:RouteCd>                        <p2:Flt_Inv_Id>2150961969</p2:Flt_Inv_Id>                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>                        <p2:Dep_Air_Cd>LTN</p2:Dep_Air_Cd>                        <p2:Arr_Air_Cd>HER</p2:Arr_Air_Cd>                        <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                            <p2:Local>2020-08-15T14:45:00+01:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                            <p2:Local>2020-08-15T20:45:00+03:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Duration>7</p2:Duration>                        <p2:Cycle_Dt>2020-08-15</p2:Cycle_Dt>                        <p2:JnyDur>04:00</p2:JnyDur>                        <p2:Prom Code=\"EUFO\" Issue=\"1\" Name=\"Flight Only\" />                        <p2:Car_Cd>EZY</p2:Car_Cd>                        <p2:Flt_No>2351</p2:Flt_No>                        <p2:Bkg_Cls Code=\"Y\" />                        <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                        <p2:Flt_Seq_Cd>A</p2:Flt_Seq_Cd>                        <p2:Sec>                            <p2:Id>2</p2:Id>                            <p2:SecId>1</p2:SecId>                            <p2:Dep_Air_Cd>LTN</p2:Dep_Air_Cd>                            <p2:Arr_Air_Cd>HER</p2:Arr_Air_Cd>                            <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                                <p2:Local>2020-08-15T14:45:00+01:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                                <p2:Local>2020-08-15T20:45:00+03:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:JnyDur>04:00</p2:JnyDur>                            <p2:Car_Cd>EZY</p2:Car_Cd>                            <p2:Flt_No>2351</p2:Flt_No>                            <p2:Bkg_Cls Code=\"Y\" />                            <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                            <p2:Eqmt>A320</p2:Eqmt>                            <p2:EqmtDescription>Airbus Family</p2:EqmtDescription>                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        </p2:Sec>                        <p2:Ser_Sts>FIX</p2:Ser_Sts>                        <p2:SubServPaxs>                            <p2:SubServPax>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                            <p2:SubServPax>                                <p2:Pax_Id>2</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                        </p2:SubServPaxs>                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        <p2:Check_In Dir=\"DEPARTURE\">Main Terminal</p2:Check_In>                    </p2:Route>                    <p2:Route Rt_Dir=\"inbound\">                        <p2:RouteCd>HERLTN6AHERLTN</p2:RouteCd>                        <p2:Flt_Inv_Id>2150962255</p2:Flt_Inv_Id>                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>                        <p2:Dep_Air_Cd>HER</p2:Dep_Air_Cd>                        <p2:Arr_Air_Cd>LTN</p2:Arr_Air_Cd>                        <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                            <p2:Local>2020-08-22T21:30:00+03:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                            <p2:Local>2020-08-22T23:35:00+01:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Duration>7</p2:Duration>                        <p2:Cycle_Dt>2020-08-22</p2:Cycle_Dt>                        <p2:JnyDur>04:05</p2:JnyDur>                        <p2:Prom Code=\"EUFO\" Issue=\"1\" Name=\"Flight Only\" />                        <p2:Car_Cd>EZY</p2:Car_Cd>                        <p2:Flt_No>2352</p2:Flt_No>                        <p2:Bkg_Cls Code=\"Y\" />                        <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                        <p2:Flt_Seq_Cd>A</p2:Flt_Seq_Cd>                        <p2:Sec>                            <p2:Id>3</p2:Id>                            <p2:SecId>2</p2:SecId>                            <p2:Dep_Air_Cd>HER</p2:Dep_Air_Cd>                            <p2:Arr_Air_Cd>LTN</p2:Arr_Air_Cd>                            <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                                <p2:Local>2020-08-22T21:30:00+03:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                                <p2:Local>2020-08-22T23:35:00+01:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:JnyDur>04:05</p2:JnyDur>                            <p2:Car_Cd>EZY</p2:Car_Cd>                            <p2:Flt_No>2352</p2:Flt_No>                            <p2:Bkg_Cls Code=\"Y\" />                            <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                            <p2:Eqmt>A320</p2:Eqmt>                            <p2:EqmtDescription>Airbus Family</p2:EqmtDescription>                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        </p2:Sec>                        <p2:Ser_Sts>FIX</p2:Ser_Sts>                        <p2:SubServPaxs>                            <p2:SubServPax>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                            <p2:SubServPax>                                <p2:Pax_Id>2</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                        </p2:SubServPaxs>                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        <p2:Check_In Dir=\"DEPARTURE\">Main Terminal</p2:Check_In>                    </p2:Route>                </p2:Routing>            </p2:Route_List>        </p2:Package>        <p2:Item Code=\"GRCR0009HERS\" Name=\"Shared Transfer\" Auto_Inc=\"false\" Short_Name=\"Shared Transfer\">            <p2:Id>4</p2:Id>            <p2:St_Dt>2020-08-15</p2:St_Dt>            <p2:Set_Type>EXTRA</p2:Set_Type>            <p2:Item_Type Code=\"TF\">                <p2:Item_Type_Desc>                    <p2:Locale>EN_EN</p2:Locale>                    <p2:Desc>Transfer</p2:Desc>                </p2:Item_Type_Desc>            </p2:Item_Type>            <p2:Prom Code=\"AUCI\" Issue=\"1\" Name=\"Common Items\" />            <p2:Bkg_Qty>2</p2:Bkg_Qty>            <p2:Ser_Sts>FIX</p2:Ser_Sts>            <p2:SubServPaxs>                <p2:SubServPax>                    <p2:Pax_Id>1</p2:Pax_Id>                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>                    <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                </p2:SubServPax>                <p2:SubServPax>                    <p2:Pax_Id>2</p2:Pax_Id>                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>                    <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                </p2:SubServPax>            </p2:SubServPaxs>            <p2:Rate_Rule>DAY</p2:Rate_Rule>            <p2:Item_Method>PP</p2:Item_Method>            <p2:Atol_Mth>APP</p2:Atol_Mth>        </p2:Item>        <p2:Flt_Extra_Cat_List>            <p2:Flt_Inv_Id>2150961969</p2:Flt_Inv_Id>            <p2:Flt_Extra_Cat Code=\"BAG\" Name=\"Baggage\" Method=\"BAG\">                <p2:Flt_Extra Code=\"BAG\" Name=\"Baggage\">                    <p2:Class>Y</p2:Class>                    <p2:Baggage>                        <p2:Weight Cd=\"23\">                            <p2:Piece Cd=\"1\">0</p2:Piece>                        </p2:Weight>                    </p2:Baggage>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Atol_Mth>NONE</p2:Atol_Mth>                </p2:Flt_Extra>            </p2:Flt_Extra_Cat>        </p2:Flt_Extra_Cat_List>        <p2:Flt_Extra_Cat_List>            <p2:Flt_Inv_Id>2150962255</p2:Flt_Inv_Id>            <p2:Flt_Extra_Cat Code=\"BAG\" Name=\"Baggage\" Method=\"BAG\">                <p2:Flt_Extra Code=\"BAG\" Name=\"Baggage\">                    <p2:Class>Y</p2:Class>                    <p2:Baggage>                        <p2:Weight Cd=\"23\">                            <p2:Piece Cd=\"1\">0</p2:Piece>                        </p2:Weight>                    </p2:Baggage>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Atol_Mth>NONE</p2:Atol_Mth>                </p2:Flt_Extra>            </p2:Flt_Extra_Cat>        </p2:Flt_Extra_Cat_List>        <p2:CurISO>GBP</p2:CurISO>        <p2:Fast_Seller>S</p2:Fast_Seller>        <p2:Acc_Prc_Zero_Fg>false</p2:Acc_Prc_Zero_Fg>        <p2:Acc_Cost_Zero_Fg>false</p2:Acc_Cost_Zero_Fg>        <p2:Atol_Prot_Tp>PKG</p2:Atol_Prot_Tp>        <p2:Atol_Prot_By>TO</p2:Atol_Prot_By>        <p2:Atol_Prot_Issuer>TO</p2:Atol_Prot_Issuer>        <p2:Summary_Prices>            <p2:Summary_Price>                <p2:Prc_Tp_Cd>ACC</p2:Prc_Tp_Cd>                <p2:Prc_Tp_Name>Package Price</p2:Prc_Tp_Name>                <p2:Qty>2</p2:Qty>                <p2:Prc>981.25</p2:Prc>            </p2:Summary_Price>        </p2:Summary_Prices>    </p2:Bkg_Ent>    <p2:Agt_No>WAGBP</p2:Agt_No>    <p2:Cus CusId=\"39850\" SysId=\"MUSY\" MandatorId=\"T\" />    <p2:CusDet>        <p2:CusId>39850</p2:CusId>        <p2:SysId>MUSY</p2:SysId>        <p2:MandatorId>T</p2:MandatorId>        <p2:Person>            <p2:Add>                <p2:Name>Test Address</p2:Name>                <p2:Street>Test Address Second Line</p2:Street>                <p2:ZipCode>CR 3WR</p2:ZipCode>                <p2:City>Test Town</p2:City>                <p2:CountryISOCode>GBR</p2:CountryISOCode>            </p2:Add>            <p2:Comm>                <p2:CommType>TYPE_MOBILE</p2:CommType>                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>                <p2:AreaCode></p2:AreaCode>                <p2:Num>44 11101110111</p2:Num>            </p2:Comm>  " +
                "          <p2:Email>                <p2:Address>email@email.com</p2:Address>                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>            </p2:Email>            <p2:Sex>SEX_UNKNOWN</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>    </p2:CusDet>    <p2:TrvDox>        <p2:DocumentReceiver>PAYER</p2:DocumentReceiver>        <p2:DoxLang>en_EN</p2:DoxLang>        <p2:Next_Travel_Dox_Prt_Dt>2020-07-04T23:59:59.000+01:00</p2:Next_Travel_Dox_Prt_Dt>        <p2:ConfPrt>false</p2:ConfPrt>        <p2:Travel_Dox_Stop>false</p2:Travel_Dox_Stop>        <p2:Conf_Stop>false</p2:Conf_Stop>        <p2:Travel_Dox_No_Price>false</p2:Travel_Dox_No_Price>        <p2:Travel_Dox_Per_Person>false</p2:Travel_Dox_Per_Person>        <p2:Print_Voucher_Immed>false</p2:Print_Voucher_Immed>        <p2:EDox_Generation>false</p2:EDox_Generation>    </p2:TrvDox>    <p2:PayData>        <p2:Dpt Type=\"LOW\">            <p2:CurISO>GBP</p2:CurISO>            " +
                $"<p2:Amt>{bookingDespositAmount}</p2:Amt>            <p2:Dep_Dt>2020-05-26</p2:Dep_Dt>        </p2:Dpt>        <p2:Bkg_Prc_Ex>            <p2:CurISO>GBP</p2:CurISO>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>        </p2:Bkg_Prc_Ex>        <p2:Bkg_Prc_Inc>            <p2:CurISO>GBP</p2:CurISO>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>            <p2:Bal_Due_Amt>0.00</p2:Bal_Due_Amt>            <p2:Bal_Due_Dt>2020-06-16</p2:Bal_Due_Dt>        </p2:Bkg_Prc_Inc>        <p2:Pay>            <p2:CCPay CCType=\"CARD\" Card_Issuer=\"DL\" Card_Cd=\"DL\" Card_Desc=\"Visa Debit\">                <p2:CNum>XXXXXXXXXXXX1111</p2:CNum>                <p2:ExpDate>10/20</p2:ExpDate> " +
                $"               <p2:PayAmt>{bookingPaymentAmount}</p2:PayAmt>                <p2:Is_Loyalty_Card>false</p2:Is_Loyalty_Card>            </p2:CCPay>            <p2:Pay_Seq>1</p2:Pay_Seq>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>            <p2:Exch_Rate>1.00</p2:Exch_Rate>            <p2:CurISO>GBP</p2:CurISO>            <p2:AuthCode>500040609</p2:AuthCode>            <p2:TransNo>883590502923253A</p2:TransNo>            <p2:PayDtTm>2020-05-26T15:22:06.000+01:00</p2:PayDtTm>            <p2:PayDetails>ADYEN</p2:PayDetails>            <p2:Pay_Group Code=\"CARD\" Name=\"Card\" />            <p2:AuthSys>EasyJetPGS</p2:AuthSys>            <p2:Pay_Type_Code>DL</p2:Pay_Type_Code>            <p2:Pay_Method Code=\"DL\" Name=\"Visa Debit\" />            <p2:Settle_Method>L</p2:Settle_Method>            <p2:Recon_Type>CARD</p2:Recon_Type>            <p2:Recon_Method>MAN</p2:Recon_Method>            <p2:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holdiays VRP User\" />            <p2:Pay_Id>2153016388</p2:Pay_Id> " +
                $"           <p2:Bal_Refund_Amt>{bookingPaymentAmount}</p2:Bal_Refund_Amt>        </p2:Pay>        <p2:Pay>            <p2:Pay_Seq>2</p2:Pay_Seq>     " +
                $"       <p2:Amt>{bookingDespositAmount}</p2:Amt>            <p2:Exch_Rate>1.00</p2:Exch_Rate>            <p2:CurISO>GBP</p2:CurISO>            <p2:PayDtTm>2020-05-26T15:22:07.000+01:00</p2:PayDtTm>            <p2:Pay_Group Code=\"CA\" Name=\"Cash\" />            <p2:Pay_Type_Code>TRF</p2:Pay_Type_Code>            <p2:Pay_Method Code=\"CR\" Name=\"Credit Refund Redeemed\" />            <p2:Settle_Method>Y</p2:Settle_Method>            <p2:Recon_Type>CASH</p2:Recon_Type>            <p2:Recon_Method>MAN</p2:Recon_Method>            <p2:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holdiays VRP User\" />            <p2:Pay_Id>2153016579</p2:Pay_Id>" +
                $"            <p2:Bal_Refund_Amt>{bookingDespositAmount}</p2:Bal_Refund_Amt>        </p2:Pay>" +
                $"        <p2:Tot_Amt>{bookingDespositAmount + bookingPaymentAmount}</p2:Tot_Amt>        <p2:Agt_Com>0.00</p2:Agt_Com>        <p2:Comm_Inc_VAT>0.00</p2:Comm_Inc_VAT>        <p2:VAT>0.00</p2:VAT>        <p2:Payment_Received>1962.50</p2:Payment_Received>        <p2:TO_Comm_Amt>0.00</p2:TO_Comm_Amt>        <p2:TO_Comm_Amt_Calc>0.00</p2:TO_Comm_Amt_Calc>    </p2:PayData>    <p2:Pax Age=\"31\" Index=\"1\">        <p2:Person>            <p2:FirstName>First Guest Name</p2:FirstName>            <p2:LastName>First Guest Surname</p2:LastName>            <p2:DateOfBirth>1989-07-10</p2:DateOfBirth>            <p2:Title>Miss</p2:Title>            <p2:Sex>SEX_FEMALE</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>        <p2:Pax_Tp>ADULT</p2:Pax_Tp>        <p2:Lead_Pax>true</p2:Lead_Pax>    </p2:Pax>    <p2:Pax Age=\"30\" Index=\"2\">        <p2:Person>            <p2:FirstName>Kjghkjg</p2:FirstName>            <p2:LastName>Dfgdfg</p2:LastName>            <p2:Title>Miss</p2:Title>            <p2:Sex>SEX_FEMALE</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>        <p2:Pax_Tp>ADULT</p2:Pax_Tp>    </p2:Pax>    <p2:DD_Marketing_Sts>V0</p2:DD_Marketing_Sts>    <p2:Prom Code=\"EUBF\" Issue=\"1\" Name=\"easyJet Holidays Beach - Family\" Prom_Group_Code=\"EJH\" />    <p2:Incident_Sts>NA</p2:Incident_Sts>    <p2:Insurance_Method>INT</p2:Insurance_Method>    <p2:Retail_Bkg_Id>-1</p2:Retail_Bkg_Id>    <p2:Bkg_Type_Mth>RET</p2:Bkg_Type_Mth>    <p1:Amendments>        <p1:Bkg Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Route Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Accom Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Item Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Flight_Extra Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Car_Rental Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Cruise Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Pax Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Memo Add=\"true\" Amend=\"true\" Cancel=\"true\" />    </p1:Amendments></p1:DisplayResponse>";

            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()
            )
            .InScenario("Credit booking")
            .WillSetStateTo("Check booking on lock")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody(expectedBookingResponse)
            );

            // DisplayMemoCodes
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()
            )
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Atcom", "DisplayMemoResponse_VALID_REF.xml")))
            );

            // Check on lock status
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()

            )
            .InScenario("Credit booking")
            .WhenStateIs("Check booking on lock")
            .WillSetStateTo("Modify memo CRED")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("<p1:DisplayMemoResponse xmlns:p1=\"AtComRes/DisplayMemoResponse\" xmlns:p2=\"AtComRes/Common\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"AtComRes/DisplayMemoResponse ../api/DisplayMemoResponse/DisplayMemoResponse.xsd\">    <!-- Response returned from: EZYTST.EJH.ATCOM -->    <p2:Adm Xsd_Ver=\"T3.20.4.8\">        <p2:ReqId>xxx</p2:ReqId>        <p2:Tm>2020-06-11T10:42:44.750+01:00</p2:Tm>        <p2:Trk From=\"atcomres\" To=\"musyk\" />    </p2:Adm>    <p2:CltInfo>        <p2:Locale>en_EN</p2:Locale>        <p2:CltSysContext>3</p2:CltSysContext>        <p2:Agt_No>WAGBP</p2:Agt_No>        <p2:TermCode>ABCD</p2:TermCode>        <p2:User_Name>EZYVRP</p2:User_Name>        <p2:Chan>inhouse</p2:Chan>        <p2:Channel_Type>VRP</p2:Channel_Type>        <p2:User_Role>INTERNAL</p2:User_Role>    </p2:CltInfo>    <p2:BkgNum>        <p2:BkgId>1000001</p2:BkgId>        <p2:CurrentVersion>8</p2:CurrentVersion>    </p2:BkgNum>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:38.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:OC</p2:Memo_Cd>        <p2:Memo_Name>Opt created</p2:Memo_Name>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28909</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>1</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:42.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:OB</p2:Memo_Cd>        <p2:Memo_Name>Opt to booking</p2:Memo_Name>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28912</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>4</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:44.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:AB</p2:Memo_Cd>        <p2:Memo_Name>Amended Booking</p2:Memo_Name>        <p2:Memo_Des>Fees calculated using Amendment Market: B2CU B2C £</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28915</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>7</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>bulk cancelation</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48503</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>8</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:CNXO</p2:Memo_Cd>        <p2:Memo_Name>Cancellation Charge Overridden</p2:Memo_Name>        <p2:Memo_Des>Cancellation Charge Overridden from 899.20</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48504</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>9</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:CB</p2:Memo_Cd>        <p2:Memo_Name>Cancelled Booking</p2:Memo_Name>        <p2:Memo_Des>Fees calculated using Amendment Market: B2CU B2C £</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48502</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>10</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T13:50:43.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67805</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>13</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T13:57:34.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67765</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>14</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T14:13:02.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67775</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>15</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T14:23:00.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67777</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>16</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-06T10:15:47.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>Simple text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>69027</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>18</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo></p1:DisplayMemoResponse>")
            );

            // Modify memo CRED
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .WithBody(new RegexMatcher($"<p1:Memo_Cd>CRED</p1:Memo_Cd>"))
                    .UsingPost()

            )
            .InScenario("Credit booking")
            .WhenStateIs("Modify memo CRED")
            .WillSetStateTo("Add payment info for goodwill")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("<p2:ModifyMemoResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyMemoResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:09.584+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa0rAAm</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079763</p1:BkgId></p1:BkgNum><p1:Memo><p1:Memo_Dt>2020-06-07T01:00:09.000+01:00</p1:Memo_Dt><p1:Memo_Cd>CRED</p1:Memo_Cd><p1:Memo_Name>Customer Credit</p1:Memo_Name><p1:Memo_Des>Voucher created with ids: bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund, 120 £</p1:Memo_Des><p1:Memo_User_Name>EZYVRP</p1:Memo_User_Name><p1:Memo_User_Desc>easyJet Holidays VRP User</p1:Memo_User_Desc><p1:Memo_Key>1267062</p1:Memo_Key><p1:Memo_Rights>READ</p1:Memo_Rights><p1:Memo_Rights>WRITE</p1:Memo_Rights><p1:Memo_Rights>DELETE</p1:Memo_Rights><p1:Memo_Seq>24</p1:Memo_Seq><p1:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" /></p1:Memo></p2:ModifyMemoResponse>")
            );

            // Add payment info for goodwill
            atcomServer.Given(
               Request.Create()
                   .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                   .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                   .WithBody(new RegexMatcher($"<p1:PayAmt>-{bookingDespositAmount}</p1:PayAmt>"))
                   .UsingPost()
           )
           .InScenario("Credit booking")
           .WhenStateIs("Add payment info for goodwill")
           .WillSetStateTo("Add payment info for refund")
           .RespondWith(
               Response.Create()
                   .WithStatusCode(200)
                   .WithBody("<p2:ModifyCustPaymentResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyCustPaymentResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:17.323+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa2iAAl</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079989</p1:BkgId><p1:CurrentVersion>14</p1:CurrentVersion></p1:BkgNum><p1:BkgSts>CANCELED</p1:BkgSts><p1:His><p1:Bkg_Dt_Tm>2020-02-16T16:07:40.000+01:00</p1:Bkg_Dt_Tm><p1:Bkg_User>EZYVRP</p1:Bkg_User><p1:Bkg_Term_Code>ABCD</p1:Bkg_Term_Code><p1:Bkg_Chan>inhouse</p1:Bkg_Chan><p1:Amd_Dt_Tm>2020-06-07T01:00:16.000+01:00</p1:Amd_Dt_Tm><p1:Amd_User>EZYVRP</p1:Amd_User><p1:Amd_Term_Code>ABCD</p1:Amd_Term_Code><p1:Amd_Chan>inhouse</p1:Amd_Chan></p1:His><p1:PayData><p1:Pay><p1:Pay_Seq>2</p1:Pay_Seq><p1:Amt>-120.00</p1:Amt><p1:Exch_Rate>1.00</p1:Exch_Rate><p1:CurISO>GBP</p1:CurISO><p1:PayDtTm>2020-06-07T01:00:17.000+01:00</p1:PayDtTm><p1:Pay_Group Code=\"CA\" Name=\"Cash\" /><p1:Pay_Type_Code>TRF</p1:Pay_Type_Code><p1:Pay_Method Code=\"CI\" Name=\"Credit Refund Issued\" /><p1:Settle_Method>Y</p1:Settle_Method><p1:Recon_Type>CASH</p1:Recon_Type><p1:Recon_Method>MAN</p1:Recon_Method><p1:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holidays VRP User\" /><p1:Pay_Id>2163234244</p1:Pay_Id><p1:Bal_Refund_Amt>-120.00</p1:Bal_Refund_Amt></p1:Pay></p1:PayData></p2:ModifyCustPaymentResponse>")
            );

            // Add payment info for refund
            atcomServer.Given(
               Request.Create()
                   .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                   .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                   .WithBody(new RegexMatcher($"<p1:PayAmt>-{bookingPaymentAmount}</p1:PayAmt>"))
                   .UsingPost()
           )
           .InScenario("Credit booking")
           .WhenStateIs("Add payment info for refund")
           .WillSetStateTo("Modify memo REP3")
           .RespondWith(
               Response.Create()
                   .WithStatusCode(200)
                   .WithBody("<p2:ModifyCustPaymentResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyCustPaymentResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:17.323+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa2iAAl</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079989</p1:BkgId><p1:CurrentVersion>14</p1:CurrentVersion></p1:BkgNum><p1:BkgSts>CANCELED</p1:BkgSts><p1:His><p1:Bkg_Dt_Tm>2020-02-16T16:07:40.000+01:00</p1:Bkg_Dt_Tm><p1:Bkg_User>EZYVRP</p1:Bkg_User><p1:Bkg_Term_Code>ABCD</p1:Bkg_Term_Code><p1:Bkg_Chan>inhouse</p1:Bkg_Chan><p1:Amd_Dt_Tm>2020-06-07T01:00:16.000+01:00</p1:Amd_Dt_Tm><p1:Amd_User>EZYVRP</p1:Amd_User><p1:Amd_Term_Code>ABCD</p1:Amd_Term_Code><p1:Amd_Chan>inhouse</p1:Amd_Chan></p1:His><p1:PayData><p1:Pay><p1:Pay_Seq>2</p1:Pay_Seq><p1:Amt>-120.00</p1:Amt><p1:Exch_Rate>1.00</p1:Exch_Rate><p1:CurISO>GBP</p1:CurISO><p1:PayDtTm>2020-06-07T01:00:17.000+01:00</p1:PayDtTm><p1:Pay_Group Code=\"CA\" Name=\"Cash\" /><p1:Pay_Type_Code>TRF</p1:Pay_Type_Code><p1:Pay_Method Code=\"CI\" Name=\"Credit Refund Issued\" /><p1:Settle_Method>Y</p1:Settle_Method><p1:Recon_Type>CASH</p1:Recon_Type><p1:Recon_Method>MAN</p1:Recon_Method><p1:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holidays VRP User\" /><p1:Pay_Id>2163234244</p1:Pay_Id><p1:Bal_Refund_Amt>-120.00</p1:Bal_Refund_Amt></p1:Pay></p1:PayData></p2:ModifyCustPaymentResponse>")
            );

            // Modify memo REP3
            atcomServer.Given(
               Request.Create()
                   .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                   .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                   .WithBody(new RegexMatcher($"<p1:Memo_Cd>REP3</p1:Memo_Cd>"))
                   .UsingPost()
           )
           .InScenario("Credit booking")
           .WhenStateIs("Modify memo REP3")
           .RespondWith(
               Response.Create()
                   .WithStatusCode(200)
                   .WithBody("<p2:ModifyMemoResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyMemoResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:09.584+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa0rAAm</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079763</p1:BkgId></p1:BkgNum><p1:Memo><p1:Memo_Dt>2020-06-07T01:00:09.000+01:00</p1:Memo_Dt><p1:Memo_Cd>Rep1</p1:Memo_Cd><p1:Memo_Name>Customer Credit</p1:Memo_Name><p1:Memo_Des>bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund</p1:Memo_Des><p1:Memo_User_Name>EZYVRP</p1:Memo_User_Name><p1:Memo_User_Desc>easyJet Holidays VRP User</p1:Memo_User_Desc><p1:Memo_Key>1267062</p1:Memo_Key><p1:Memo_Rights>READ</p1:Memo_Rights><p1:Memo_Rights>WRITE</p1:Memo_Rights><p1:Memo_Rights>DELETE</p1:Memo_Rights><p1:Memo_Seq>24</p1:Memo_Seq><p1:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" /></p1:Memo></p2:ModifyMemoResponse>")
            );

            var voucherifyServer = SpawnServer("VoucherifyMockServer",
                new WireMockServerSettings
                {
                    FileSystemHandler =
                        new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, "voucherify"),
                    StartAdminInterface = true,
                    ReadStaticMappings = true,
                    WatchStaticMappings = true,
                    WatchStaticMappingsInSubdirectories = true
                });

            // Mock create voucherify customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithParam("email", "email@email.com")
                    .WithParam("limit", "1")
                    .UsingGet()
            )
            .InScenario("Get customer")
            .WillSetStateTo("Customer is not created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBodyAsJson(new { })
            );

            // Mock get creating customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithBody(new JsonMatcher(new { name = "email@email.com", email = "email@email.com", metadata = new Dictionary<string, string>() { { "lang", "eng" } } }))
                    .UsingPost()
            )
            .InScenario("Get customer")
            .WhenStateIs("Customer is not created")
            .WillSetStateTo("Customer created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"source_id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"name\":\"Oleg\",\"email\":\"email@email.com\",\"description\":\"Premium user, ACME Inc.\",\"address\":{\"city\":\"Melbourne\",\"state\":\"FL\",\"line_1\":\"226 E Fee Ave\",\"line_2\":null,\"country\":\"Australia\",\"postal_code\":\"32901\"},\"summary\":{\"redemptions\":{\"total_redeemed\":0,\"total_failed\":0,\"total_succeeded\":0,\"total_rolled_back\":0,\"total_rollback_failed\":0,\"total_rollback_succeeded\":0,\"gift\":{\"redeemed_amount\":0,\"amount_to_go\":0}},\"orders\":{\"total_amount\":0,\"total_count\":0,\"average_amount\":0,\"last_order_amount\":0,\"last_order_date\":null}},\"loyalty\":{\"points\":0,\"referred_customers\":0},\"metadata\":{\"lang\":\"en\"},\"created_at\":\"2016-11-15T15:41:44Z\",\"object\":\"customer\"}")
            );

            // Mock get customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithParam("email", "email@email.com")
                    .WithParam("limit", "1")
                    .UsingGet()
            )
            .InScenario("Get customer")
            .WhenStateIs("Customer created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"object\":\"list\",\"has_more\":false,\"total\":1,\"data_ref\":\"customers\",\"customers\":[{\"object\":\"customer\",\"id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"source_id\":null,\"name\":\" \",\"description\":null,\"email\":\"email@email.com\",\"metadata\":{\"lang\":\"end\"},\"created_at\":\"2020-06-07T14:15:16.073Z\",\"address\":{\"city\":null,\"state\":null,\"line_1\":null,\"line_2\":null,\"country\":null,\"postal_code\":null},\"summary\":{\"redemptions\":{\"total_redeemed\":0,\"total_failed\":0,\"total_succeeded\":0,\"total_rolled_back\":0,\"total_rollback_failed\":0,\"total_rollback_succeeded\":0},\"orders\":{\"total_amount\":0,\"total_count\":0,\"average_amount\":0,\"last_order_amount\":0,\"last_order_date\":null}},\"loyalty\":{\"points\":0,\"referred_customers\":0,\"campaigns\":{}},\"updated_at\":null,\"phone\":null,\"birthday\":null}]}")
            );

            // Mock creating voucher goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JmesPathMatcher(
                        "type == 'GIFT_VOUCHER'",
                        "campaign == 'easyJet-credit'",
                        "category == 'ej Holidays'",
                        $"metadata.currency == 'GBP'",
                        $"metadata.source == 'Bulk Tool'",
                        $"metadata.action == 'cancel and credit'",
                        $"metadata.booking_ref == '{reference}'",
                        $"metadata.reason == 'goodwill'"
                        ))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WillSetStateTo("Voucher for goodwill is created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"v_30XK8y8H438FXJk7ag54sMuJzhzpvSkI\",\"code\":\"bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-goodwill\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1200,\"balance\":1200},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"publish\":{\"object\":\"list\",\"count\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/redemptions?page=1&limit=10\"},\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1067166\"},\"is_referral_code\":false,\"updated_at\":null,\"object\":\"voucher\"}")
            );

            // Mock add amount to voucher goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JsonMatcher(new { amount = bookingDespositAmount * 100 }))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher for goodwill is created")
            .WillSetStateTo("Voucher goodwill ready to publish")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("")
            );

            // Mock pusblish voucher for goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/vouchers/publish")
                    .WithBody(new JmesPathMatcher("customer.id == 'cust_ZJwRsO3KEQaeizIkeNk7ZqPo'"))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher goodwill ready to publish")
            .WillSetStateTo("Voucher for goodwill is published")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"pub_a78ylda8fw6JpM7pqBU6g6QdWnwjyWcq\",\"object\":\"publication\",\"created_at\":\"2020-06-07T00:00:09.367Z\",\"customer_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"tracking_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"metadata\":{},\"channel\":\"API\",\"result\":\"SUCCESS\",\"customer\":{\"object\":\"customer\",\"id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\"},\"voucher\":{\"id\":\"v_w2FrJM04dw34Nx50flsGwweHJf0PxNKS\",\"code\":\"bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1000,\"balance\":1000},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00.000Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1079763\"},\"is_referral_code\":false,\"created_at\":\"2020-06-07T00:00:09.266Z\",\"updated_at\":\"2020-06-07T00:00:09.377Z\",\"holder_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"object\":\"voucher\",\"publish\":{\"object\":\"list\",\"count\":1,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-goodwill\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/redemptions?page=1&limit=10\"}}}")
            );

            // Mock creating voucher refund
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JmesPathMatcher(
                        "type == 'GIFT_VOUCHER'",
                        "campaign == 'easyJet-credit'",
                        "category == 'ej Holidays'",
                        $"metadata.currency == 'GBP'",
                        $"metadata.source == 'Bulk Tool'",
                        $"metadata.action == 'cancel and credit'",
                        $"metadata.booking_ref == '{reference}'",
                        $"metadata.reason == 'refund'"
                        ))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher for goodwill is published")
            .WillSetStateTo("Voucher for refund is created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"v_30XK8y8H438FXJk7ag54sMuJzhzpvSkI\",\"code\":\"bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":184250,\"balance\":184250},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"publish\":{\"object\":\"list\",\"count\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/redemptions?page=1&limit=10\"},\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1067166\"},\"is_referral_code\":false,\"updated_at\":null,\"object\":\"voucher\"}")
            );

            // Mock add amount to voucher goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JsonMatcher(new { amount = bookingPaymentAmount * 100 }))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher for refund is created")
            .WillSetStateTo("Voucher refund ready to publish")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("")
            );

            // Mock pusblish voucher for refund
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/vouchers/publish")
                    .WithBody(new JmesPathMatcher("customer.id == 'cust_ZJwRsO3KEQaeizIkeNk7ZqPo'"))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher refund ready to publish")
            .WillSetStateTo("Voucher refund is published")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"pub_a78ylda8fw6JpM7pqBU6g6QdWnwjyWcq\",\"object\":\"publication\",\"created_at\":\"2020-06-07T00:00:09.367Z\",\"customer_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"tracking_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"metadata\":{},\"channel\":\"API\",\"result\":\"SUCCESS\",\"customer\":{\"object\":\"customer\",\"id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\"},\"voucher\":{\"id\":\"v_w2FrJM04dw34Nx50flsGwweHJf0PxNKS\",\"code\":\"bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1000,\"balance\":1000},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00.000Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1079763\"},\"is_referral_code\":false,\"created_at\":\"2020-06-07T00:00:09.266Z\",\"updated_at\":\"2020-06-07T00:00:09.377Z\",\"holder_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"object\":\"voucher\",\"publish\":{\"object\":\"list\",\"count\":1,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/redemptions?page=1&limit=10\"}}}")
            );

            ApplyManyConfigurationFields(new[]
            {
                new KeyValuePair<string, string>("Voucherify:Host", voucherifyServer.Url),
                new KeyValuePair<string, string>("Atcom:Search:Host", atcomServer.Url),
                new KeyValuePair<string, string>("Atcom:Booking:Host", atcomServer.Url)
            });

            Client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("yeymtmwg0mzdt80chqveeopojn897s58yciqfhvl508mpq4dmna9w907617q");

            // Act
            var response = await Client.PostAsync($"/api/v1/cancellationandrefund/cancelandrefund", content);

            var responseContent = await response.Content.ReadAsStringAsync();
            var bulkToolResponse = JsonConvert.DeserializeObject<BulkToolResponse>(responseContent);

            // Assert
            using (new AssertionScope())
            {
                response.StatusCode.Should().Be(HttpStatusCode.OK);
                bulkToolResponse.CorrelationId.Should().NotBeNull();
                bulkToolResponse.Reference.Should().Be(reference);
                bulkToolResponse.Note.Should().NotBeNull();
                bulkToolResponse.Message.Should().Be("Successfully canceled and credited");
            }
        }

        [Trait("Api", "/api/v1.0/cancellationandrefund/cancelandrefund")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineData("1000001", "cancel and credit", 120, 1000, "Booking not found")]
        public async Task CancelAndRefund_BookingValidAndNotAcceptableErrorsInAtcomResponse_ReturnResponseWithException(string reference, string flag, int bookingDespositAmount, int bookingPaymentAmount, string expectedErrorMessage)
        {
            // Arrange
            var request = new BulkToolRequest()
            {
                Booking = new Domain.Data.BulkToolBooking.Booking()
                {
                    Reference = reference,
                    Flag = flag,
                }
            };

            HttpContent content = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");
            var atcomServer = SpawnServer("AtcomWireMockServer");

            // Get booking
            // Expected booking response
            string expectedBookingResponse = $"<p1:DisplayResponse xmlns:p2=\"AtComRes/Common\" xmlns:p1=\"AtComRes/DisplayResponse\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"AtComRes/DisplayResponse ../api/DisplayResponse/DisplayResponse.xsd\">    <!-- Response returned from: EZYTST.EJH.ATCOM -->    <p2:Adm Xsd_Ver=\"T3.20.4.8\">        <p2:ReqId>12133</p2:ReqId>        <p2:Tm>2020-06-11T10:31:26.135+01:00</p2:Tm>        <p2:Trk From=\"atcomres\" To=\"musyk\" />        <p2:Ser_Msg>            <p2:Severity>ERROR</p2:Severity>            <p2:Code>E14544</p2:Code>            <p2:Desc>Flight Not Matched to Flight on Booking.</p2:Desc>        </p2:Ser_Msg> </p2:Adm>    <p2:CltInfo>        <p2:Locale>en_EN</p2:Locale>        <p2:CltSysContext>3</p2:CltSysContext>        <p2:Agt_No>WAGBP</p2:Agt_No>        <p2:TermCode>ABCD</p2:TermCode>        <p2:User_Name>EZYVRP</p2:User_Name>        <p2:Chan>inhouse</p2:Chan>        <p2:Channel_Type>VRP</p2:Channel_Type>        <p2:User_Role>INTERNAL</p2:User_Role>    </p2:CltInfo>    <p2:BkgNum>        <p2:BkgId>" + reference + "</p2:BkgId>        <p2:CurrentVersion>4</p2:CurrentVersion>        <p2:AtcomresBkgVersion></p2:AtcomresBkgVersion>    </p2:BkgNum>    <p2:BkgSts>CANCELED</p2:BkgSts>    <p2:ResSts>CONFIRMED</p2:ResSts>    <p2:HasAgt_Notice>false</p2:HasAgt_Notice>    <p2:His>        <p2:Bkg_Dt_Tm>2020-05-26T15:22:01.000+01:00</p2:Bkg_Dt_Tm>        <p2:Bkg_User>EZYVRP</p2:Bkg_User>        <p2:Bkg_Term_Code>ABCD</p2:Bkg_Term_Code>        <p2:Bkg_Chan>inhouse</p2:Bkg_Chan>        <p2:Amd_Dt_Tm>2020-06-03T14:16:56.000+01:00</p2:Amd_Dt_Tm>        <p2:Amd_User>EZYVRP</p2:Amd_User>        <p2:Amd_Term_Code>ABCD</p2:Amd_Term_Code>        <p2:Amd_Chan>inhouse</p2:Amd_Chan>    </p2:His>    <p2:Bkg_Ent>        <p2:Package>            <p2:Accom>                <p2:Id>1</p2:Id>                <p2:St_Dt>2020-08-15</p2:St_Dt>                <p2:End_Dt>2020-08-22</p2:End_Dt>                <p2:HtlPrd>                    <p2:Name>                        <![CDATA[Iberostar Creta Panorama & Mare]]>                    </p2:Name>                    <p2:Prom Code=\"EUBF\" Issue=\"1\" Name=\"easyJet Holidays Beach - Family\" />                    <p2:Acc_Cd Accom_Id=\"2151635610/2\">GRCR0009</p2:Acc_Cd>                    <p2:Acc_InvState>INTERNAL</p2:Acc_InvState>                    <p2:Hotel>                        <p2:Add>                            <p2:Name>                                <![CDATA[Iberostar Creta Panorama & Mare]]>                            </p2:Name>                            <p2:Street>Panorama, Ag Rafail</p2:Street>                            <p2:HouseNo>741</p2:HouseNo>                            <p2:ZipCode>28300</p2:ZipCode>                            <p2:City>Rethymnon</p2:City>                            <p2:Region>Crete</p2:Region>                            <p2:CountryISOCode>GR</p2:CountryISOCode>                        </p2:Add>                        <p2:Comm>                            <p2:CommType>TYPE_PHONE</p2:CommType>                            <p2:Sphere>SPHERE_BUSINESS</p2:Sphere>                            <p2:AreaCode></p2:AreaCode>                            <p2:Num>2834051502</p2:Num>                        </p2:Comm>                        <p2:Star_Rating>4</p2:Star_Rating>                        <p2:Loc>                            <p2:Loc_Cd>GRCRRE</p2:Loc_Cd>                            <p2:Loc_Tp>CITY</p2:Loc_Tp>                            <p2:Loc_Name>Rethymnon</p2:Loc_Name>                        </p2:Loc>                    </p2:Hotel>                    <p2:Cat_Page>                        <p2:Catalog Code=\"EUBF\" Name=\"easyJet Holidays Beach - Family\" />                        <p2:Cat_Page_No>0</p2:Cat_Page_No>                        <p2:Prc_Cat_Page_No>0</p2:Prc_Cat_Page_No>                    </p2:Cat_Page>                    <p2:Corporate_Cd>GRCR0009</p2:Corporate_Cd>                </p2:HtlPrd>                <p2:Rm_Cd>                    <p2:Rm_No>1</p2:Rm_No>                    <p2:Code>B01</p2:Code>                    <p2:Desc>Bungalow with Garden View and Balcony or Terrace</p2:Desc>                    <p2:Fac_List>Garden View, Balcony or Terrace, Double or Twin Beds, Shower or Bath, Air Conditioning, WC, 1 Extra Bed in Bedroom</p2:Fac_List>                    <p2:Facility_List>                        <p2:Facility Code=\"GV\" Name=\"Garden View\" />                        <p2:Facility Code=\"BOT\" Name=\"Balcony or Terrace\" />                        <p2:Facility Code=\"DOTB\" Name=\"Double or Twin Beds\" />                        <p2:Facility Code=\"SOB\" Name=\"Shower or Bath\" />                        <p2:Facility Code=\"AC\" Name=\"Air Conditioning\" />                        <p2:Facility Code=\"WC\" Name=\"WC\" />                        <p2:Facility Code=\"EB1\" Name=\"1 Extra Bed in Bedroom\" />                    </p2:Facility_List>                    <p2:Inf_Inc_Occ>true</p2:Inf_Inc_Occ>                    <p2:Min_Pax>2</p2:Min_Pax>                    <p2:Max_Pax>3</p2:Max_Pax>                    <p2:Max_Adu>3</p2:Max_Adu>                    <p2:Max_Chd>2</p2:Max_Chd>                    <p2:Max_Inf>1</p2:Max_Inf>                    <p2:BB_Cd>HB</p2:BB_Cd>                    <p2:BB_Name>Half Board</p2:BB_Name>                    <p2:Alt_BB_Cd>AI</p2:Alt_BB_Cd>                    <p2:Ser_Sts>FIX</p2:Ser_Sts>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">981.25</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">981.25</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Prices>                        <p2:Price>                            <p2:Prc_Cd>AA</p2:Prc_Cd>                            <p2:Prc_Cd_Name>Package Price</p2:Prc_Cd_Name>                            <p2:Prc_Cd_Tp>ACC</p2:Prc_Cd_Tp>                            <p2:Qty>2</p2:Qty>                            <p2:Prc CurISO=\"GBP\">981.25</p2:Prc>                            <p2:Prc_Dt>2020-05-26T15:22:01.000+01:00</p2:Prc_Dt>                            <p2:PricePaxs>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Id>2</p2:Pax_Id>                            </p2:PricePaxs>                            <p2:Visible>true</p2:Visible>                            <p2:Prc_Sts>STK</p2:Prc_Sts>                        </p2:Price>                    </p2:Prices>                </p2:Rm_Cd>                <p2:Ref_Prd_Id>2</p2:Ref_Prd_Id>                <p2:Free_Car_Rental_Poss>false</p2:Free_Car_Rental_Poss>                <p2:Atol_Mth>APP</p2:Atol_Mth>            </p2:Accom>            <p2:Route_List>                <p2:Routing Routing_Type=\"OW\">                    <p2:Routing_Id>2</p2:Routing_Id>                    <p2:Route Rt_Dir=\"outbound\">                        <p2:RouteCd>HERLTN6ALTNHER</p2:RouteCd>                        <p2:Flt_Inv_Id>2150961969</p2:Flt_Inv_Id>                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>                        <p2:Dep_Air_Cd>LTN</p2:Dep_Air_Cd>                        <p2:Arr_Air_Cd>HER</p2:Arr_Air_Cd>                        <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                            <p2:Local>2020-08-15T14:45:00+01:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                            <p2:Local>2020-08-15T20:45:00+03:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Duration>7</p2:Duration>                        <p2:Cycle_Dt>2020-08-15</p2:Cycle_Dt>                        <p2:JnyDur>04:00</p2:JnyDur>                        <p2:Prom Code=\"EUFO\" Issue=\"1\" Name=\"Flight Only\" />                        <p2:Car_Cd>EZY</p2:Car_Cd>                        <p2:Flt_No>2351</p2:Flt_No>                        <p2:Bkg_Cls Code=\"Y\" />                        <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                        <p2:Flt_Seq_Cd>A</p2:Flt_Seq_Cd>                        <p2:Sec>                            <p2:Id>2</p2:Id>                            <p2:SecId>1</p2:SecId>                            <p2:Dep_Air_Cd>LTN</p2:Dep_Air_Cd>                            <p2:Arr_Air_Cd>HER</p2:Arr_Air_Cd>                            <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                                <p2:Local>2020-08-15T14:45:00+01:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                                <p2:Local>2020-08-15T20:45:00+03:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:JnyDur>04:00</p2:JnyDur>                            <p2:Car_Cd>EZY</p2:Car_Cd>                            <p2:Flt_No>2351</p2:Flt_No>                            <p2:Bkg_Cls Code=\"Y\" />                            <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                            <p2:Eqmt>A320</p2:Eqmt>                            <p2:EqmtDescription>Airbus Family</p2:EqmtDescription>                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        </p2:Sec>                        <p2:Ser_Sts>FIX</p2:Ser_Sts>                        <p2:SubServPaxs>                            <p2:SubServPax>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                            <p2:SubServPax>                                <p2:Pax_Id>2</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                        </p2:SubServPaxs>                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        <p2:Check_In Dir=\"DEPARTURE\">Main Terminal</p2:Check_In>                    </p2:Route>                    <p2:Route Rt_Dir=\"inbound\">                        <p2:RouteCd>HERLTN6AHERLTN</p2:RouteCd>                        <p2:Flt_Inv_Id>2150962255</p2:Flt_Inv_Id>                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>                        <p2:Dep_Air_Cd>HER</p2:Dep_Air_Cd>                        <p2:Arr_Air_Cd>LTN</p2:Arr_Air_Cd>                        <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                            <p2:Local>2020-08-22T21:30:00+03:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                            <p2:Local>2020-08-22T23:35:00+01:00</p2:Local>                        </p2:Flt_Dt_Tm>                        <p2:Duration>7</p2:Duration>                        <p2:Cycle_Dt>2020-08-22</p2:Cycle_Dt>                        <p2:JnyDur>04:05</p2:JnyDur>                        <p2:Prom Code=\"EUFO\" Issue=\"1\" Name=\"Flight Only\" />                        <p2:Car_Cd>EZY</p2:Car_Cd>                        <p2:Flt_No>2352</p2:Flt_No>                        <p2:Bkg_Cls Code=\"Y\" />                        <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                        <p2:Flt_Seq_Cd>A</p2:Flt_Seq_Cd>                        <p2:Sec>                            <p2:Id>3</p2:Id>                            <p2:SecId>2</p2:SecId>                            <p2:Dep_Air_Cd>HER</p2:Dep_Air_Cd>                            <p2:Arr_Air_Cd>LTN</p2:Arr_Air_Cd>                            <p2:Flt_Dt_Tm DirType=\"DEPARTURE\">                                <p2:Local>2020-08-22T21:30:00+03:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:Flt_Dt_Tm DirType=\"ARRIVAL\">                                <p2:Local>2020-08-22T23:35:00+01:00</p2:Local>                            </p2:Flt_Dt_Tm>                            <p2:JnyDur>04:05</p2:JnyDur>                            <p2:Car_Cd>EZY</p2:Car_Cd>                            <p2:Flt_No>2352</p2:Flt_No>                            <p2:Bkg_Cls Code=\"Y\" />                            <p2:Cab_Cls Code=\"Y\" Name=\"Economy\" />                            <p2:Eqmt>A320</p2:Eqmt>                            <p2:EqmtDescription>Airbus Family</p2:EqmtDescription>                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        </p2:Sec>                        <p2:Ser_Sts>FIX</p2:Ser_Sts>                        <p2:SubServPaxs>                            <p2:SubServPax>                                <p2:Pax_Id>1</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                            <p2:SubServPax>                                <p2:Pax_Id>2</p2:Pax_Id>                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>                                <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                            </p2:SubServPax>                        </p2:SubServPaxs>                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>                        <p2:Check_In Dir=\"DEPARTURE\">Main Terminal</p2:Check_In>                    </p2:Route>                </p2:Routing>            </p2:Route_List>        </p2:Package>        <p2:Item Code=\"GRCR0009HERS\" Name=\"Shared Transfer\" Auto_Inc=\"false\" Short_Name=\"Shared Transfer\">            <p2:Id>4</p2:Id>            <p2:St_Dt>2020-08-15</p2:St_Dt>            <p2:Set_Type>EXTRA</p2:Set_Type>            <p2:Item_Type Code=\"TF\">                <p2:Item_Type_Desc>                    <p2:Locale>EN_EN</p2:Locale>                    <p2:Desc>Transfer</p2:Desc>                </p2:Item_Type_Desc>            </p2:Item_Type>            <p2:Prom Code=\"AUCI\" Issue=\"1\" Name=\"Common Items\" />            <p2:Bkg_Qty>2</p2:Bkg_Qty>            <p2:Ser_Sts>FIX</p2:Ser_Sts>            <p2:SubServPaxs>                <p2:SubServPax>                    <p2:Pax_Id>1</p2:Pax_Id>                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>                    <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                </p2:SubServPax>                <p2:SubServPax>                    <p2:Pax_Id>2</p2:Pax_Id>                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>                    <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                </p2:SubServPax>            </p2:SubServPaxs>            <p2:Rate_Rule>DAY</p2:Rate_Rule>            <p2:Item_Method>PP</p2:Item_Method>            <p2:Atol_Mth>APP</p2:Atol_Mth>        </p2:Item>        <p2:Flt_Extra_Cat_List>            <p2:Flt_Inv_Id>2150961969</p2:Flt_Inv_Id>            <p2:Flt_Extra_Cat Code=\"BAG\" Name=\"Baggage\" Method=\"BAG\">                <p2:Flt_Extra Code=\"BAG\" Name=\"Baggage\">                    <p2:Class>Y</p2:Class>                    <p2:Baggage>                        <p2:Weight Cd=\"23\">                            <p2:Piece Cd=\"1\">0</p2:Piece>                        </p2:Weight>                    </p2:Baggage>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Atol_Mth>NONE</p2:Atol_Mth>                </p2:Flt_Extra>            </p2:Flt_Extra_Cat>        </p2:Flt_Extra_Cat_List>        <p2:Flt_Extra_Cat_List>            <p2:Flt_Inv_Id>2150962255</p2:Flt_Inv_Id>            <p2:Flt_Extra_Cat Code=\"BAG\" Name=\"Baggage\" Method=\"BAG\">                <p2:Flt_Extra Code=\"BAG\" Name=\"Baggage\">                    <p2:Class>Y</p2:Class>                    <p2:Baggage>                        <p2:Weight Cd=\"23\">                            <p2:Piece Cd=\"1\">0</p2:Piece>                        </p2:Weight>                    </p2:Baggage>                    <p2:SubServPaxs>                        <p2:SubServPax>                            <p2:Pax_Id>1</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                        <p2:SubServPax>                            <p2:Pax_Id>2</p2:Pax_Id>                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>                            <p2:Pax_Srv_Prc_Ex CurISO=\"GBP\">0.00</p2:Pax_Srv_Prc_Ex>                        </p2:SubServPax>                    </p2:SubServPaxs>                    <p2:Atol_Mth>NONE</p2:Atol_Mth>                </p2:Flt_Extra>            </p2:Flt_Extra_Cat>        </p2:Flt_Extra_Cat_List>        <p2:CurISO>GBP</p2:CurISO>        <p2:Fast_Seller>S</p2:Fast_Seller>        <p2:Acc_Prc_Zero_Fg>false</p2:Acc_Prc_Zero_Fg>        <p2:Acc_Cost_Zero_Fg>false</p2:Acc_Cost_Zero_Fg>        <p2:Atol_Prot_Tp>PKG</p2:Atol_Prot_Tp>        <p2:Atol_Prot_By>TO</p2:Atol_Prot_By>        <p2:Atol_Prot_Issuer>TO</p2:Atol_Prot_Issuer>        <p2:Summary_Prices>            <p2:Summary_Price>                <p2:Prc_Tp_Cd>ACC</p2:Prc_Tp_Cd>                <p2:Prc_Tp_Name>Package Price</p2:Prc_Tp_Name>                <p2:Qty>2</p2:Qty>                <p2:Prc>981.25</p2:Prc>            </p2:Summary_Price>        </p2:Summary_Prices>    </p2:Bkg_Ent>    <p2:Agt_No>WAGBP</p2:Agt_No>    <p2:Cus CusId=\"39850\" SysId=\"MUSY\" MandatorId=\"T\" />    <p2:CusDet>        <p2:CusId>39850</p2:CusId>        <p2:SysId>MUSY</p2:SysId>        <p2:MandatorId>T</p2:MandatorId>        <p2:Person>            <p2:Add>                <p2:Name>Test Address</p2:Name>                <p2:Street>Test Address Second Line</p2:Street>                <p2:ZipCode>CR 3WR</p2:ZipCode>                <p2:City>Test Town</p2:City>                <p2:CountryISOCode>GBR</p2:CountryISOCode>            </p2:Add>            <p2:Comm>                <p2:CommType>TYPE_MOBILE</p2:CommType>                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>                <p2:AreaCode></p2:AreaCode>                <p2:Num>44 11101110111</p2:Num>            </p2:Comm>  " +
                "          <p2:Email>                <p2:Address>email@email.com</p2:Address>                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>            </p2:Email>            <p2:Sex>SEX_UNKNOWN</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>    </p2:CusDet>    <p2:TrvDox>        <p2:DocumentReceiver>PAYER</p2:DocumentReceiver>        <p2:DoxLang>en_EN</p2:DoxLang>        <p2:Next_Travel_Dox_Prt_Dt>2020-07-04T23:59:59.000+01:00</p2:Next_Travel_Dox_Prt_Dt>        <p2:ConfPrt>false</p2:ConfPrt>        <p2:Travel_Dox_Stop>false</p2:Travel_Dox_Stop>        <p2:Conf_Stop>false</p2:Conf_Stop>        <p2:Travel_Dox_No_Price>false</p2:Travel_Dox_No_Price>        <p2:Travel_Dox_Per_Person>false</p2:Travel_Dox_Per_Person>        <p2:Print_Voucher_Immed>false</p2:Print_Voucher_Immed>        <p2:EDox_Generation>false</p2:EDox_Generation>    </p2:TrvDox>    <p2:PayData>        <p2:Dpt Type=\"LOW\">            <p2:CurISO>GBP</p2:CurISO>            " +
                $"<p2:Amt>{bookingDespositAmount}</p2:Amt>            <p2:Dep_Dt>2020-05-26</p2:Dep_Dt>        </p2:Dpt>        <p2:Bkg_Prc_Ex>            <p2:CurISO>GBP</p2:CurISO>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>        </p2:Bkg_Prc_Ex>        <p2:Bkg_Prc_Inc>            <p2:CurISO>GBP</p2:CurISO>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>            <p2:Bal_Due_Amt>0.00</p2:Bal_Due_Amt>            <p2:Bal_Due_Dt>2020-06-16</p2:Bal_Due_Dt>        </p2:Bkg_Prc_Inc>        <p2:Pay>            <p2:CCPay CCType=\"CARD\" Card_Issuer=\"DL\" Card_Cd=\"DL\" Card_Desc=\"Visa Debit\">                <p2:CNum>XXXXXXXXXXXX1111</p2:CNum>                <p2:ExpDate>10/20</p2:ExpDate> " +
                $"               <p2:PayAmt>{bookingPaymentAmount}</p2:PayAmt>                <p2:Is_Loyalty_Card>false</p2:Is_Loyalty_Card>            </p2:CCPay>            <p2:Pay_Seq>1</p2:Pay_Seq>" +
                $"            <p2:Amt>{bookingPaymentAmount}</p2:Amt>            <p2:Exch_Rate>1.00</p2:Exch_Rate>            <p2:CurISO>GBP</p2:CurISO>            <p2:AuthCode>500040609</p2:AuthCode>            <p2:TransNo>883590502923253A</p2:TransNo>            <p2:PayDtTm>2020-05-26T15:22:06.000+01:00</p2:PayDtTm>            <p2:PayDetails>ADYEN</p2:PayDetails>            <p2:Pay_Group Code=\"CARD\" Name=\"Card\" />            <p2:AuthSys>EasyJetPGS</p2:AuthSys>            <p2:Pay_Type_Code>DL</p2:Pay_Type_Code>            <p2:Pay_Method Code=\"DL\" Name=\"Visa Debit\" />            <p2:Settle_Method>L</p2:Settle_Method>            <p2:Recon_Type>CARD</p2:Recon_Type>            <p2:Recon_Method>MAN</p2:Recon_Method>            <p2:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holdiays VRP User\" />            <p2:Pay_Id>2153016388</p2:Pay_Id> " +
                $"           <p2:Bal_Refund_Amt>{bookingPaymentAmount}</p2:Bal_Refund_Amt>        </p2:Pay>        <p2:Pay>            <p2:Pay_Seq>2</p2:Pay_Seq>     " +
                $"       <p2:Amt>{bookingDespositAmount}</p2:Amt>            <p2:Exch_Rate>1.00</p2:Exch_Rate>            <p2:CurISO>GBP</p2:CurISO>            <p2:PayDtTm>2020-05-26T15:22:07.000+01:00</p2:PayDtTm>            <p2:Pay_Group Code=\"CA\" Name=\"Cash\" />            <p2:Pay_Type_Code>TRF</p2:Pay_Type_Code>            <p2:Pay_Method Code=\"CR\" Name=\"Credit Refund Redeemed\" />            <p2:Settle_Method>Y</p2:Settle_Method>            <p2:Recon_Type>CASH</p2:Recon_Type>            <p2:Recon_Method>MAN</p2:Recon_Method>            <p2:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holdiays VRP User\" />            <p2:Pay_Id>2153016579</p2:Pay_Id>" +
                $"            <p2:Bal_Refund_Amt>{bookingDespositAmount}</p2:Bal_Refund_Amt>        </p2:Pay>" +
                $"        <p2:Tot_Amt>{bookingDespositAmount + bookingPaymentAmount}</p2:Tot_Amt>        <p2:Agt_Com>0.00</p2:Agt_Com>        <p2:Comm_Inc_VAT>0.00</p2:Comm_Inc_VAT>        <p2:VAT>0.00</p2:VAT>        <p2:Payment_Received>1962.50</p2:Payment_Received>        <p2:TO_Comm_Amt>0.00</p2:TO_Comm_Amt>        <p2:TO_Comm_Amt_Calc>0.00</p2:TO_Comm_Amt_Calc>    </p2:PayData>    <p2:Pax Age=\"31\" Index=\"1\">        <p2:Person>            <p2:FirstName>First Guest Name</p2:FirstName>            <p2:LastName>First Guest Surname</p2:LastName>            <p2:DateOfBirth>1989-07-10</p2:DateOfBirth>            <p2:Title>Miss</p2:Title>            <p2:Sex>SEX_FEMALE</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>        <p2:Pax_Tp>ADULT</p2:Pax_Tp>        <p2:Lead_Pax>true</p2:Lead_Pax>    </p2:Pax>    <p2:Pax Age=\"30\" Index=\"2\">        <p2:Person>            <p2:FirstName>Kjghkjg</p2:FirstName>            <p2:LastName>Dfgdfg</p2:LastName>            <p2:Title>Miss</p2:Title>            <p2:Sex>SEX_FEMALE</p2:Sex>            <p2:PersonType>TYPE_NATURAL</p2:PersonType>        </p2:Person>        <p2:Pax_Tp>ADULT</p2:Pax_Tp>    </p2:Pax>    <p2:DD_Marketing_Sts>V0</p2:DD_Marketing_Sts>    <p2:Prom Code=\"EUBF\" Issue=\"1\" Name=\"easyJet Holidays Beach - Family\" Prom_Group_Code=\"EJH\" />    <p2:Incident_Sts>NA</p2:Incident_Sts>    <p2:Insurance_Method>INT</p2:Insurance_Method>    <p2:Retail_Bkg_Id>-1</p2:Retail_Bkg_Id>    <p2:Bkg_Type_Mth>RET</p2:Bkg_Type_Mth>    <p1:Amendments>        <p1:Bkg Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Route Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Accom Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Item Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Flight_Extra Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Car_Rental Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Cruise Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Pax Add=\"true\" Amend=\"true\" Cancel=\"true\" />        <p1:Memo Add=\"true\" Amend=\"true\" Cancel=\"true\" />    </p1:Amendments></p1:DisplayResponse>";

            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()
            )
            .InScenario("Credit booking")
            .WillSetStateTo("Check booking on lock")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody(expectedBookingResponse)
            );

            // Check on lock status
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .UsingPost()

            )
            .InScenario("Credit booking")
            .WhenStateIs("Check booking on lock")
            .WillSetStateTo("Modify memo CRED")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("<p1:DisplayMemoResponse xmlns:p1=\"AtComRes/DisplayMemoResponse\" xmlns:p2=\"AtComRes/Common\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"AtComRes/DisplayMemoResponse ../api/DisplayMemoResponse/DisplayMemoResponse.xsd\">    <!-- Response returned from: EZYTST.EJH.ATCOM -->    <p2:Adm Xsd_Ver=\"T3.20.4.8\">        <p2:ReqId>xxx</p2:ReqId>        <p2:Tm>2020-06-11T10:42:44.750+01:00</p2:Tm>        <p2:Trk From=\"atcomres\" To=\"musyk\" />    </p2:Adm>    <p2:CltInfo>        <p2:Locale>en_EN</p2:Locale>        <p2:CltSysContext>3</p2:CltSysContext>        <p2:Agt_No>WAGBP</p2:Agt_No>        <p2:TermCode>ABCD</p2:TermCode>        <p2:User_Name>EZYVRP</p2:User_Name>        <p2:Chan>inhouse</p2:Chan>        <p2:Channel_Type>VRP</p2:Channel_Type>        <p2:User_Role>INTERNAL</p2:User_Role>    </p2:CltInfo>    <p2:BkgNum>        <p2:BkgId>1000001</p2:BkgId>        <p2:CurrentVersion>8</p2:CurrentVersion>    </p2:BkgNum>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:38.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:OC</p2:Memo_Cd>        <p2:Memo_Name>Opt created</p2:Memo_Name>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28909</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>1</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:42.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:OB</p2:Memo_Cd>        <p2:Memo_Name>Opt to booking</p2:Memo_Name>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28912</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>4</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-02-17T16:52:44.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:AB</p2:Memo_Cd>        <p2:Memo_Name>Amended Booking</p2:Memo_Name>        <p2:Memo_Des>Fees calculated using Amendment Market: B2CU B2C £</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>28915</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>7</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>bulk cancelation</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48503</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>8</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:CNXO</p2:Memo_Cd>        <p2:Memo_Name>Cancellation Charge Overridden</p2:Memo_Name>        <p2:Memo_Des>Cancellation Charge Overridden from 899.20</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48504</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>9</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-03-27T08:45:58.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>:CB</p2:Memo_Cd>        <p2:Memo_Name>Cancelled Booking</p2:Memo_Name>        <p2:Memo_Des>Fees calculated using Amendment Market: B2CU B2C £</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>48502</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>10</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T13:50:43.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67805</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>13</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T13:57:34.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67765</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>14</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T14:13:02.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67775</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>15</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-05T14:23:00.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>test text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>67777</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>16</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo>    <p2:Memo>        <p2:Memo_Dt>2020-05-06T10:15:47.000+01:00</p2:Memo_Dt>        <p2:Memo_Cd>BC</p2:Memo_Cd>        <p2:Memo_Name>Booking Comments</p2:Memo_Name>        <p2:Memo_Des>Simple text</p2:Memo_Des>        <p2:Memo_User_Name>EZYVRP</p2:Memo_User_Name>        <p2:Memo_User_Desc>easyJet Holdiays VRP User</p2:Memo_User_Desc>        <p2:Memo_Key>69027</p2:Memo_Key>        <p2:Memo_Rights>READ</p2:Memo_Rights>        <p2:Memo_Rights>WRITE</p2:Memo_Rights>        <p2:Memo_Rights>DELETE</p2:Memo_Rights>        <p2:Memo_Seq>18</p2:Memo_Seq>        <p2:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" />    </p2:Memo></p1:DisplayMemoResponse>")
            );


            // Modify memo CRED
            atcomServer.Given(
                Request.Create()
                    .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                    .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                    .WithBody(new RegexMatcher($"<p1:Memo_Cd>CRED</p1:Memo_Cd>"))
                    .UsingPost()

            )
            .InScenario("Credit booking")
            .WhenStateIs("Modify memo CRED")
            .WillSetStateTo("Add payment info for goodwill")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("<p2:ModifyMemoResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyMemoResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:09.584+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa0rAAm</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079763</p1:BkgId></p1:BkgNum><p1:Memo><p1:Memo_Dt>2020-06-07T01:00:09.000+01:00</p1:Memo_Dt><p1:Memo_Cd>CRED</p1:Memo_Cd><p1:Memo_Name>Customer Credit</p1:Memo_Name><p1:Memo_Des>Voucher created with ids: bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund, 120 £</p1:Memo_Des><p1:Memo_User_Name>EZYVRP</p1:Memo_User_Name><p1:Memo_User_Desc>easyJet Holidays VRP User</p1:Memo_User_Desc><p1:Memo_Key>1267062</p1:Memo_Key><p1:Memo_Rights>READ</p1:Memo_Rights><p1:Memo_Rights>WRITE</p1:Memo_Rights><p1:Memo_Rights>DELETE</p1:Memo_Rights><p1:Memo_Seq>24</p1:Memo_Seq><p1:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" /></p1:Memo></p2:ModifyMemoResponse>")
            );


            // Add payment info for goodwill
            atcomServer.Given(
               Request.Create()
                   .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                   .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                   .WithBody(new RegexMatcher($"<p1:PayAmt>-{bookingDespositAmount}</p1:PayAmt>"))
                   .UsingPost()
           )
           .InScenario("Credit booking")
           .WhenStateIs("Add payment info for goodwill")
           .WillSetStateTo("Add payment info for refund")
           .RespondWith(
               Response.Create()
                   .WithStatusCode(200)
                   .WithBody("<p2:ModifyCustPaymentResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyCustPaymentResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:17.323+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa2iAAl</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079989</p1:BkgId><p1:CurrentVersion>14</p1:CurrentVersion></p1:BkgNum><p1:BkgSts>CANCELED</p1:BkgSts><p1:His><p1:Bkg_Dt_Tm>2020-02-16T16:07:40.000+01:00</p1:Bkg_Dt_Tm><p1:Bkg_User>EZYVRP</p1:Bkg_User><p1:Bkg_Term_Code>ABCD</p1:Bkg_Term_Code><p1:Bkg_Chan>inhouse</p1:Bkg_Chan><p1:Amd_Dt_Tm>2020-06-07T01:00:16.000+01:00</p1:Amd_Dt_Tm><p1:Amd_User>EZYVRP</p1:Amd_User><p1:Amd_Term_Code>ABCD</p1:Amd_Term_Code><p1:Amd_Chan>inhouse</p1:Amd_Chan></p1:His><p1:PayData><p1:Pay><p1:Pay_Seq>2</p1:Pay_Seq><p1:Amt>-120.00</p1:Amt><p1:Exch_Rate>1.00</p1:Exch_Rate><p1:CurISO>GBP</p1:CurISO><p1:PayDtTm>2020-06-07T01:00:17.000+01:00</p1:PayDtTm><p1:Pay_Group Code=\"CA\" Name=\"Cash\" /><p1:Pay_Type_Code>TRF</p1:Pay_Type_Code><p1:Pay_Method Code=\"CI\" Name=\"Credit Refund Issued\" /><p1:Settle_Method>Y</p1:Settle_Method><p1:Recon_Type>CASH</p1:Recon_Type><p1:Recon_Method>MAN</p1:Recon_Method><p1:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holidays VRP User\" /><p1:Pay_Id>2163234244</p1:Pay_Id><p1:Bal_Refund_Amt>-120.00</p1:Bal_Refund_Amt></p1:Pay></p1:PayData></p2:ModifyCustPaymentResponse>")
            );


            // Add payment info for refund
            atcomServer.Given(
               Request.Create()
                   .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                   .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                   .WithBody(new RegexMatcher($"<p1:PayAmt>-{bookingPaymentAmount}</p1:PayAmt>"))
                   .UsingPost()
           )
           .InScenario("Credit booking")
           .WhenStateIs("Add payment info for refund")
           .WillSetStateTo("Modify memo REP3")
           .RespondWith(
               Response.Create()
                   .WithStatusCode(200)
                   .WithBody("<p2:ModifyCustPaymentResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyCustPaymentResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:17.323+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa2iAAl</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079989</p1:BkgId><p1:CurrentVersion>14</p1:CurrentVersion></p1:BkgNum><p1:BkgSts>CANCELED</p1:BkgSts><p1:His><p1:Bkg_Dt_Tm>2020-02-16T16:07:40.000+01:00</p1:Bkg_Dt_Tm><p1:Bkg_User>EZYVRP</p1:Bkg_User><p1:Bkg_Term_Code>ABCD</p1:Bkg_Term_Code><p1:Bkg_Chan>inhouse</p1:Bkg_Chan><p1:Amd_Dt_Tm>2020-06-07T01:00:16.000+01:00</p1:Amd_Dt_Tm><p1:Amd_User>EZYVRP</p1:Amd_User><p1:Amd_Term_Code>ABCD</p1:Amd_Term_Code><p1:Amd_Chan>inhouse</p1:Amd_Chan></p1:His><p1:PayData><p1:Pay><p1:Pay_Seq>2</p1:Pay_Seq><p1:Amt>-120.00</p1:Amt><p1:Exch_Rate>1.00</p1:Exch_Rate><p1:CurISO>GBP</p1:CurISO><p1:PayDtTm>2020-06-07T01:00:17.000+01:00</p1:PayDtTm><p1:Pay_Group Code=\"CA\" Name=\"Cash\" /><p1:Pay_Type_Code>TRF</p1:Pay_Type_Code><p1:Pay_Method Code=\"CI\" Name=\"Credit Refund Issued\" /><p1:Settle_Method>Y</p1:Settle_Method><p1:Recon_Type>CASH</p1:Recon_Type><p1:Recon_Method>MAN</p1:Recon_Method><p1:Payment_User Code=\"EZYVRP\" Name=\"easyJet Holidays VRP User\" /><p1:Pay_Id>2163234244</p1:Pay_Id><p1:Bal_Refund_Amt>-120.00</p1:Bal_Refund_Amt></p1:Pay></p1:PayData></p2:ModifyCustPaymentResponse>")
            );

            // Modify memo REP3
            atcomServer.Given(
               Request.Create()
                   .WithUrl("*/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")
                   .WithBody(new RegexMatcher($"<p1:BkgId>({reference})</p1:BkgId>"))
                   .WithBody(new RegexMatcher($"<p1:Memo_Cd>REP3</p1:Memo_Cd>"))
                   .UsingPost()
           )
           .InScenario("Credit booking")
           .WhenStateIs("Modify memo REP3")
           .RespondWith(
               Response.Create()
                   .WithStatusCode(200)
                   .WithBody("<p2:ModifyMemoResponse xmlns:p1=\"AtComRes/Common\" xmlns:p2=\"AtComRes/ModifyMemoResponse\"><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=\"0.0.0\"><p1:Tm>2020-06-07T01:00:09.584+01:00</p1:Tm><p1:Trk From=\"atcomres\" To=\"easyjet\" /><p1:Full_View_Key>AAAbaaAAYAAAa0rAAm</p1:Full_View_Key></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>1079763</p1:BkgId></p1:BkgNum><p1:Memo><p1:Memo_Dt>2020-06-07T01:00:09.000+01:00</p1:Memo_Dt><p1:Memo_Cd>Rep1</p1:Memo_Cd><p1:Memo_Name>Customer Credit</p1:Memo_Name><p1:Memo_Des>bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund</p1:Memo_Des><p1:Memo_User_Name>EZYVRP</p1:Memo_User_Name><p1:Memo_User_Desc>easyJet Holidays VRP User</p1:Memo_User_Desc><p1:Memo_Key>1267062</p1:Memo_Key><p1:Memo_Rights>READ</p1:Memo_Rights><p1:Memo_Rights>WRITE</p1:Memo_Rights><p1:Memo_Rights>DELETE</p1:Memo_Rights><p1:Memo_Seq>24</p1:Memo_Seq><p1:Agent Cd=\"WAGBP\" Name=\"Web Agent £\" /></p1:Memo></p2:ModifyMemoResponse>")
            );

            var voucherifyServer = SpawnServer("VoucherifyMockServer",
                new WireMockServerSettings
                {
                    FileSystemHandler =
                        new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, "voucherify"),
                    StartAdminInterface = true,
                    ReadStaticMappings = true,
                    WatchStaticMappings = true,
                    WatchStaticMappingsInSubdirectories = true
                });

            // Mock create voucherify customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithParam("email", "email@email.com")
                    .WithParam("limit", "1")
                    .UsingGet()
            )
            .InScenario("Get customer")
            .WillSetStateTo("Customer is not created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBodyAsJson(new { })
            );

            // Mock get creating customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithBody(new JsonMatcher(new { name = "email@email.com", email = "email@email.com", metadata = new Dictionary<string, string>() { { "lang", "eng" } } }))
                    .UsingPost()
            )
            .InScenario("Get customer")
            .WhenStateIs("Customer is not created")
            .WillSetStateTo("Customer created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"source_id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"name\":\"Oleg\",\"email\":\"email@email.com\",\"description\":\"Premium user, ACME Inc.\",\"address\":{\"city\":\"Melbourne\",\"state\":\"FL\",\"line_1\":\"226 E Fee Ave\",\"line_2\":null,\"country\":\"Australia\",\"postal_code\":\"32901\"},\"summary\":{\"redemptions\":{\"total_redeemed\":0,\"total_failed\":0,\"total_succeeded\":0,\"total_rolled_back\":0,\"total_rollback_failed\":0,\"total_rollback_succeeded\":0,\"gift\":{\"redeemed_amount\":0,\"amount_to_go\":0}},\"orders\":{\"total_amount\":0,\"total_count\":0,\"average_amount\":0,\"last_order_amount\":0,\"last_order_date\":null}},\"loyalty\":{\"points\":0,\"referred_customers\":0},\"metadata\":{\"lang\":\"en\"},\"created_at\":\"2016-11-15T15:41:44Z\",\"object\":\"customer\"}")
            );

            // Mock get customer
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/customers")
                    .WithParam("email", "email@email.com")
                    .WithParam("limit", "1")
                    .UsingGet()
            )
            .InScenario("Get customer")
            .WhenStateIs("Customer created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"object\":\"list\",\"has_more\":false,\"total\":1,\"data_ref\":\"customers\",\"customers\":[{\"object\":\"customer\",\"id\":\"cust_ZJwRsO3KEQaeizIkeNk7ZqPo\",\"source_id\":null,\"name\":\" \",\"description\":null,\"email\":\"email@email.com\",\"metadata\":{\"lang\":\"end\"},\"created_at\":\"2020-06-07T14:15:16.073Z\",\"address\":{\"city\":null,\"state\":null,\"line_1\":null,\"line_2\":null,\"country\":null,\"postal_code\":null},\"summary\":{\"redemptions\":{\"total_redeemed\":0,\"total_failed\":0,\"total_succeeded\":0,\"total_rolled_back\":0,\"total_rollback_failed\":0,\"total_rollback_succeeded\":0},\"orders\":{\"total_amount\":0,\"total_count\":0,\"average_amount\":0,\"last_order_amount\":0,\"last_order_date\":null}},\"loyalty\":{\"points\":0,\"referred_customers\":0,\"campaigns\":{}},\"updated_at\":null,\"phone\":null,\"birthday\":null}]}")
            );

            // Mock creating voucher goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JmesPathMatcher(
                        "type == 'GIFT_VOUCHER'",
                        "campaign == 'easyJet-credit'",
                        "category == 'ej Holidays'",
                        $"metadata.currency == 'GBP'",
                        $"metadata.source == 'Bulk Tool'",
                        $"metadata.action == 'cancel and credit'",
                        $"metadata.booking_ref == '{reference}'",
                        $"metadata.reason == 'goodwill'"
                        ))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WillSetStateTo("Voucher for goodwill is created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"v_30XK8y8H438FXJk7ag54sMuJzhzpvSkI\",\"code\":\"bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-goodwill\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1200,\"balance\":1200},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"publish\":{\"object\":\"list\",\"count\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/redemptions?page=1&limit=10\"},\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1067166\"},\"is_referral_code\":false,\"updated_at\":null,\"object\":\"voucher\"}")
            );

            // Mock add amount to voucher goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JsonMatcher(new { amount = bookingDespositAmount * 100 }))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher for goodwill is created")
            .WillSetStateTo("Voucher goodwill ready to publish")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("")
            );

            // Mock pusblish voucher for goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/vouchers/publish")
                    .WithBody(new JmesPathMatcher("customer.id == 'cust_ZJwRsO3KEQaeizIkeNk7ZqPo'"))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher goodwill ready to publish")
            .WillSetStateTo("Voucher for goodwill is published")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"pub_a78ylda8fw6JpM7pqBU6g6QdWnwjyWcq\",\"object\":\"publication\",\"created_at\":\"2020-06-07T00:00:09.367Z\",\"customer_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"tracking_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"metadata\":{},\"channel\":\"API\",\"result\":\"SUCCESS\",\"customer\":{\"object\":\"customer\",\"id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\"},\"voucher\":{\"id\":\"v_w2FrJM04dw34Nx50flsGwweHJf0PxNKS\",\"code\":\"bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1000,\"balance\":1000},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00.000Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1079763\"},\"is_referral_code\":false,\"created_at\":\"2020-06-07T00:00:09.266Z\",\"updated_at\":\"2020-06-07T00:00:09.377Z\",\"holder_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"object\":\"voucher\",\"publish\":{\"object\":\"list\",\"count\":1,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-goodwill\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/redemptions?page=1&limit=10\"}}}")
            );

            // Mock creating voucher refund
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JmesPathMatcher(
                        "type == 'GIFT_VOUCHER'",
                        "campaign == 'easyJet-credit'",
                        "category == 'ej Holidays'",
                        $"metadata.currency == 'GBP'",
                        $"metadata.source == 'Bulk Tool'",
                        $"metadata.action == 'cancel and credit'",
                        $"metadata.booking_ref == '{reference}'",
                        $"metadata.reason == 'refund'"
                        ))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher for goodwill is published")
            .WillSetStateTo("Voucher for refund is created")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"v_30XK8y8H438FXJk7ag54sMuJzhzpvSkI\",\"code\":\"bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":184250,\"balance\":184250},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"publish\":{\"object\":\"list\",\"count\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-c85ee0da-e0bd-4772-b9b3-039b24238f82-refund\\/redemptions?page=1&limit=10\"},\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1067166\"},\"is_referral_code\":false,\"updated_at\":null,\"object\":\"voucher\"}")
            );

            // Mock add amount to voucher goodwill
            voucherifyServer.Given(
                Request.Create()
                    .WithUrl("*/v1/vouchers/*")
                    .WithBody(new JsonMatcher(new { amount = bookingPaymentAmount * 100 }))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher for refund is created")
            .WillSetStateTo("Voucher refund ready to publish")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("")
            );

            // Mock pusblish voucher for refund
            voucherifyServer.Given(
                Request.Create()
                    .WithPath("/v1/vouchers/publish")
                    .WithBody(new JmesPathMatcher("customer.id == 'cust_ZJwRsO3KEQaeizIkeNk7ZqPo'"))
                    .UsingPost()
            )
            .InScenario("Create voucher")
            .WhenStateIs("Voucher refund ready to publish")
            .WillSetStateTo("Voucher refund is published")
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBody("{\"id\":\"pub_a78ylda8fw6JpM7pqBU6g6QdWnwjyWcq\",\"object\":\"publication\",\"created_at\":\"2020-06-07T00:00:09.367Z\",\"customer_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"tracking_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"metadata\":{},\"channel\":\"API\",\"result\":\"SUCCESS\",\"customer\":{\"object\":\"customer\",\"id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\"},\"voucher\":{\"id\":\"v_w2FrJM04dw34Nx50flsGwweHJf0PxNKS\",\"code\":\"bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c\",\"campaign\":\"easyJet-credit\",\"campaign_id\":\"camp_qjdVHzzDzKPcld1a1yymOxLR\",\"category\":\"ej Holidays\",\"type\":\"GIFT_VOUCHER\",\"discount\":null,\"gift\":{\"amount\":1000,\"balance\":1000},\"loyalty_card\":null,\"start_date\":null,\"expiration_date\":\"2021-06-07T00:00:00.000Z\",\"validity_timeframe\":null,\"validity_day_of_week\":null,\"active\":true,\"additional_info\":null,\"metadata\":{\"memo\":\"Batch3 - July deposit return\",\"reason\":\"refund\",\"source\":\"ATCOM\",\"currency\":\"GBP\",\"booking_ref\":\"1079763\"},\"is_referral_code\":false,\"created_at\":\"2020-06-07T00:00:09.266Z\",\"updated_at\":\"2020-06-07T00:00:09.377Z\",\"holder_id\":\"cust_y6Iemriy2hQYRONbC4LzcACQ\",\"object\":\"voucher\",\"publish\":{\"object\":\"list\",\"count\":1,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/publications?page=1&limit=10\"},\"redemption\":{\"object\":\"list\",\"quantity\":null,\"redeemed_quantity\":0,\"redeemed_amount\":0,\"url\":\"\\/v1\\/vouchers\\/bulk-tool-da1a93fd-0312-47f1-a747-591de599a21c-refund\\/redemptions?page=1&limit=10\"}}}")
            );

            ApplyManyConfigurationFields(new[]
            {
                new KeyValuePair<string, string>("Voucherify:Host", atcomServer.Url),
                new KeyValuePair<string, string>("Atcom:Search:Host", atcomServer.Url),
                new KeyValuePair<string, string>("Atcom:Booking:Host", atcomServer.Url)
            });

            Client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("yeymtmwg0mzdt80chqveeopojn897s58yciqfhvl508mpq4dmna9w907617q");

            // Act
            var response = await Client.PostAsync($"/api/v1/cancellationandrefund/cancelandrefund", content);

            var responseContent = await response.Content.ReadAsStringAsync();
            var bulkToolResponse = JsonConvert.DeserializeObject<BulkToolResponse>(responseContent);

            // Assert
            bulkToolResponse.Message.Should().Be(expectedErrorMessage);
            bulkToolResponse.Reference.Should().Be(reference);
            bulkToolResponse.CorrelationId.Should().NotBeNull();
        }
    }
}
