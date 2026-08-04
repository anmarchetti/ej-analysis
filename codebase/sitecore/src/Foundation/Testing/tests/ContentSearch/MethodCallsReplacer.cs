using System.Linq;
using System.Linq.Expressions;

namespace easyJet.Foundation.Testing.ContentSearch
{
    internal class MethodCallsReplacer : ExpressionVisitor
    {
        private readonly Method methodToReplace;

        private readonly Method replacingMethod;

        public MethodCallsReplacer(Method methodToReplace, Method replacingMethod)
        {
            this.methodToReplace = methodToReplace;
            this.replacingMethod = replacingMethod;
        }

        protected override Expression VisitMethodCall(MethodCallExpression node)
        {
            return IsMethodToReplace(node)
                ? ReplaceWith(node)
                : base.VisitMethodCall(node);
        }

        private bool IsMethodToReplace(MethodCallExpression node)
        {
            return node.Method.IsGenericMethod && node.Method.GetGenericMethodDefinition() == methodToReplace.MethodInfo;
        }

        private Expression ReplaceWith(MethodCallExpression node)
        {
            var arguments = node.Arguments.ToArray();
            var type = node.Method.GetGenericArguments().First();
            var newMethod = replacingMethod.MethodInfo.MakeGenericMethod(type);

            return Expression.Call(newMethod, arguments);
        }
    }
}
