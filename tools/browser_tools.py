from typing import Optional
from models.tool_result import ToolResult
from .win_launcher import launch_url


def open_browser(url: str) -> ToolResult:
    """Opens a web browser to the specified URL with verification."""
    if not url or url.strip() == "" or url.lower() in ["browser", "chrome", "edge", "google"]:
        url = "https://www.google.com"
    return launch_url(url)


def browser_action(action: str, selector: Optional[str] = None, value: Optional[str] = None) -> ToolResult:
    """Executes a browser interaction (click, type, navigate, text) via Playwright."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return ToolResult(
            success=False,
            tool_name="browser_action",
            action=action,
            message="Browser action failed.",
            error="Playwright package is not installed in environment."
        )

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            page = browser.new_page()

            if action == "navigate":
                target_url = value or selector or "https://www.google.com"
                if not target_url.startswith("http"):
                    target_url = f"https://{target_url}"
                page.goto(target_url)
                title = page.title()
                browser.close()
                return ToolResult(
                    success=True,
                    tool_name="browser_action",
                    action="navigate",
                    target=target_url,
                    message=f"Navigated to '{target_url}'. Page title: '{title}'",
                    data={"title": title}
                )

            elif action == "click" and selector:
                page.click(selector)
                browser.close()
                return ToolResult(
                    success=True,
                    tool_name="browser_action",
                    action="click",
                    target=selector,
                    message=f"Clicked element matching selector '{selector}'"
                )

            elif action == "type" and selector and value:
                page.fill(selector, value)
                browser.close()
                return ToolResult(
                    success=True,
                    tool_name="browser_action",
                    action="type",
                    target=selector,
                    message=f"Typed '{value}' into selector '{selector}'"
                )

            elif action == "text":
                target_url = value or selector or "https://www.google.com"
                page.goto(target_url)
                extracted_text = page.body().inner_text()[:1000]
                browser.close()
                return ToolResult(
                    success=True,
                    tool_name="browser_action",
                    action="text",
                    target=target_url,
                    message=f"Extracted page text:\n{extracted_text}",
                    data={"text": extracted_text}
                )

            browser.close()
            return ToolResult(
                success=True,
                tool_name="browser_action",
                action=action,
                message=f"Executed browser action '{action}'"
            )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="browser_action",
            action=action,
            message=f"Browser action '{action}' failed.",
            error=str(e)
        )
