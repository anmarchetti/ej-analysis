using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using easyJet.Foundation.WebApi.Models;

namespace easyJet.Foundation.WebApi.Services.CancellationAndRefund
{
    public interface ICancellationAndRefundService
    {
        CancellationAndRefundResponse GetCancellationAndRefundresult<T>(T data);
    }
}
