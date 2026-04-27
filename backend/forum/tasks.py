import time

from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import send_mass_mail
from django.utils import timezone

from .models import AsyncOperation, Discussion
from .realtime import ASYNC_OPERATIONS_ADMIN_GROUP, broadcast_group_event

User = get_user_model()


def _operation_payload(operation: AsyncOperation) -> dict:
    return {
        "id": str(operation.id),
        "name": operation.name,
        "operation_type": operation.operation_type,
        "data": operation.data,
        "result": operation.result,
        "status": operation.status,
        "created_at": operation.created_at.isoformat(),
        "completed_at": operation.completed_at.isoformat() if operation.completed_at else None,
    }


def _finish_operation(operation_id: str, status: str, result: str) -> dict:
    operation = AsyncOperation.objects.get(pk=operation_id)
    operation.status = status
    operation.result = result
    operation.completed_at = timezone.now()
    operation.save(update_fields=["status", "result", "completed_at"])
    payload = _operation_payload(operation)
    broadcast_group_event(
        ASYNC_OPERATIONS_ADMIN_GROUP,
        {
            "type": "async_operation_completed",
            "operation": payload,
        },
    )
    return payload


@shared_task(bind=True)
def send_group_email_task(self, operation_id: str, staff: bool, subject: str, message: str):
    AsyncOperation.objects.filter(pk=operation_id).update(status=AsyncOperation.Status.STARTED, task_id=self.request.id)
    try:
        recipients = list(
            User.objects.filter(is_active=True, is_staff=staff)
            .exclude(email="")
            .values_list("email", flat=True)
        )
        messages = [(subject, message, None, [email]) for email in recipients]
        sent_count = send_mass_mail(messages, fail_silently=False) if messages else 0
        group_name = "staff" if staff else "non-staff"
        return _finish_operation(operation_id, AsyncOperation.Status.SUCCESS, f"Sent {sent_count} email(s) to {group_name} users.")
    except Exception as exc:
        return _finish_operation(operation_id, AsyncOperation.Status.FAILURE, str(exc))


@shared_task(bind=True)
def simulate_forum_long_op_task(self, operation_id: str, seconds: int):
    AsyncOperation.objects.filter(pk=operation_id).update(status=AsyncOperation.Status.STARTED, task_id=self.request.id)
    try:
        seconds = max(1, min(int(seconds), 120))
        time.sleep(seconds)
        discussions_count = Discussion.objects.count()
        return _finish_operation(
            operation_id,
            AsyncOperation.Status.SUCCESS,
            f"Long OP finished after {seconds} second(s). Forum has {discussions_count} discussion(s).",
        )
    except Exception as exc:
        return _finish_operation(operation_id, AsyncOperation.Status.FAILURE, str(exc))
