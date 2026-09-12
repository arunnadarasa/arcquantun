"""Nexus device-authorization login.

Prints the user code + verification URL, polls until approved, then writes the
tokens to the local qnexus store and prints the account name.

    PYTHONPATH=.pydeps python3 scripts/quantum/nexus_login.py
"""
import sys, time
sys.path.insert(0, "/dev-server/.pydeps")

from qnexus.client import auth as A
from qnexus.client.auth import VERSION, VERSION_HEADER, get_nexus_client, write_token


def main() -> int:
    res = A._get_auth_client().post(
        "/device/device_authorization",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={"client_id": "scales", "scope": "myqos"},
    ).json()
    print("CODE:", res["user_code"], flush=True)
    print("URL:", res["verification_uri_complete"], flush=True)

    body = {
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        "device_code": res["device_code"],
        "client_id": "scales",
    }
    waited = 0
    while waited < res["expires_in"]:
        time.sleep(res["interval"])
        waited += res["interval"]
        r = A._get_auth_client().post(
            "/device/token",
            headers={"Content-Type": "application/x-www-form-urlencoded", VERSION_HEADER: VERSION},
            data=body,
        )
        if r.status_code == 400 and r.json().get("error") == "AUTHORIZATION_PENDING":
            continue
        if r.status_code == 429:
            continue
        if r.status_code == 200:
            j = r.json()
            write_token("refresh_token", j["refresh_token"])
            write_token("access_token", j["access_token"])
            get_nexus_client(reload=True)
            print("LOGGED_IN", j.get("email", ""), flush=True)
            return 0
        print("FAIL", r.status_code, r.text[:200], flush=True)
        return 1
    print("EXPIRED", flush=True)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
