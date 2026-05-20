---
title: "Privacy"
description: "A complete, honest list of every third party noadshealth ever touches and what they receive."
date: 2026-05-19
---

This page is the whole story. There is no cookie banner because there are no cookies that need consent. There is no privacy policy buried in legalese because there is no data collection to disclose. Below is every external service that ever touches your browser on noadshealth, by name.

## On page load

**Cloudflare Pages** — our host. Cloudflare's network sees every request to the site (your IP address, user agent, referrer, the URL you asked for) because that's how the internet works — somebody has to serve the page. We have **not** enabled Cloudflare Web Analytics. We do not enable any of Cloudflare's optional tracking products. Cloudflare retains standard CDN logs for a short period per their policies; we never look at them and we have nothing connected to them.

**Nothing else.** Open DevTools → Network on any page of this site and reload. You will see only requests to `noadshealth.com`. No Google Fonts, no Google Analytics, no Plausible, no Meta Pixel, no Tag Manager, no third-party widgets, no embedded social cards, no remote images.

## When you actively click something

**Amazon** — when you click an affiliate link inside an article, your browser navigates to amazon.com. From that point on you're on Amazon's site and Amazon's tracking applies. The link carries our associate tag (a short identifier like `noadsfit-20`) so Amazon knows the click came from us. Amazon does *not* tell us who you are or what you bought; they only send us aggregated commission totals once a month.

**Ko-fi** — when you click the "Support this site" button (or any direct Ko-fi link), a new tab opens at ko-fi.com. From that point on you're on Ko-fi's site. We have **no click-tracking** on the button — we don't know whether you clicked it. We only find out a tip happened when Ko-fi sends us a notification that a real tip arrived. The button can be hidden in Settings (gear icon, bottom-left).

## Settings & local data

The site stores two small values in your browser's `localStorage`:

- `theme` — your light/dark/system preference
- `showSupportBtn` — whether the Ko-fi button is visible

These never leave your browser. There is no server collecting them, no sync, no account.

## What this site explicitly does not do

- No ads, no display-network code (no AdSense, no Mediavine, no Carbon, no Ezoic, etc.)
- No analytics: no Google Analytics, no GA4, no Plausible, no Fathom, no Mixpanel, no Hotjar
- No Tag Manager, no fbq, no gtag
- No remote fonts (Google Fonts etc.) — we use your operating system's font stack
- No CDN-loaded JavaScript libraries (jQuery, Alpine, htmx etc. from a CDN)
- No social embed widgets (Twitter cards, Instagram embeds)
- No newsletter modals, no exit-intent popups, no autoplay video
- No fingerprinting libraries, no session replay
- No selling, sharing, or licensing of any data — there is no data to sell

## If this ever changes

We will update this page **before** the change ships, not after. If a new third-party service ever becomes load-bearing, it will be added here by name with what it receives. The brand promise is the page itself.
