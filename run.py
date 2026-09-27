import os
import socket
from app import create_app

app = create_app()


def get_lan_ip():
    """Best-effort LAN/hotspot IPv4 address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # No data is sent; this asks Windows/Linux which local interface
        # it would use to reach an external address.
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "YOUR-LAN-IP"
    finally:
        s.close()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    lan_ip = get_lan_ip()
    print("\n" + "=" * 60)
    print(" ResortOS is running")
    print(" Local:   http://127.0.0.1:%s" % port)
    print(" Network: http://%s:%s" % (lan_ip, port))
    print("\n On another laptop connected to the SAME hotspot, open:")
    print(" http://%s:%s" % (lan_ip, port))
    print("=" * 60 + "\n")
    # 0.0.0.0 is required so other devices on the same network can connect.
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
