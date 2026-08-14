import os
import sys
import re
import urllib.parse
import subprocess
from typing import Optional, Dict, Any
from models.tool_result import ToolResult
from .browser_tools import open_browser

def make_phone_call(phone_number: str, contact_name: Optional[str] = None) -> ToolResult:
    """
    Makes a phone call to specified phone number or contact via Windows Phone Link / tel: protocol.
    """
    try:
        clean_num = re.sub(r"[^\d+]", "", phone_number.strip())
        display_target = contact_name or phone_number
        if not clean_num:
            return ToolResult(
                success=False,
                tool_name="make_phone_call",
                action="call",
                target=display_target,
                message="Invalid or missing phone number.",
                error="Phone number must contain valid digits."
            )

        tel_url = f"tel:{clean_num}"
        ms_phone_url = f"ms-phone:dial?PhoneNumber={clean_num}"

        if os.name == 'nt':
            try:
                os.startfile(tel_url)
            except Exception:
                try:
                    os.startfile(ms_phone_url)
                except Exception:
                    subprocess.run(["cmd", "/c", "start", "", tel_url], shell=True)
        else:
            open_browser(tel_url)

        return ToolResult(
            success=True,
            tool_name="make_phone_call",
            action="call",
            target=display_target,
            message=f"Initiated phone call to {display_target} ({clean_num}) via Phone Link / Dialer.",
            data={"phone_number": clean_num, "contact_name": contact_name}
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="make_phone_call",
            action="call",
            target=phone_number,
            message=f"Failed to place phone call to {phone_number}.",
            error=str(e)
        )

def compose_gmail(to: str, subject: Optional[str] = "", body: Optional[str] = "") -> ToolResult:
    """
    Composes and opens an email directly in Gmail with recipient, subject, and body pre-filled.
    """
    try:
        recipient = to.strip()
        subj = subject.strip() if subject else ""
        msg_body = body.strip() if body else ""

        encoded_to = urllib.parse.quote(recipient)
        encoded_subj = urllib.parse.quote(subj)
        encoded_body = urllib.parse.quote(msg_body)

        gmail_compose_url = f"https://mail.google.com/mail/?view=cm&fs=1&tf=1&to={encoded_to}&su={encoded_subj}&body={encoded_body}"

        browser_res = open_browser(gmail_compose_url)

        if browser_res.success:
            return ToolResult(
                success=True,
                tool_name="compose_gmail",
                action="email",
                target=recipient,
                message=f"Opened Gmail compose window for '{recipient}' with pre-filled subject and body.",
                data={"to": recipient, "subject": subj, "body": msg_body, "url": gmail_compose_url}
            )
        else:
            return browser_res
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="compose_gmail",
            action="email",
            target=to,
            message=f"Failed to compose Gmail for {to}.",
            error=str(e)
        )
