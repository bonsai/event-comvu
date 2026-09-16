#!/usr/bin/env python3
"""Fetch public connpass event pages and normalize useful metadata."""
from __future__ import annotations

import argparse
import json
import re
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import urljoin
from urllib.request import Request, urlopen

EVENT_RE = re.compile(r"https://connpass\.com/event/(\d+)/?")
PERSON_ID = "connpass:vonsai"


class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta: dict[str, str] = {}
        self.links: list[tuple[str, str]] = []
        self.text: list[str] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta":
            key = a.get("property") or a.get("name")
            value = a.get("content")
            if key and value:
                self.meta[key.lower()] = value.strip()
        elif tag == "a" and a.get("href"):
            self.links.append((a["href"], ""))

    def handle_data(self, data):
        value = " ".join(data.split())
        if value:
            self.text.append(value)


def fetch(url: str) -> str:
    req = Request(url, headers={"User-Agent": "event-comvu/0.1 (+public-research)"})
    with urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def normalize(url: str) -> dict:
    html = fetch(url)
    p = Parser()
    p.feed(html)
    event_match = EVENT_RE.match(url.rstrip("/") + "/")
    event_id = event_match.group(1) if event_match else None
    text = " ".join(p.text)

    title = p.meta.get("og:title") or p.meta.get("twitter:title") or ""
    image = p.meta.get("og:image") or p.meta.get("twitter:image")

    return {
        "person_id": PERSON_ID,
        "event_id": f"connpass:{event_id}" if event_id else None,
        "title": title,
        "started_at": None,
        "ended_at": None,
        "status": "registered",
        "organizer": None,
        "venue": None,
        "prefecture": None,
        "city": None,
        "online": None,
        "category": None,
        "technology": [],
        "source_url": url,
        "source_title": title,
        "image_url": urljoin(url, image) if image else None,
        "flyer_url": None,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "parser_text_length": len(text),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--urls", default="data/connpass/event_urls.jsonl")
    ap.add_argument("--out", default="data/connpass/vonsai.jsonl")
    args = ap.parse_args()

    records = {}
    with open(args.urls, encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            row = json.loads(line)
            records[row["source_url"]] = row["source_url"]

    if not records:
        raise SystemExit("DATA_GATE_FAILED: no event URLs collected")

    count = 0
    with open(args.out, "w", encoding="utf-8") as out:
        for url in records:
            try:
                row = normalize(url)
                out.write(json.dumps(row, ensure_ascii=False) + "\n")
                out.flush()
                count += 1
            except Exception as exc:
                print(f"ERROR {url}: {exc}")
            time.sleep(0.4)

    if count == 0:
        raise SystemExit("DATA_GATE_FAILED: no event evidence normalized")
    print(f"normalized={count} out={args.out}")


if __name__ == "__main__":
    main()
