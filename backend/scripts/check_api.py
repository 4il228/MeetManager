"""Verify running backend exposes required API (used by start.bat)."""
import json
import sys
import urllib.error
import urllib.request


def main() -> None:
    port = sys.argv[1] if len(sys.argv) > 1 else "8010"
    url = f"http://127.0.0.1:{port}/api/openapi.json"
    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            spec = json.loads(resp.read())
    except urllib.error.URLError as exc:
        print(f"Backend on port {port} is not reachable: {exc}")
        sys.exit(1)

    user_path = spec.get("paths", {}).get("/api/v1/users/{user_id}", {})
    if "delete" not in user_path:
        print(f"Backend on port {port} is outdated — DELETE /users is missing")
        sys.exit(2)

    print(f"OK: backend on port {port} has required API")


if __name__ == "__main__":
    main()
