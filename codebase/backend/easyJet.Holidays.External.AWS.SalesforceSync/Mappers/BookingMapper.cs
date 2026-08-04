using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.AWS.Domain.Models;
using easyJet.Holidays.External.AWS.SalesforceSync.Models;
using easyJet.Holidays.External.DataHub.SoapReference;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Models_Hotel = easyJet.Holidays.External.AWS.SalesforceSync.Models.Hotel;
using Models_Memo = easyJet.Holidays.External.AWS.SalesforceSync.Models.Memo;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Mappers;

/// <summary>
/// Defines the contract for mapping booking synchronization transfer data to Salesforce request objects.
/// </summary>
public interface IBookingSyncTransferMapper
{
    /// <summary>
    /// Maps booking synchronization transfer data encapsulated in a BookingSyncTransferWrapper object
    /// to a SalesforceRequest object.
    /// </summary>
    /// <param name="response">The BookingSyncTransferWrapper containing booking synchronization transfer data.</param>
    /// <returns>A SalesforceRequest object with the mapped data.</returns>
    SalesforceRequest MapBookingDetails(BookingSyncTransferWrapper response);
}

/// <summary>
/// Provides implementation for mapping booking synchronization transfer data to Salesforce request objects.
/// </summary>
[ExcludeFromCodeCoverage]
public class BookingSyncTransferMapper : IBookingSyncTransferMapper
    {
        /// <summary>
        /// MapBookingDetails
        /// </summary>
        /// <param name="response">BookingSyncTransferWrapper object</param>
        /// <returns></returns>
        
    public SalesforceRequest MapBookingDetails(BookingSyncTransferWrapper response)
    {
        // Add null check at the very beginning
        if (response?.ReservationDataResponse?.Response?.Data_Hub?.Reservation == null)
        {
            throw new ArgumentException("Invalid response: Reservation data is null or missing");
        }

        var res = response.ReservationDataResponse.Response.Data_Hub.Reservation;
        var hotelService = res.Services?.FirstOrDefault(s => s?.Stk_Tp_Name == "HOTEL" || s?.Ser_Tp == ArrayOfServiceServiceSer_Tp.ACC);
        var accomodation = hotelService?.Service_Acc;
        var transferService = res.Services?.FirstOrDefault(s => s?.Stk_Tp_Cd?.Value == "TF");

        // Core booking fields - Safe DateTime parsing
        DateTime? arrival = null;
        DateTime? departure = null;
        int duration = 0;

        if (!string.IsNullOrWhiteSpace(hotelService?.St_Dt) && DateTime.TryParse(hotelService.St_Dt, CultureInfo.InvariantCulture, DateTimeStyles.None, out var arrivalDate))
        {
            arrival = arrivalDate;
        }

        if (!string.IsNullOrWhiteSpace(hotelService?.End_Dt) && DateTime.TryParse(hotelService.End_Dt, CultureInfo.InvariantCulture, DateTimeStyles.None, out var departureDate))
        {
            departure = departureDate;
        }

        if (arrival.HasValue && departure.HasValue)
        {
            duration = (departure.Value - arrival.Value).Days;
        }
        
        // Lead passenger
        var leadPax = res.Passengers?.FirstOrDefault(p => p?.Lead_Pax_Fg == ArrayOfPassengerPassengerLead_Pax_Fg.Y);

        // Customer address
        var addr = res.Addresses?.FirstOrDefault(x => x.Add_Tp == ClientAddressAdd_Tp.CLT);

        var emails = new List<Email>();
        if (!string.IsNullOrWhiteSpace(addr?.Work_Email))
            emails.Add(new Email { Type = "work", EmailAddress = addr.Work_Email });
        if (!string.IsNullOrWhiteSpace(addr?.Home_Email))
            emails.Add(new Email { Type = "home", EmailAddress = addr.Home_Email });

        // Build request
        return new SalesforceRequest
        {
            Inputs =
            [
                new()
                {
                    Booking = new Booking
                    {
                        Adults = int.TryParse(res.N_Adu, NumberStyles.Integer, NumberFormatInfo.InvariantInfo, out var adults) ? adults : 0,
                        Children = int.TryParse(res.N_Chd, NumberStyles.Integer, NumberFormatInfo.InvariantInfo, out var children) ? children : 0,
                        Infants = int.TryParse(res.N_Inf, NumberStyles.Integer, NumberFormatInfo.InvariantInfo, out var infants) ? infants : 0,
                        Agent = res.Agt_Cd?.Value,
                        AgentName = res.Agt_Name,
                        Board = hotelService?.Sub_Services?.FirstOrDefault()?.Sub_Service_Acc?.Bb_Cd?.Value,
                        BookingAmount = res.Sell_Prc,
                        BookingOrigin = res.Origin_User_Cd.Value,
                        BookingStatus = MapBookingStatus(res.Bkg_Sts),
                        Country = accomodation?.Cty1_Cd?.Value,
                        Language = res.Cust_Dox_Lang_Cd?.Value,
                        HolidayArrivalDate = arrival,
                        HolidayDepartureDate = departure,
                        HolidayType = res.Prom_Name,
                        CurrencyCode = res.Sell_Cur_Cd?.Value,
                        Duration = duration.ToString(CultureInfo.InvariantCulture),
                        Market = res.Mkt_Name,
                        ReservationId = res.Res_Id,
                        CreatedDate = ParseDateTime(res.Origin_Dt_Tm),
                        UpdatedDate = ParseDateTime(res.Mod_Dt_Tm),
                        VersionId = res.Ver_Num,
                        Transfer = transferService?.Service_Item?.Item_Name,
                        TradeEmail = res.Addresses?.FirstOrDefault(a => a?.Pref_Mth == "EM")?.Work_Email,
                        NonRefundable = res.Non_Refund_Fg switch
                        {
                            BooleanTypeOpt.Y => true,
                            _ => false
                        }
                    },
                    CustomerDetails = new CustomerDetails
                    {
                        CustomerId = res.Owner_Clt_Id,
                        FirstName = leadPax?.Forename,
                        LastName = leadPax?.Surname,
                        Title = leadPax?.Title?.Value,
                        Address = new Address
                        {
                            Street = addr?.Add1,
                            City = addr?.Add3,
                            CountryIsoCode = addr?.Add5,
                            Name = addr?.House_Name,
                            Region = addr?.Add4,
                            ZipCode = addr?.Add_Code,
                            Co = addr?.Cty1_Cd?.Value
                        },
                        Email = emails.Count > 0 ? emails : null,
                        MobileNumber = !string.IsNullOrWhiteSpace(addr?.Mobile_Tel)
                            ? addr.Mobile_Tel
                            : null,
                        PhoneNumber = !string.IsNullOrWhiteSpace(addr?.Home_Tel)
                            ? addr.Home_Tel
                            : addr?.Work_Tel,
                        TelcoNumber = !string.IsNullOrWhiteSpace(addr?.Work_Tel)
                            ? addr.Work_Tel
                            : null,
                        MoreThanOnePresent = res.Passengers?.Length > 1,
                        MoreThanOneAddressPresent = res.Addresses?.Length > 1,
                        MoreThanOneOfASingleTypeOfNumberPresent =
                            new[] { addr?.Home_Tel, addr?.Work_Tel, addr?.Mobile_Tel }
                                .Count(x => !string.IsNullOrWhiteSpace(x)) > 1
                    },
                    Hotel = new Models_Hotel
                    {
                        Code = accomodation?.Accom_Cd?.Value,
                        Name = accomodation?.Accom_Name,
                        Country = accomodation?.Cty1_Cd?.Value,
                        MoreThanOnePresent = res.Services?.Count(s => s?.Stk_Tp_Cd?.Value == "H") > 1,
                        PartnerReservationNumber = accomodation?.Ext_Ref,
                        AdhocBookingPresent = false // Find out how to map this from the datahub response
                    },
                    Flights = res.Bkg_Sts == Data_Hub_ResTypeReservationBkg_Sts.CNX 
                    ? []
                    : res.Services?
                        .Where(s => s?.Stk_Tp_Cd?.Value == "FLT")
                        .Where(s => s.Ser_Sts != ArrayOfServiceServiceSer_Sts.CNX)
                        .Select(s => new Flight
                        {
                            FlightNumber = s?.Service_Trs?.Flt_Num,
                            FlightFrom = s?.Service_Trs?.Dep_Air_Cd?.Value,
                            FlightTo = s?.Service_Trs?.Arr_Air_Cd?.Value,
                            DepartureTime = ParseDateTime(s?.Service_Trs?.Dep_Dt_Tm),
                            ArrivalTime = ParseDateTime(s?.Service_Trs?.Arr_Dt_Tm),
                            Direction = s?.Service_Trs?.Dir_Mth == 0
                                ? nameof(Direction.Outbound)
                                : nameof(Direction.Inbound),
                            ExternalReferenceCode = s?.Service_Trs?.Ext_Ref
                        })
                        .ToList() ?? [],
                    Memos = res.Res_Memos?
                        .Where(m => m != null)
                        .Select(m => new Models_Memo
                        {
                            Code = m.Memo_Cd?.Value,
                            Content = m.Memo_Des,
                            MemoDateTime = ParseDateTime(m.Memo_Dt_Tm),
                            Type = m.Memo_Cd_Name
                        })
                        .ToList() ?? [],
                    Passengers = res.Passengers?
                        .Where(p => p != null)
                        .Select(p => new Passenger
                        {
                            FirstName = p.Forename,
                            LastName = p.Surname,
                            IsLead = p.Lead_Pax_Fg == ArrayOfPassengerPassengerLead_Pax_Fg.Y,
                            PaxNumber = int.TryParse(p.Pax_Seq, NumberStyles.Integer, NumberFormatInfo.InvariantInfo, out var paxNum) ? paxNum : 0
                        })
                        .ToList(),
                    Rooms = hotelService?.Sub_Services?
                        .Where(ss => ss != null)
                        .Select(ss => new Room
                        {
                            Code = ss.Sub_Service_Acc?.Rm_Cd?.Value,
                            Name = ss.Sub_Service_Acc?.Rm_Name
                        })
                        .ToList() ?? [],
                    SpecialRequests = response.SpecialRequests?
                        .Where(sp => sp != null)
                        .Select(sp => new SpecialRequest { Code = sp.Code, Name = sp.Name })
                        .ToList() ?? []
                }
            ]
        };
    }

    /// <summary>
    /// Safely parses a DateTime string, returning null if the string is null, empty, or invalid
    /// </summary>
    /// <param name="dateTimeString">The DateTime string to parse</param>
    /// <returns>Parsed DateTime or null if invalid</returns>
    private static DateTime? ParseDateTime(string? dateTimeString)
    {
        if (string.IsNullOrWhiteSpace(dateTimeString))
            return null;

        if (DateTime.TryParse(dateTimeString, DateTimeFormatInfo.InvariantInfo, DateTimeStyles.None, out var result))
            return result;

        return null;
    }
    
    private static string MapBookingStatus(Data_Hub_ResTypeReservationBkg_Sts sts) =>
        sts switch
        {
            Data_Hub_ResTypeReservationBkg_Sts.BKG => "BOOKING",
            Data_Hub_ResTypeReservationBkg_Sts.OPT => "OPTION",
            Data_Hub_ResTypeReservationBkg_Sts.CNX => "CANCELLED",
            Data_Hub_ResTypeReservationBkg_Sts.Item => "",
            _ => sts.ToString()
        };
}