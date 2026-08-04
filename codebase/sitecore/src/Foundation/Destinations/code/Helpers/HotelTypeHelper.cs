using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Utilities;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Helpers
{
    public static class HotelTypeHelper
    {
        public static HotelSourceType ResolveHotelType(HotelSearchResultItem document)
        {
            return ResolveHotelTypeFromCodes(GetSourceCodes(document), document?.ItemId?.ToString());
        }

        public static HotelSourceType ResolveHotelType(Item hotelItem)
        {
            if (hotelItem == null)
            {
                throw new ArgumentNullException(nameof(hotelItem));
            }

            return ResolveHotelTypeFromCodes(GetRoomSourceCodes(hotelItem), hotelItem.ID.ToString());
        }

        public static HotelRoom[] ResolveExpediaRoomTypes(Item hotelItem)
        {
            var expediaRoomsFolder = ResolveExpediaRoomsFolder(hotelItem);

            if (expediaRoomsFolder == null)
            {
                return Array.Empty<HotelRoom>();
            }

            return RoomMapper.GetExpediaHotelRooms(expediaRoomsFolder)
                .Where(room => room != null)
                .ToArray();
        }

        private static Item ResolveExpediaRoomsFolder(Item hotelItem)
        {
            if (hotelItem == null)
            {
                return null;
            }

            return hotelItem.Children
                .FirstOrDefault(x =>
                    x.TemplateID == Constants.TemplateIds.AccommodationRoomsFolder &&
                    AtcomCodeUtils.IsExpediaRoomFolderCode(x[Constants.Fields.DatasourceItem.Code]));
        }

        private static HotelSourceType ResolveHotelTypeFromCodes(IEnumerable<string> sourceCodes, string context)
        {
            var codes = sourceCodes?.Where(x => !string.IsNullOrWhiteSpace(x)).ToArray()
                       ?? Array.Empty<string>();

            if (codes.Length > 1)
            {
                return HotelSourceType.Regular;
            }

            var sourceCode = codes.FirstOrDefault();

            if (string.IsNullOrWhiteSpace(sourceCode))
            {
                throw new InvalidOperationException($"Hotel {context} does not contain a valid source code.");
            }

            if (AtcomCodeUtils.IsExpediaRoomFolderCode(sourceCode))
            {
                return HotelSourceType.Expedia;
            }

            if (AtcomCodeUtils.IsHotelBedsRoomFolderCode(sourceCode))
            {
                return HotelSourceType.HotelBeds;
            }

            return HotelSourceType.Regular;
        }

        private static IEnumerable<string> GetSourceCodes(HotelSearchResultItem document)
        {
            return document?.SourceCodes?
                .Where(code => !string.IsNullOrWhiteSpace(code))
                ?? Enumerable.Empty<string>();
        }

        private static IEnumerable<string> GetRoomSourceCodes(Item hotelItem) =>
            hotelItem.Children
                .Where(x => x.TemplateID == Constants.TemplateIds.AccommodationRoomsFolder)
                .Select(x => x[Constants.Fields.DatasourceItem.Code])
                .Where(code => !string.IsNullOrWhiteSpace(code))
                .Select(code => code.Trim());
    }
}
