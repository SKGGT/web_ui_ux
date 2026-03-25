from __future__ import annotations

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .realtime import (
    DISCUSSIONS_GROUP,
    ONLINE_USERS_ADMIN_GROUP,
    broadcast_group_event,
    discussion_group_name,
    mark_user_offline,
    mark_user_online,
    online_users_snapshot,
    touch_user_connection,
)


class PresenceConsumerBase(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self._mark_online()

    async def disconnect(self, code):
        await self._mark_offline()

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "ping":
            await self._touch()
            await self.send_json({"type": "pong"})

    async def _mark_online(self):
        user = self.scope.get("user")
        if user and user.is_authenticated:
            await _mark_user_online(user.id, self.channel_name)
            await _notify_admins_online_snapshot()

    async def _mark_offline(self):
        await _mark_user_offline(self.channel_name)
        await _notify_admins_online_snapshot()

    async def _touch(self):
        await _touch_connection(self.channel_name)


class DiscussionsConsumer(PresenceConsumerBase):
    async def connect(self):
        await self.channel_layer.group_add(DISCUSSIONS_GROUP, self.channel_name)
        await super().connect()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(DISCUSSIONS_GROUP, self.channel_name)
        await super().disconnect(code)

    async def discussion_created(self, event):
        await self.send_json(
            {
                "type": "discussion_created",
                "discussion": event["discussion"],
            }
        )

    async def discussion_updated(self, event):
        await self.send_json(
            {
                "type": "discussion_updated",
                "discussion": event["discussion"],
            }
        )

    async def discussion_deleted(self, event):
        await self.send_json(
            {
                "type": "discussion_deleted",
                "discussion_id": event["discussion_id"],
            }
        )


class PresenceConsumer(PresenceConsumerBase):
    pass


class DiscussionDetailConsumer(PresenceConsumerBase):
    async def connect(self):
        self.discussion_id = self.scope["url_route"]["kwargs"]["discussion_id"]
        self.discussion_group = discussion_group_name(self.discussion_id)
        await self.channel_layer.group_add(self.discussion_group, self.channel_name)
        await super().connect()

    async def disconnect(self, code):
        if hasattr(self, "discussion_group"):
            await self.channel_layer.group_discard(self.discussion_group, self.channel_name)
        await super().disconnect(code)

    async def comment_created(self, event):
        await self.send_json(
            {
                "type": "comment_created",
                "comment": event["comment"],
                "discussion": event["discussion"],
            }
        )

    async def discussion_updated(self, event):
        await self.send_json(
            {
                "type": "discussion_updated",
                "discussion": event["discussion"],
            }
        )

    async def discussion_deleted(self, event):
        await self.send_json(
            {
                "type": "discussion_deleted",
                "discussion_id": event["discussion_id"],
            }
        )


class AdminOnlineUsersConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not (user and user.is_authenticated and user.is_staff):
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(ONLINE_USERS_ADMIN_GROUP, self.channel_name)
        await self.accept()
        await self.send_json({"type": "online_users_snapshot", "users": await _online_users_snapshot()})

    async def disconnect(self, code):
        await self.channel_layer.group_discard(ONLINE_USERS_ADMIN_GROUP, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "snapshot":
            await self.send_json({"type": "online_users_snapshot", "users": await _online_users_snapshot()})

    async def online_users_snapshot(self, event):
        await self.send_json({"type": "online_users_snapshot", "users": event["users"]})


@database_sync_to_async
def _mark_user_online(user_id, channel_name: str):
    mark_user_online(user_id=user_id, channel_name=channel_name)


@database_sync_to_async
def _mark_user_offline(channel_name: str):
    mark_user_offline(channel_name=channel_name)


@database_sync_to_async
def _touch_connection(channel_name: str):
    touch_user_connection(channel_name=channel_name)


@database_sync_to_async
def _online_users_snapshot():
    return online_users_snapshot()


@database_sync_to_async
def _notify_admins_online_snapshot():
    broadcast_group_event(
        ONLINE_USERS_ADMIN_GROUP,
        {
            "type": "online_users_snapshot",
            "users": online_users_snapshot(),
        },
    )
