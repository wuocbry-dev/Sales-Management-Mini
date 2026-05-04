"""Small web research tools for the assistant."""

from __future__ import annotations

import re
from typing import Any

import httpx
from markdownify import markdownify as to_markdown


def search_web(query: str, max_results: int = 5) -> str:
    """Search the public web and return compact results."""
    import json

    max_results = max(1, min(int(max_results), 10))
    try:
        from ddgs import DDGS

        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        compact = [
            {
                "title": item.get("title"),
                "url": item.get("href") or item.get("url"),
                "snippet": item.get("body"),
            }
            for item in results
        ]
        return json.dumps({"ok": True, "query": query, "results": compact}, ensure_ascii=False)
    except Exception as exc:
        return json.dumps({"ok": False, "query": query, "error": str(exc)}, ensure_ascii=False)


def fetch_web_page(url: str, max_chars: int = 6000) -> str:
    """Fetch a public web page and return readable markdown text."""
    import json

    max_chars = max(1000, min(int(max_chars), 12000))
    if not re.match(r"^https?://", url, flags=re.IGNORECASE):
        return json.dumps({"ok": False, "error": "Only http/https URLs are allowed."}, ensure_ascii=False)

    try:
        with httpx.Client(timeout=12.0, follow_redirects=True) as client:
            response = client.get(
                url,
                headers={
                    "User-Agent": "Sales-Management-Mini-AI-Agent/1.0",
                    "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
                },
            )
            response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        text = response.text
        if "html" in content_type:
            text = to_markdown(text, heading_style="ATX")
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        payload: dict[str, Any] = {
            "ok": True,
            "url": str(response.url),
            "content_type": content_type,
            "content": text[:max_chars],
            "truncated": len(text) > max_chars,
        }
        return json.dumps(payload, ensure_ascii=False)
    except Exception as exc:
        return json.dumps({"ok": False, "url": url, "error": str(exc)}, ensure_ascii=False)
