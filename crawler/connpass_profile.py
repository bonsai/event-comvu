#!/usr/bin/env python3
"""Collect public connpass profile event URLs deterministically."""
from __future__ import annotations

import argparse
import json
import re
import time
from collections import deque
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import parse_qs, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen

EVENT_RE = re.compile(r"^/event/(\d+)/?(?:participation/)?$")
PROFILE = "https://connpass.com/user/vonsai/"


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        for key, value in attrs:
            if key == "href" and value:
                self.links.append(value)


def fetch(url: str) -> str:
    req = Request(url, headers={"User-Agent": "event-comvu/0.1 (+public-research)"})
    with urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def canonical_page(url: str) -> str:
    parsed = urlparse(url)
    query = parse_qs(parsed.query, keep_blank_values=False)
    page = query.get("page", ["1"])[0]
    try:
        page_no = int(page)
    except ValueError:
        page_no = 1
    query_text = "" if page_no == 1 else f"page={page_no}"
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path.rstrip("/") + "/", "", query_text, ""))


def collect(profile: str, max_pages: int = 100) -> list[str]:
    profile_path = urlparse(profile).path.rstrip("/")
    queue = deque([canonical_page(profile)])
    seen_pages: set[str] = set()
    events: dict[str, str] = {}
    host = urlparse(profile).netloc

    while queue and len(seen_pages) < max_pages:
        page = queue.popleft()
        if page in seen_pages:
            continue
        seen_pages.add(page)
        html = fetch(page)
        parser = LinkParser()
        parser.feed(html)

        for href in parser.links:
            absolute = urljoin(page, href)
            parsed = urlparse(absolute)
            if parsed.netloc != host:
                continue

            match = EVENT_RE.match(parsed.path)
            if match:
                event_id = match.group(1)
                events[event_id] = f"https://connpass.com/event/{event_id}/"
                continue

            if parsed.path.rstrip("/") == profile_path:
                query = parse_qs(parsed.query)
                if "page" in query:
                    queue.append(canonical_page(absolute))

        time.sleep(0.3)

    return [events[event_id] for event_id in sorted(events, key=int)]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", default=PROFILE)
    ap.add_argument("--out", default="data/connpass/event_urls.jsonl")
    ap.add_argument("--max-pages", type=int, default=100)
    ap.add_argument("--expected", type=int, default=176)
    args = ap.parse_args()

    urls = collect(args.profile, max_pages=args.max_pages)
    retrieved_at = datetime.now(timezone.utc).isoformat()
    with open(args.out, "w", encoding="utf-8") as f:
        for url in urls:
            match = re.search(r"/event/(\d+)/", url)
            assert match
            f.write(json.dumps({
                "person_id": "connpass:vonsai",
                "event_id": f"connpass:{match.group(1)}",
                "source_url": url,
                "retrieved_at": retrieved_at,
            }, ensure_ascii=False) + "\n")

    actual = len(urls)
    print(f"collected={actual} expected={args.expected} out={args.out}")
    if actual != args.expected:
        raise SystemExit(f"POPULATION_GATE_FAILED: expected={args.expected} actual={actual}")


if __name__ == "__main__":
    main()
