import urllib.request
import urllib.error
import socket
from typing import List
from config.settings import settings

def is_network_available(hosts: List[str] = None, timeout: float = None) -> bool:
    """
    Fast network connectivity check.
    Attempts quick HTTP HEAD / GET requests to reliable hosts.
    Returns True if at least one host is reachable, False otherwise.
    """
    if hosts is None:
        hosts = settings.network_hosts
    if timeout is None:
        timeout = settings.network_timeout

    for host in hosts:
        try:
            req = urllib.request.Request(host, method="HEAD")
            with urllib.request.urlopen(req, timeout=timeout) as response:
                if response.status in (200, 204, 301, 302, 307, 308):
                    return True
        except (urllib.error.URLError, urllib.error.HTTPError, socket.timeout, Exception):
            continue

    # Fallback to direct TCP ping to 1.1.1.1 on port 53 (DNS)
    try:
        sock = socket.create_connection(("1.1.1.1", 53), timeout=timeout)
        sock.close()
        return True
    except (socket.timeout, OSError):
        return False
