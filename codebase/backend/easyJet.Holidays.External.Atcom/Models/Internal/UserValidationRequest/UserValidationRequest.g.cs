using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;

namespace easyJet.Holidays.External.Atcom.Models.Internal
{
    /// <summary>
    /// UserValidationRequest to atcom API
    /// </summary>
    [GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [SerializableAttribute()]
    [DebuggerStepThroughAttribute()]
    [DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/UserValidationRequest")]
    [System.Xml.Serialization.XmlRootAttribute(Namespace = "AtComRes/UserValidationRequest", IsNullable = false)]
    public partial class UserValidationRequest : AtcomresBaseRequest
    {

        private string userPwdField;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("User_Pwd", Namespace = "AtComRes/Common")]
        public string UserPwd
        {
            get
            {
                return this.userPwdField;
            }
            set
            {
                this.userPwdField = value;
            }
        }
    }
}