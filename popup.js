
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
// "Hasn't loaded" could probably be checked by equality
// comparison to chrome://favicon/something-that-doesnt-exist
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
    //ctx.globalCompositeOperation = "source-in";
    //ctx.fillStyle = "#d00";
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

function swizzleTab(tab) {
  var okToSwizzle = (
    !!tab.url && /^https?:\/\//.test(tab.url) &&
    !tab.pinned &&
    tab.id != null
    );
  if(okToSwizzle) {
    getModifiedFaviconImageAsDataUri(tab.url, function(faviconDataUri) {
    // TODO
    // make favicon be data:? (and maybe modified in the corner to show suspendedness?)
    // take screenshot of page for some use?
    // unicode for btoa
    var title = tab.title || '(untitled)';
    var hiddenTabHtml = ('<!DOCTYPE html>' +
      //'<html><head>' +
      //'<meta charset="utf-8" />' +
      // here just to make it easier for the user to rescue the url if needed
      //'<link href="' + htmlEscape(tab.url) + '" rel="" />' +
      // URLs should never have < in them anyway, but just in case
      '<script type="url">' + tab.url.replace(/<\/script/g, '%3C/script') + '</script>' +
      //'<link href="' + htmlEscape(tab.url) + '" rel="alternate" />' +
      '<title>' + htmlEscape(title) + '</title>' +
      '<link rel="icon" href="' + htmlEscape(faviconDataUri) + '" />' +
      //(tab.favIconUrl ? '<link rel="icon" href="' +
      //                  htmlEscape(tab.favIconUrl) +
      //'" />' : '') +
      '<style>' +
      //'html{background-color:#b9f}' +
      'html{background-color:#dcf}' +
      'html,body,a{width:100%;height:100%;display:block;text-align:center}' +
      'a{display:flex;align-items:center;justify-content:center;text-decoration:none;color:#808}' +
      'h1{font-size:4rem}' +
      'p{font-size:1rem;margin:25px}' +
      '</style>' +
      //'</head>' +
      //'<body>' +
      //'<a rel="noreferrer" onclick="history.back()" href="' + htmlEscape(tab.url) + '"><span>click to reload</span></a>'
      // location.replace with a hash only change doesn't reload
      '<a rel="noreferrer" href="' + htmlEscape(tab.url) + '"><div>' +
      '<h1>click to reload</h1>' +
      '<p>' + htmlEscape(tab.url) + '</p>' +
      '<img src="' + htmlEscape(tab.favIconUrl) + '" width="128" height="128" />' +
      '<p>(if anything goes wrong,<br />"forward" may fix it)</p>' +
      '</div></a>' +
      '<script>' +
        'var a = document.getElementsByTagName("a")[0];' +
        'var b = (location.hash === "#nomoreback");' +
        'if(b) { location.replace(a.href); }' +
        'a.addEventListener("click", function(e){' +
          'if(!b) {' +
            'b = true;' +
            'e.preventDefault();' +
            'location.replace(location.href + "#nomoreback");' +
            'history.back();' +
          '}' +
        '});' +
      '</script>'
      //'<script>var a = document.getElementsByTagName("a")[0]; var h = +location.hash.slice(1); if(h > 0) { if(h > Date.now() - 1000) { history.back(); } else { location.replace(a.href); } } else { a.addEventListener("click", function(e){ e.preventDefault(); location.replace(location.href + "#" + Date.now()); }); }</script>' //history.back(); location.replace(a.href);
      // b was not remembered, and sessionStorage is disabled in data: uris
      // '<script>var a = document.getElementsByTagName("a")[0]; var b = false; a.addEventListener("click", function(e){ if(!b) { b = true; e.preventDefault(); history.back(); } });</script>' //history.back(); location.replace(a.href);
      // can't use history.pushState at all in a data: document
      // '<script>var a = document.getElementsByTagName("a")[0]; if(location.hash === "go") { location.replace(a.href); }; a.addEventListener("click", function(e){ e.preventDefault(); history.pushState(null, null, location.href+"#go"); history.go(-2); });</script>' //history.back(); location.replace(a.href);
      //'</body></html>'
      );
    var hiddenTabDataUri = ('data:text/html;charset=utf-8,' +
      // escape everything by default but make exceptions for things I can
      // get away with in chrome, so that it looks better.
      // https://url.spec.whatwg.org/#url-code-points
      // valid replacements: /:;=,&+
      // not actually valid: space, {, }, [, ]
      // can't even hackily do it: #
      // also, the &amp;s in URLs are basically can't do much about that.
      // I could put them in a <script> I guess.
      percentDeEscapeChars(encodeURIComponent(hiddenTabHtml), '!$&\'()*+,-./:;=?@_~' + ' {}[]'));
//      ).replace(/%2F/g, '/').replace(/%3A/g, ':').replace(/%2B/g, '+').replace(/%26/g, '&'
//      ).replace(/%3D/g, '=').replace(/%2C/g, ',').replace(/%3B/g, ';').replace(/%3F/g, '?'
//      ).replace(/%20/g, ' ').replace(/%7B/g, '{').replace(/%7D/g, '}'
//      ).replace(/%5B/g, '[').replace(/%5D/g, ']'));
    //console.log("hi", tab.pinned, tab.title, tab.favIconUrl);
    //status.textContent = "hi " + tab.pinned + ' ' + tab.title + ' ' + tab.favIconUrl;
    //chrome.tabs.create({url: hiddenTabDataUri});
    chrome.tabs.update(tab.id, {url: hiddenTabDataUri}, function() {
      // history.back() will work here, and better preserve the user's history
      // and form fields, but if they copy/paste the data: url then history.back()
      // won't work so don't include this script as part of the data url.
      // (Unsure if they quit and re-open their browser, how to deal best with that.)
      // history.length can be 2 for new-tab + this or actual-content + this.
      // document.referrer was "" in both cases and I'm not sure if I can change
      // that with chrome extension tabs api.
      // Oh drat this executeScript isn't allowed for this origin unless I allow this
      // origin. Uh. Would send message even work?
      //chrome.tabs.executeScript(tab.id, {
      //  runAt: 'document_end',
      //  code: 'document.getElementsByTagName("a")[0].addEventListener("click", function(){ history.back(); });'
      //});
    });
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var status = document.getElementById('status');
  chrome.tabs.query({}, function(tabs) {
    var tab = tabs[9];
    swizzleTab(tab);
  });
});

