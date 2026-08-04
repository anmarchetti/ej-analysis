using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.Atcom.Models.Internal
{
    [GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [SerializableAttribute()]
    [DebuggerStepThroughAttribute()]
    [DesignerCategoryAttribute("code")]
    [XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/ModifyCustPaymentRequest")]
    [XmlRootAttribute(Namespace = "AtComRes/ModifyCustPaymentRequest", IsNullable = false)]
    public class ModifyCustPaymentRequest : AtcomresBookingBaseRequest
    {
        public ModifyCustPaymentRequest()
        {
        }

        public ModifyCustPaymentRequest(AtcomresBookingBaseRequest request)
        {
            this.Adm = request.Adm;
            this.CltInfo = request.CltInfo;
            this.CusDet = request.CusDet;
            this.TrvDox = request.TrvDox;
        }
    }
}
