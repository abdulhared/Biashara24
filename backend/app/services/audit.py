from ..models import AuditLog
from contextvars import ContextVar

request_ip = ContextVar("request_ip", default=None)

def record(db, user, action, module, entity_id, before=None, after=None):
    db.add(AuditLog(user_id=user.id, action=action, module=module, entity_type=module,
                    entity_id=entity_id, old_values=before, new_values=after, ip_address=request_ip.get()))
