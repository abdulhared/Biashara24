"""Raw TCP ESC/POS tickets. Only configured department printers receive jobs."""
import ipaddress
import socket
from collections import defaultdict

def kitchen_ticket(order_number: str, department: str) -> dict:
    return {"order_number": order_number, "department": department}

def print_order(order):
    groups = defaultdict(list)
    for line in order.items:
        groups[line.menu_item.department_id].append(line)
    results = []
    for lines in groups.values():
        department = lines[0].menu_item.department
        if not department.printer_ip:
            results.append({"department": department.name, "status": "not_configured"})
            continue
        try:
            address = ipaddress.ip_address(department.printer_ip)
            if not address.is_private or address.is_loopback or address.is_unspecified:
                raise ValueError("Printer must use a private LAN address")
            text = "\n".join(["Biashara360", department.name, "Order: " + order.order_number,
                  *[f"{line.quantity} x {line.menu_item.name}" for line in lines], order.notes or "", "\n\n"])
            text = "".join(c for c in text if c == "\n" or ord(c) >= 32)
            ticket = b"\x1b@" + text.encode("cp437", errors="replace") + b"\x1dV\x00"
            with socket.create_connection((str(address), department.printer_port), timeout=3) as conn:
                conn.sendall(ticket)
            results.append({"department": department.name, "status": "sent"})
        except (OSError, ValueError) as exc:
            # A failed send may have partially printed. Do not silently retry.
            results.append({"department": department.name, "status": "failed", "detail": str(exc)})
    return results

def send_batch_ticket(department, order, submission, entries, table_number):
    """Send one original/addition/correction. Never resend on an ambiguous failure."""
    if not department.printer_ip:
        return {"status": "not_configured"}
    try:
        address = ipaddress.ip_address(department.printer_ip)
        if not address.is_private or address.is_loopback or address.is_unspecified:
            raise ValueError("Printer must use a private LAN address")
        label = {"original": "NEW ORDER", "addition": "ADDITIONAL ITEMS", "correction": "CORRECTION - REMOVE ITEMS"}[submission.kind]
        lines = ["Biashara360", label, department.name, f"Table: {table_number or 'Unassigned'}",
                 "Bill: " + order.order_number, "Waiter: " + (order.waiter.full_name or order.waiter.username),
                 f"Ticket: {submission.id} | {submission.created_at.isoformat()} UTC"]
        lines += [f"{abs(i['quantity'])} x {i['name']}" for i in entries]
        lines += [submission.notes or "", "\n\n"]
        text = "\n".join(lines)
        text = "".join(c for c in text if c == "\n" or ord(c) >= 32)
        with socket.create_connection((str(address), department.printer_port), timeout=3) as conn:
            conn.sendall(b"\x1b@" + text.encode("cp437", errors="replace") + b"\x1dV\x00")
        return {"status": "sent"}
    except (OSError, ValueError) as exc:
        return {"status": "uncertain", "detail": str(exc)}

