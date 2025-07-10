- Add automatic search functionality with a debounce mechanism, so the search activates after the user stops typing, without requiring them to press Enter.

Problems on mobile (FIXED):
- ✅ Top nav does not open (the menu button is non-responsive) - Fixed by removing inline onclick
- ✅ The return link in the topnav is not working correctly, it points always to "/" - Fixed by preserving category parameter
- ✅ The print button in slug does not work - Fixed by removing inline onclick
- ✅ Search does not function - Should work now (Preact component)
- ✅ Filters do not work (they do popup) - Should work now (no inline handlers)
- ✅ in filter popups, when selected a filter inside the popup, it collapses the focused parent button, causing width collapse - Fixed by removing min-width
- ✅ The reseptit slug nav, its timer and the nav button work great, but the timer links (mjs) do not work - Fixed by replacing inline onclick with data attributes

The CSP issue was:
``` 
> HTTP/1.1 200 OK
> Server: nginx
> Date: Wed, 09 Jul 2025 23:45:49 GMT
> Content-Type: text/html
> Content-Length: 37379
> Last-Modified: Wed, 09 Jul 2025 01:38:09 GMT
> Connection: keep-alive
> Vary: Accept-Encoding
> ETag: "686dc801-9203"
> Strict-Transport-Security: max-age=63072000
> X-Frame-Options: SAMEORIGIN
> X-XSS-Protection: 1; mode=block
> X-Content-Type-Options: nosniff
> Referrer-Policy: strict-origin-when-cross-origin
> Content-Security-Policy: default-src 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';  // [!code highlight]
> Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
> Accept-Ranges: bytes
```
).
