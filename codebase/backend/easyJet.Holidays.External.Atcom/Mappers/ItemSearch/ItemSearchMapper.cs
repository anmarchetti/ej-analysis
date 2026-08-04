using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;

namespace easyJet.Holidays.External.Atcom.Mappers.ItemSearch
{
    /// <summary>
    /// ItemSearchMapper is responsible for creating requests
    /// </summary>
    public class ItemSearchMapper
    {
        /// <summary>
        /// Map search request to Atcom request
        /// </summary>
        /// <param name="offer">offer</param>
        /// <param name="cltInfo">cltInfo</param>
        /// <returns></returns>
        public static ItemSearchRequest BuildRequest(Holidays.Api.Domain.Data.PackageOffers.Offer offer, CltInfo cltInfo)
        {
            ArgumentNullException.ThrowIfNull(offer);
            var accommodation = offer.Accom;
            ArgumentNullException.ThrowIfNull(accommodation?.Stay);
            var accommodationUnit = accommodation.Unit;
            var outFlight = offer.Transport.Routes[0];
            var inFlight = offer.Transport.Routes[1];

            // Prepare request parts
            var allPaxs = (offer.Accom.Unit.SelectMany(u => u?.Occupation?.PaxIds) ?? new List<int>())
                .Select((x, idx) => new SubServPax
                {
                    Pax_Id = (idx + 1).ToString()
                })
                .ToArray();

            var itemSearchRequest = new ItemSearchRequest()
            {
                Adm = VrpRequestUtils.BuildAdm(),
                CltInfo = cltInfo,

                St_Dt = DateFormatUtils.DateOnly(accommodation.Date),
                Occs = accommodationUnit.Select((unit, idx) => new Occ
                {
                    Rm_No = (idx + 1).ToString(),
                    Pax = unit?.Occupation?.PaxIds?.Select(paxId => new Pax
                    {
                        Index = paxId.ToString(),
                    }).ToArray()
                }).ToArray(),

                Base_Prd = new ItemSearchRequestBase_Prd
                {
                    Accom = new[] {
                        new Accom {
                            St_Dt =  DateFormatUtils.DateOnly(accommodation.Date),
                            End_Dt = DateFormatUtils.DateOnly(accommodation.Date.AddDays((double)accommodation.Stay)),
                            HtlPrd = new HtlPrd {
                                Prom = new Prom {
                                    Code = accommodation.Prom
                                },
                                Acc_Cd = accommodation.Code,
                                Acc_InvStateSpecified = true,
                                Acc_InvState = accommodation.IsExternal ? Acc_InvState.EXTERNAL : Acc_InvState.INTERNAL
                            },

                             Rm_Cd = accommodationUnit.Select((unit, idx) => new Rm_Cd
                             {
                                Rm_No = (idx + 1).ToString(),
                                Code = unit.Code,
                                BB_Cd = unit.Board,
                                Ser_Sts = new[] { Ser_Sts.FIX},
                                SubServPaxs = unit?.Occupation?.PaxIds?.Select(paxId => new SubServPax {
                                    Pax_Id = paxId.ToString(),
                                }).ToArray()
                            }).ToArray()
                        }
                    },
                    Route = new[]
                    {
                        RouteMapper.BuildRoute(outFlight,  accommodation.Prom, allPaxs, true),
                        RouteMapper.BuildRoute(inFlight, accommodation.Prom, allPaxs, false),
                    }
                }
            };

            return itemSearchRequest;
        }
    }
}
