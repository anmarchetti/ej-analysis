using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Moq;
using System.Text;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace easyJet.Holidays.Api.Tests.Filters;

public class EnforceKeyNamesForSensitiveDataInPaymentInfoAttributeTests
{
    [Fact(DisplayName = "When paymentType is ApplePay, should successfully call the next action filter")]
    public async Task OnActionExecutionAsync_WhenPaymentTypeIsApplePay_ShouldBeSuccessfullyCallTheNextFilter()
    {
        var mockJson = "{\"paymentInfo\":{\"paymentType\":\"ApplePay\"}}";
        
        var mockNext = new Mock<ActionExecutionDelegate>();
        
        var mockContext = CreateActionExecutingContext(mockJson);
        
        var filter = new EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute();
        
        await filter.OnActionExecutionAsync(mockContext, mockNext.Object);
        
        Assert.Single(mockNext.Invocations);
    }
    
    [Fact(DisplayName = "When paymentType is by credit/debit card and keys are ok, should successfully call the next action filter")]
    public async Task OnActionExecutionAsync_WhenPaymentTypeIsCreditKeysAreValid_ShouldBeSuccessfullyCallTheNextFilter()
    {
        var mockJson = "{\"paymentInfo\":{\"paymentType\":\"CreditDebitCard\",\"cardNumber\":\"1234\",\"cvv\":\"123\"}}";
        
        var mockNext = new Mock<ActionExecutionDelegate>();
        
        var mockContext = CreateActionExecutingContext(mockJson);
        
        var filter = new EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute();
        
        await filter.OnActionExecutionAsync(mockContext, mockNext.Object);
        
        Assert.Single(mockNext.Invocations);
    }
    
    [Fact(DisplayName = "When paymentType is by credit/debit card and keys are invalid, should throw an APIException")]
    public async Task OnActionExecutionAsync_WhenKeysAreInvalid_ShouldThrowAnAPIException()
    {
        var mockJson = "{\"paymentInfo\":{\"paymentType\":\"CreditDebitCard\",\"CardNumber\":\"1234\",\"CVV\":\"123\"}}";
        
        var mockNext = new Mock<ActionExecutionDelegate>();
        
        var mockContext = CreateActionExecutingContext(mockJson);
        
        var filter = new EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute();
        
        await Assert.ThrowsAsync<ApiException>(async () => await filter.OnActionExecutionAsync(mockContext, mockNext.Object));
    }
    
    [Fact(DisplayName = "When there is no paymentInfo object, should successfully call the next action filter")]
    public async Task OnActionExecutionAsync_WhenPaymentInfoIsMissing_ShouldBeSuccessfullyCallTheNextFilter()
    {
        var mockJson = "{\"testKey\":{\"fieldA\":\"AAA\",\"fieldB\":\"BBB\",\"fieldC\":\"CCC\"}}";
        
        var mockNext = new Mock<ActionExecutionDelegate>();
        
        var mockContext = CreateActionExecutingContext(mockJson);
        
        var filter = new EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute();
        
        await filter.OnActionExecutionAsync(mockContext, mockNext.Object);
        
        Assert.Single(mockNext.Invocations);
    }
    
    [Fact(DisplayName = "When there is no paymentType in paymentInfo and the keys are ok, should successfully call the next action filter")]
    public async Task OnActionExecutionAsync_WhenPaymentTypeIsMissingAndKeysAreValid_ShouldBeSuccessfullyCallTheNextFilter()
    {
        var mockJson = "{\"paymentInfo\":{\"cardNumber\":\"AAA\",\"cvv\":\"BBB\",\"fieldC\":\"CCC\"}}";
        
        var mockNext = new Mock<ActionExecutionDelegate>();
        
        var mockContext = CreateActionExecutingContext(mockJson);
        
        var filter = new EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute();
        
        await filter.OnActionExecutionAsync(mockContext, mockNext.Object);
        
        Assert.Single(mockNext.Invocations);
    }
    
