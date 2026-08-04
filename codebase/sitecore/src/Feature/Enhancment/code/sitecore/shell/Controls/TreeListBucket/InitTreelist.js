var initTreelist = function (parameters) {
    if (!document.getElementById('TreeBucketListJs')) {
        var head = document.getElementsByTagName('head')[0];
        head.appendChild(new Element('script', { type: 'text/javascript', src: '/sitecore/shell/Controls/TreeListBucket/TreeBucketList.js', id: 'TreeBucketListJs' }));
        head.appendChild(new Element('link', { rel: 'stylesheet', href: '/sitecore/shell/Controls/TreeListBucket/TreeBucketList.css' }));
        head.appendChild(new Element('link', { rel: 'stylesheet', href: '/sitecore/shell/Controls/BucketList/BucketList.css' }));
    }
    var stopAt = Date.now() + 10000;
    var timeoutId = setInterval(function () {
        if (window.Sitecore && Sitecore.InitTreeListBucket) {
            clearInterval(timeoutId);
            Sitecore.InitTreeListBucket(parameters);
        } else if (Date.now() > stopAt) {
            clearInterval(timeoutId);
            console.log('Unable to init Multilist with search control')
        }
    }, 100);
};