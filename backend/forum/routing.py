from django.urls import re_path

from .consumers import AdminOnlineUsersConsumer, DiscussionDetailConsumer, DiscussionsConsumer, PresenceConsumer

websocket_urlpatterns = [
    re_path(r"ws/presence/$", PresenceConsumer.as_asgi()),
    re_path(r"ws/discussions/$", DiscussionsConsumer.as_asgi()),
    re_path(r"ws/discussions/(?P<discussion_id>[0-9a-f-]+)/$", DiscussionDetailConsumer.as_asgi()),
    re_path(r"ws/admin/online-users/$", AdminOnlineUsersConsumer.as_asgi()),
]
