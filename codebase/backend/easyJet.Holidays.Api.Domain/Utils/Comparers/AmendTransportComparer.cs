using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Utils.Comparers
{

    /// <summary>
    /// Compare ament transport with transport for alternative flights.
    /// </summary>
    public static class AmendTransportComparer
    {
        /// <summary>
        /// Compare transports based on routes 
        /// </summary>
        /// <param name="amendTransport">Amend trasport recieved from atcome VRP</param>
        /// <param name="Transport">transport from cache</param>
        /// <returns></returns>
        public static bool Equals(AmendTransport amendTransport, Transport Transport)
        {
            if (object.ReferenceEquals(amendTransport, Transport))
            {
                return true;
            }

            if (object.ReferenceEquals(amendTransport, null) || object.ReferenceEquals(Transport, null))
            {
                return false;
            }

            if (amendTransport.Routes.Count != Transport.Routes.Count)
            {
                return false;
            }

            for (int i = 0; i < Transport.Routes.Count; i++)
            {
                var isEqual =
                    Transport.Routes[i].DepPt == amendTransport.Routes[i].DepPt
                    && Transport.Routes[i].DepDate == amendTransport.Routes[i].DepDate
                    && Transport.Routes[i].ArrPt == amendTransport.Routes[i].ArrPt
                    && Transport.Routes[i].ArrDate == amendTransport.Routes[i].ArrDate
                    && Transport.Routes[i].FltNo == amendTransport.Routes[i].FltNo;

                if (!isEqual) return false;
            }

            return true;
        }

        public static bool Equals(Transport amendTransport, Transport Transport)
        {
            if (object.ReferenceEquals(amendTransport, Transport))
            {
                return true;
            }

            if (object.ReferenceEquals(amendTransport, null) || object.ReferenceEquals(Transport, null))
            {
                return false;
            }

            if (amendTransport.Routes.Count != Transport.Routes.Count)
            {
                return false;
            }

            for (int i = 0; i < Transport.Routes.Count; i++)
            {
                var isEqual =
                    Transport.Routes[i].DepPt == amendTransport.Routes[i].DepPt
                    && Transport.Routes[i].DepDate.Value.Date == amendTransport.Routes[i].DepDate.Value.Date
                    && Transport.Routes[i].ArrPt == amendTransport.Routes[i].ArrPt
                    && Transport.Routes[i].ArrDate.Value.Date == amendTransport.Routes[i].ArrDate.Value.Date
                    && Transport.Routes[i].FlightNumberWithoutCar == amendTransport.Routes[i].FlightNumberWithoutCar;

                if (!isEqual) return false;
            }

            return true;
        }

        /// <summary>
        /// Returns hash code of amend transport
        /// </summary>
        /// <param name="obj">amend transport object</param>
        /// <returns></returns>
        public static int GetHashCode(AmendTransport obj)
        {
            var hashCode = new HashCode();
            foreach (var route in obj.Routes)
            {
                hashCode.Add(route.DepPt);
                hashCode.Add(route.DepDate);
                hashCode.Add(route.ArrPt);
                hashCode.Add(route.ArrDate);
                hashCode.Add(route.FltNo);
            }
            return hashCode.ToHashCode();
        }
    }
}