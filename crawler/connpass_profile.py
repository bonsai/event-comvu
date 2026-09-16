#!/usr/bin/env python3
"""Collect public connpass profile event URLs."""
from __future__ import annotations

import argparse
import json
import re
import time
from collections import deque
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
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


def collect(profile: str, max_pages: int = 100) -> list[str]:
    queue = deque([profile])
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
            if parsed.path.rstrip("/") == urlparse(profile).path.rstrip("/"):
                if "page=" in parsed.query or parsed.query:
                    queue.append(absolute)

        time.sleep(0.3)

    return list(events.values())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", default=PROFILE)
    ap.add_argument("--out", default="data/connpass/event_urls.jsonl")
    args = ap.parse_args()

    urls = collect(args.profile)
    retrieved_at = datetime.now(timezone.utc).isoformat()
    with open(args.out, "w", encoding="utf-8") as f:
        for url in urls:
            event_id = re.search(r"/event/(\d+)/", url).group(1)
            f.write(json.dumps({
                "person_id": "connpass:vonsai",
                "event_id": f"connpass:{event_id}",
                "source_url": url,
                "retrieved_at": retrieved_at,
            }, ensure_ascii=False) + "\n")

    print(f"collected={len(urls)} out={args.out}")


if __name__ == "__main__":
    main()
