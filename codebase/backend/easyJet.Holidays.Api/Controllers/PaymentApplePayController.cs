﻿using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Newtonsoft.Json.Linq;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Apple Pay controller to manage Apple Pay sessions
    /// </summary>
    [Route("payment/apple-pay")]
    [ApiController]
    [ApiVersion("1.0")]
    public class PaymentApplePayController : ControllerBase
    {
        private readonly ILogger<PaymentApplePayController> _logger;
        private readonly IApplePayMerchantValidatorProxyService _applePayService;

        /// <summary>
        /// Constructor for PaymentApplePayController
        /// </summary>
        /// <param name="logger"></param>
        /// <param name="applePayService"></param>
        public PaymentApplePayController(
            ILogger<PaymentApplePayController> logger, 
            IApplePayMerchantValidatorProxyService applePayService)
        {
            _logger = logger;
            _applePayService = applePayService;
        }
        
        /// <summary>
        /// Retrieves Apple Pay sessions from Apple Pay Merchant Validator Proxy Service
        /// </summary>
        /// <returns>Apple Pay opaque session object</returns>
        [HttpPost]
        [Route("session")]
        [ProducesResponseType(typeof(object), (int) HttpStatusCode.OK)]
        [NoCacheControl]
        public async Task<IActionResult> GetApplePaySessionObject([FromBody] ApplePaySessionRequest model)
        {
            ArgumentNullException.ThrowIfNull(model);
            _logger.LogInformation("{@LogDetails}", 
            new
            {
                Message = $"ApplePay create session request from {model.RequestDomain}", 
                Model = model
            });
            
            try
            {
                JObject applePaySessionObject = await _applePayService.GetSessionObject(model.ValidationUrl, model.RequestDomain ?? HttpContext.Request.Host.Value);
                return new JsonResult(applePaySessionObject) { StatusCode = (int)HttpStatusCode.OK };
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "{@LogDetails}", 
                new
                {
                    Message = $"Error creating ApplePay Session object for {model.RequestDomain}", 
                    Model = model
                });
                
               throw new ApiException(
                   ApiExceptionCodes.ApplePaySessionError, 
                   $"Error creating ApplePay Session object for {model.RequestDomain}",
                   null, 
                   null,
                   HttpStatusCode.InternalServerError
               );
            }
        }
    }
}