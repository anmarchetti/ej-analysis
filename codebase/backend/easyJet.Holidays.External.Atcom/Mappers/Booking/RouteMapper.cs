using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking
{
    public class RouteMapper
    {
        public static Route_Tp BuildRoute(Route flight, string accomProm, SubServPax[] subServPaxs, bool isOutbound)
        {
            var directionValue = isOutbound ? "outbound" : "inbound";

            var routeCd = flight.RouteCd;
            Cab_Cls cab = null;
            string flt_Inv_Id = null;

            // Set external flights specific values
            if (flight.IsExternal)
            {
                // For external flights we need to calculate route
                // so type 3 has BJVLGW7T  so you would have BJVLGW7TLGWBJV for the outbound and BJVLGW7TBJVLGW for the inbound
                routeCd = $"{flight.RouteCd}{flight.DepPt}{flight.ArrPt}";
                cab = new Cab_Cls
                {
                    Code = "Y",
                    Name = "Economy"
                };

                flt_Inv_Id = routeCd;
            }

            var fltDtTm = new[]
            {
                BuildFlight(flight.DepDate, Flt_Dt_TmDirType.DEPARTURE),
                BuildFlight(flight.ArrDate, Flt_Dt_TmDirType.ARRIVAL)
            };
            var flightNo = flight.FlightNumberWithoutCar;

            return new Route_Tp
            {
                Rt_Dir = directionValue,
                RouteCd = new RouteCd1
                {
                    Value = routeCd
                },
                Cab_Cls = cab,
                Flt_Inv_Id = flt_Inv_Id,
                Rt_InvState = flight.IsExternal ? Route_TpRt_InvState.EXTERNAL : Route_TpRt_InvState.INTERNAL,
                Dep_Air_Cd = flight.DepPt,
                Arr_Air_Cd = flight.ArrPt,
                Flt_Dt_Tm = fltDtTm,
                Cycle_Dt = flight.CycDate,
                Item = new Prom
                {
                    Code = accomProm,
                },
                Car_Cd = flight.Car,
                Flt_No = flightNo,
                Ser_Sts = new[] { Ser_Sts.FIX },
                Flt_Seq_Cd = flight.RouteCd?.Length > 7 ? flight.RouteCd[7].ToString() : null, // Atcom: this should match with the 8th character of the Route Code                
                SubServPaxs = subServPaxs,
                Sec = new[] // We assume for now that route has only one sector
                {
                    new Sec
                    {
                        SecId = flight.SectorId,
                        Dep_Air_Cd = flight.DepPt,
                        Arr_Air_Cd = flight.ArrPt,
                        Flt_Dt_Tm = fltDtTm,
                        Car_Cd = flight.Car,
                        Flt_No = flightNo
                    }
                },
                Bkg_Cls = string.IsNullOrEmpty(flight.BookingClass) ? null : new Bkg_Cls() { Code = flight.BookingClass },
                Duration = flight.Duration
            };
        }

        public static Route_Tp BuildInfoModifyBookingRoute(Route flight, string accomProm, SubServPax[] subServPaxs, bool isOutbound)
        {
            var route = BuildRoute(flight, accomProm, subServPaxs, isOutbound);

            //remove unnecessary
            route.RouteCd = null;
            route.Flt_Inv_Id = null;
            route.Duration = (flight != null && flight.IsExternal) ? flight.Duration : "0";

            return route;
        }

        private static Flt_Dt_Tm BuildFlight(DateTimeOffset? depDate, Flt_Dt_TmDirType type)
        {
            return new Flt_Dt_Tm
            {
                DirType = type,
                DirTypeSpecified = true,
                Local = DateFormatUtils.Iso8601(depDate?.DateTime)
            };
        }
    }
}