    [Fact(DisplayName = "When there is no paymentType in paymentInfo and keys are invalid, should throw an APIException")]
    public async Task OnActionExecutionAsync_WhenPaymentTypeIsMissingAndKeysAreInValid_ShouldThrowAnAPIException()
    {
        var mockJson = "{\"paymentInfo\":{\"CardNumber\":\"AAA\",\"Cvv\":\"BBB\",\"fieldC\":\"CCC\"}}";
        
        var mockNext = new Mock<ActionExecutionDelegate>();
        
        var mockContext = CreateActionExecutingContext(mockJson);
        
        var filter = new EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute();
        
        await Assert.ThrowsAsync<ApiException>(async () => await filter.OnActionExecutionAsync(mockContext, mockNext.Object));
    }
    
    [Fact(DisplayName = "When there is no paymentType in paymentInfo and there is creditAmount and the keys are ok, should successfully call the next action filter")]
    public async Task OnActionExecutionAsync_WhenPaymentTypeIsMissingAndThereIsCreditAmountAndKeysAreValid_ShouldBeSuccessfullyCallTheNextFilter()
    {
        var mockJson = "{\"paymentInfo\":{\"cardNumber\":\"AAA\",\"cvv\":\"BBB\",\"creditAmount\":\"CCC\"}}";
        
        var mockNext = new Mock<ActionExecutionDelegate>();
        
        var mockContext = CreateActionExecutingContext(mockJson);
        
        var filter = new EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute();
        
        await filter.OnActionExecutionAsync(mockContext, mockNext.Object);
        
        Assert.Single(mockNext.Invocations);
    }
    
    [Fact(DisplayName = "When there is no paymentType in paymentInfo and there is creditAmount and the keys are invalid, should throw an APIException")]
    public async Task OnActionExecutionAsync_WhenPaymentTypeIsMissingAndThereIsCreditAmountAndKeysAreInValid_ShouldThrowAnAPIException()
    {
        var mockJson = "{\"paymentInfo\":{\"carDNumber\":\"AAA\",\"cVv\":\"BBB\",\"creditAmount\":\"CCC\"}}";
        
        var mockNext = new Mock<ActionExecutionDelegate>();
        
        var mockContext = CreateActionExecutingContext(mockJson);
        
        var filter = new EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute();
        
        await Assert.ThrowsAsync<ApiException>(async () => await filter.OnActionExecutionAsync(mockContext, mockNext.Object));
    }
    
    [Fact(DisplayName = "When there is no paymentType in paymentInfo and there is creditAmount and there are no keys, should successfully call the next action filter")]
    public async Task OnActionExecutionAsync_WhenPaymentTypeIsMissingAndThereIsCreditAmountAndAreNoKeys_ShouldBeSuccessfullyCallTheNextFilter()
    {
        var mockJson = "{\"paymentInfo\":{\"creditAmount\":\"CCC\"}}";
        
        var mockNext = new Mock<ActionExecutionDelegate>();
        
        var mockContext = CreateActionExecutingContext(mockJson);
        
        var filter = new EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute();
        
        await filter.OnActionExecutionAsync(mockContext, mockNext.Object);
        
        Assert.Single(mockNext.Invocations);
    }
    
    private static ActionExecutingContext CreateActionExecutingContext(string jsonBody)
    {
        var request = new Mock<HttpRequest>();
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(jsonBody));
        request.SetupGet(r => r.Body).Returns(stream);

        var httpContext = new Mock<HttpContext>();
        httpContext.SetupGet(c => c.Request).Returns(request.Object);

        var actionContext = new ActionContext(
            httpContext.Object,
            new Microsoft.AspNetCore.Routing.RouteData(),
            new Microsoft.AspNetCore.Mvc.Abstractions.ActionDescriptor(),
            new ModelStateDictionary()
        );

        return new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>(),
            new object());
    }
}

