from __future__ import annotations

import datetime

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import IntegrityError, OperationalError
from django.db.models import Count, Max
from django.utils import timezone

from .models import OnlineUserConnection

DISCUSSIONS_GROUP = "discussions"
DISCUSSION_GROUP_PREFIX = "discussion_"
ONLINE_USERS_ADMIN_GROUP = "online_users_admins"
ONLINE_USER_TTL_SECONDS = 90


def discussion_group_name(discussion_id: str) -> str:
    return f"{DISCUSSION_GROUP_PREFIX}{discussion_id}"


def broadcast_group_event(group_name: str, event: dict) -> None:
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(group_name, event)


def mark_user_online(user_id, channel_name: str) -> None:
    try:
        OnlineUserConnection.objects.create(
            channel_name=channel_name,
            user_id=user_id,
        )
    except IntegrityError:
        try:
            OnlineUserConnection.objects.filter(channel_name=channel_name).update(user_id=user_id)
        except OperationalError:
            return
    except OperationalError:
        return


def mark_user_offline(channel_name: str) -> None:
    try:
        OnlineUserConnection.objects.filter(channel_name=channel_name).delete()
    except OperationalError:
        return


def touch_user_connection(channel_name: str) -> None:
    try:
        OnlineUserConnection.objects.filter(channel_name=channel_name).update(last_seen=timezone.now())
    except OperationalError:
        return


def online_users_snapshot() -> list[dict]:
    cutoff = timezone.now() - datetime.timedelta(seconds=ONLINE_USER_TTL_SECONDS)
    try:
        rows = (
            OnlineUserConnection.objects.filter(last_seen__gte=cutoff)
            .values(
                "user_id",
                "user__name",
                "user__email",
                "user__is_staff",
                "user__is_superuser",
            )
            .annotate(
                connections_count=Count("id"),
                last_seen=Max("last_seen"),
            )
            .order_by("-last_seen")
        )
    except OperationalError:
        return []
    return [
        {
            "id": str(row["user_id"]),
            "name": row["user__name"],
            "email": row["user__email"],
            "is_staff": row["user__is_staff"],
            "is_superuser": row["user__is_superuser"],
            "connections_count": row["connections_count"],
            "last_seen": row["last_seen"].isoformat(),
        }
        for row in rows
    ]
