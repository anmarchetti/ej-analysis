using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.Voucherify.ContentSearch.Repositories;
using easyJet.Foundation.Voucherify.Mappers;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Requests;
using easyJet.Foundation.Voucherify.Validator;

namespace easyJet.Foundation.Voucherify.Services
{
    [Service(typeof(IPromotionService), Lifetime = Lifetime.Transient)]
    public class PromotionService : IPromotionService
    {
        private readonly IHtmlCacheRepository cacheRepository;
        private readonly IValidateBookingRequestMapper validateBookingRequestMapper;
        private readonly IPromotionRepository promotionRepository;
        private readonly ISitecoreContext sitecoreContext;
        private readonly IPromotionValidationService validationService;

        public PromotionService(
            IHtmlCacheRepository cacheRepository,
            IValidateBookingRequestMapper validateBookingRequestMapper,
            IPromotionRepository promotionRepository,
            ISitecoreContext sitecoreContext,
            IPromotionValidationService validationService)
        {
            this.cacheRepository = cacheRepository;
            this.validateBookingRequestMapper = validateBookingRequestMapper;
            this.promotionRepository = promotionRepository;
            this.sitecoreContext = sitecoreContext;
            this.validationService = validationService;
        }

        /// <inheritdoc/>
        public IReadOnlyCollection<Promotion> GetPromotionsByCode(string code, string marketCode)
        {
            if (string.IsNullOrEmpty(code))
            {
                return new List<Promotion>();
            }

            var siteName = sitecoreContext.Site?.Name;
            var language = sitecoreContext.Language.Name;
            string cacheKey = $"Voucherify.Cache.Promotions.{siteName}.{marketCode}.{language}.{code}";

            return cacheRepository.GetOrAdd(cacheKey, () =>
            {
                var items = promotionRepository.GetPromotions(code, marketCode, sitecoreContext.Language);
                return items.Select(i => new Promotion(i)).ToList();
            });
        }

        /// <inheritdoc/>
        public Promotion GetPromotionByAtcomPromoCode(string code, string marketCode, bool returnAll = false)
        {
            if (string.IsNullOrEmpty(code))
            {
                return null;
            }

            var siteName = sitecoreContext.Site?.Name;
            var language = sitecoreContext.Language.Name;
            string cacheKey = $"Voucherify.Cache.Promotion.Atcom.{siteName}.{marketCode}.{language}.{code}";

            return cacheRepository.GetOrAdd(cacheKey, () =>
            {
                var item = promotionRepository.GetPromotionByAtcomCode(code, marketCode);
                return item != null ? new Promotion(item, code, returnAll) : null;
            });
        }

        /// <inheritdoc/>
        public IEnumerable<Promotion> GetAll(string marketCode)
        {
            var siteName = sitecoreContext.Site?.Name;
            var cacheKey = $"Voucherify.Cache.Promotions.{siteName}.{marketCode}";
            return cacheRepository.GetOrAdd(cacheKey, () =>
            {
                var items = promotionRepository.GetAll(marketCode);
                return items?.Select(x => new Promotion(x)) ?? Array.Empty<Promotion>();
            });
        }

        public Dictionary<string, PromocodeDiscounts> MatchPromocodeForOffers(string voucherCode, IEnumerable<ValidateBookingRequest> validateBookingRequests, string marketCode)
        {
            var promotion = GetPromotionByAtcomPromoCode(voucherCode, marketCode, true);

            var promoCodeDiscounts = new Dictionary<string, PromocodeDiscounts>();

            if (promotion == null || string.IsNullOrEmpty(promotion.Title))
            {
                return promoCodeDiscounts;
            }

            var validateBookings = validateBookingRequestMapper.MapFromValidateBookingRequest(validateBookingRequests.ToArray());

            foreach (var validateBooking in validateBookings)
            {
                // checks if generic promotion criteria is valid
                if (validationService.Validate(promotion, validateBooking).Count > 0)
                {
                    continue;
                }

                // checks promo codes validity if true adds discounts values to the dictionary of the highest available offer
                foreach (var promotionCode in promotion.PromotionCodes)
                {
                    var errors = validationService.Validate(promotionCode, validateBooking);
                    if (errors.Count > 0)
                    {
                        continue;
                    }

                    promoCodeDiscounts.Add(validateBooking.Id, promotionCode);
                    break;
                }
            }

            return promoCodeDiscounts;
        }
    }
}