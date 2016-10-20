
function htmlEscape(str) {
  return (
     str.replace(/&/g, '&amp;'
       ).replace(/"/g, '&quot;'
       ).replace(/</g, '&lt;'
       ).replace(/>/g, '&gt;'
     ));
}
// TODO: if the chrome://favicon/ hasn't loaded yet,
// should I do something else like waiting a little while
// or using tab.favIconUrl directly?
//
// "Hasn't loaded" could probably be checked by equality
// comparison to chrome://favicon/something-that-doesnt-exist
//
// (Using tab.favIconUrl has more problems from this extension
// not having access to the site's origin, so not being able
// to modify the image as well. I don't want users of the addon
// to have to trust the addon with access to all origins.)
function getFaviconImageAsElement(url, callback) {
  var faviconUrl = 'chrome://favicon/' + url;
  var img = document.createElement("img");
  img.addEventListener("load", function() {
    callback(img);
  });
  img.src = faviconUrl;
}
function getModifiedFaviconImageAsDataUri(url, callback) {
  getFaviconImageAsElement(url, function(img) {
    var canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, 16, 16);
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = 'rgba(127, 127, 127, 0.5)';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fill();
    callback(canvas.toDataURL());
  });
}

function percentDeEscapeChars(string, chars) {
  for(var i = 0; i < chars.length; i++) {
    var encoded = encodeURIComponent(chars[i]);
    if(encoded !== chars[i]) {
      string = string.replace(new RegExp(encoded, 'gi'), chars[i]);
    }
  }
  return string;
}

function swizzleTab(tab, force) {
  var okToSwizzle = (
    (force || (tab.url && /^https?:\/\//.test(tab.url) && !tab.pinned)) &&
    tab.id != null
    );
  if(okToSwizzle) {
    getModifiedFaviconImageAsDataUri(tab.url, function(faviconDataUri) {
    var title = tab.title || '(untitled)';
    var unloadedTabHtml = ('<!DOCTYPE html>' +
      // Keep the data URI short by omitting tags that it's valid to omit.
      //'<html><head>' +
      //'<meta charset="utf-8" />' +
      // Put the URL, as unescaped as possible, near the beginning of the
      // data URI so that the user can easily see and copy it if needed.
      // To let it be as unescaped as possible, put it in a <script>
      // of type that doesn't get executed as JS (nor as anything else).
      // This means even & in query strings needn't become &amp;!
      '<script type="url">' + tab.url.replace(/<\/script/g, '%3C/script') + '</script>' +
      '<title>' + htmlEscape(title) + '</title>' +
      '<link rel="icon" href="' + htmlEscape(faviconDataUri) + '" />' +
      '<style>' +
      'html{background-color:#dcf}' +
      'html,body,a{width:100%;height:100%;margin:0;display:block;text-align:center}' +
      'a{display:flex;align-items:center;justify-content:center;text-decoration:none;color:#808}' +
      'h1{font-size:4rem}' +
      'p{font-size:1rem;margin:25px}' +
      '</style>' +
      //'</head>' +
      //'<body>' +
      // location.replace with a hash only change doesn't reload
      '<a rel="noreferrer" href="' + htmlEscape(tab.url) + '"><div>' +
      '<h1>click to reload</h1>' +
      '<p>' + htmlEscape(tab.url) + '</p>' +
      // TODO is the image likely not in cache? maybe best not to load a remote thing?
      // or auto load when the user selects this tab? dunno.
      (tab.favIconUrl ? (
      '<img src="' + htmlEscape(tab.favIconUrl) + '" width="128" height="128" />'
      ) : '') +
      '<p>(if anything goes wrong,<br />"forward" may fix it)</p>' +
      '</div></a>' +
      // Put the script here instead of in chrome.tabs.executeScript
      // both because the permissions are simpler, and this is less likely
      // to get lost when the browser restarts or this extension is
      // uninstalled etc.
      '<script>' +
        'var a = document.getElementsByTagName("a")[0];' +
        'var b = (location.hash === "#nomoreback");' +
        'if(b) { location.replace(a.href); }' +
        'a.addEventListener("click", function(e){' +
          'if(!b) {' +
            'b = true;' +
            'e.preventDefault();' +
            'location.replace(location.href + "#nomoreback");' +
            'if(history.length >= 2) { history.back(); } else { location.replace(a.href); }' +
          '}' +
        '});' +
      '</script>'
      //'</body>' +
      //'</html>'
      );
    // In the data URI, escape everything by default for safety,
    // but make exceptions for characters I can get away with unescaping
    // (based on tests in Chrome), so that it looks clearer in the URL bar.
    // https://url.spec.whatwg.org/#url-code-points
    // valid replacements: /:;=,&+
    // not actually valid: space, {, }, [, ]
    // can't even hackily do it: #
    var unloadedTabDataUri = ('data:text/html;charset=utf-8,' +
      percentDeEscapeChars(encodeURIComponent(unloadedTabHtml), '!$&\'()*+,-./:;=?@_~' + ' {}[]'));
    chrome.tabs.update(tab.id, {url: unloadedTabDataUri}, function() {});
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var status = document.getElementById('status');
  var unloadthis = document.getElementById('unloadthis');
  var unloadnonpinned = document.getElementById('unloadnonpinned');
  unloadthis.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      tabs.forEach(function(tab) {
        swizzleTab(tab, true);
      });
    });
  });
  unloadnonpinned.addEventListener('click', function() {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        swizzleTab(tab);
      });
    });
  });
});

