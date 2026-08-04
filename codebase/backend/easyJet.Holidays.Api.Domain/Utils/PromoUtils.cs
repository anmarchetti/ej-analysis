using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using Force.DeepCloner;

namespace easyJet.Holidays.Api.Domain.Utils
{
    /// <summary>
    /// Utils for promo
    /// </summary>
    public class PromoUtils
    {
        /// <summary>
        /// Split promo request by Geography and AccomCodes
        /// </summary>
        /// <param name="request"></param>
        /// <param name="action"></param>
        /// <param name="destinationsSearchService"></param>
        /// <param name="maxAccomCodesNumberByRequest">Max number of AccomCodes by request"</param>
        /// <typeparam name="T"></typeparam>
        /// <returns></returns>
        public static async Task<(T, bool)[]> SplitPromoRequest<T>(PackagesSearchRequest request,
           Func<PackagesSearchRequest, Task<(T, bool)>> action, IDestinationsService destinationsSearchService, int maxAccomCodesNumberByRequest)
        {
            var destinationItems =
                (await destinationsSearchService.GetPromoDestinations(request.PromoPageId)).ToList();

            #region Search by accom codes 

            if (string.IsNullOrWhiteSpace(request.AccomCodes) && destinationItems.Any(item => item.Type == DestinationItemType.Hotel))
            {
                request.AccomCodes = GeographyParseUtils.BuildAccomCodesField(destinationItems);
            }

            //Atcom only supports whether geography or accomCodes, but not both.
            //Geography value will be ignored if AccomCodes is specified.
            if (!string.IsNullOrWhiteSpace(request.AccomCodes))
            {
                //Split the request if we have a huge number of hotels(AccomCodes) to get rid of the Atcom request length limitation
                return await SplitRequestByAccomCodes(request, action, maxAccomCodesNumberByRequest);
            }

            #endregion

            //Geography is specified in the request -> do search by geography from request
            if (!string.IsNullOrWhiteSpace(request.Geography))
            {
                //Standard search mechanism if not have a accom codes from sitecore of current promopage
                return await GeographyParseUtils.DoSplitByGeographyRequests(request, action, destinationsSearchService);
            }

            //otherwise split request by destinations items from cms
            return await GeographyParseUtils.SplitRequestByDestinations(request, action, destinationItems);
        }

        /// <summary>
        /// Split the request if we have a huge number of hotels (AccomCodes) to get rid of the Atcom request length limitation
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="request"></param>
        /// <param name="action"></param>
        /// <param name="sizeOfSubset">Size of subset. Depending on the size, the request will be split or not</param>
        /// <returns>Action tasks</returns>
        private static async Task<(T, bool)[]> SplitRequestByAccomCodes<T>(PackagesSearchRequest request, Func<PackagesSearchRequest, Task<(T, bool)>> action, int sizeOfSubset)
        {
            var tasks = new List<Task<(T, bool)>>();

            var accomCodesSubSets = request.AccomCodes.Split(',').Split(sizeOfSubset);

            foreach (var accomCodesSubSet in accomCodesSubSets)
            {
                var rq = request.DeepClone();
                rq.AccomCodes = string.Join(",", accomCodesSubSet);
                tasks.Add(action(rq));
            }

            var task = await Task.WhenAll(tasks);

            return task;
        }
    }
}