# 02 Crawl event pages

Fetch each public event page and normalize event metadata.

## Acceptance
- title and datetime extracted where available
- organizer and venue extracted where available
- online status preserved
- parser failures recorded, not silently dropped
