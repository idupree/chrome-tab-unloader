
Placeholder page design
===

Reasons to make the placeholder page be what it is (a `data:text/html`
URI arranged a certain way):

I put the embedded URL near the beginning of the placeholder's URL,
with a minimum of escaping, so that you can copy it out yourself
if needed.  The only character you might have to unescape is the
fragment `#` mark (`%23`) because putting that literally would
cause the rest of the data uri to be a fragment instead of HTML.
(Possibly I could *end* the embedded URL with
`<script type="url">..url..` to not even have to escape the `#`?
If I handled properly the page itself's use of the `#` in its URL.)

I made the page work even if this extension isn't installed
anymore, because it might end up in bookmarks or copied somewhere.

I made the page let you get to its target without Javascript, in
case Javascript got turned off for that page somehow.

I made the page work even if you copy the URL to a new tab
Though unfortunately this has tension with preserving your browsing
history when you don't copy the URL.  In one choice, your
tab "back" history gets longer every time you unload then load
a page.  In the other choice, if you copied around the data: URL,
you might have to go "forward" after re-loading the page
in order to actually get to the page.  Maybe eventually
there will be an API that makes this all work great.

The favicon is an embedded data: URI, instead of pointing to the original
server favicon, for two reasons.  It makes the favicon work without
any network access, and it allows me to modify the favicon to make
it easier to see that a tab is unloaded (e.g. making its color grayer).

Attribution
===

Icon is from [wikimedia](https://commons.wikimedia.org/wiki/File:Clothes_hanger_icon_3.svg)
under CC-BY-SA 4.0 International.

