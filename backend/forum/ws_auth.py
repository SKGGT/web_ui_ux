from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JwtQueryAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        close_old_connections()

        user = scope.get("user")
        if not (user and user.is_authenticated):
            query_params = parse_qs(scope.get("query_string", b"").decode("utf-8"))
            token = query_params.get("token", [None])[0]
            if token:
                scope["user"] = await _user_for_token(token)
            else:
                scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


@database_sync_to_async
def _user_for_token(raw_token: str):
    auth = JWTAuthentication()
    try:
        validated = auth.get_validated_token(raw_token)
        return auth.get_user(validated)
    except (InvalidToken, TokenError):
        return AnonymousUser()
