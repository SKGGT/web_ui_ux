import uuid

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import OperationalError, transaction
from django.db.models import F, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Comment, Discussion, DiscussionView
from .realtime import DISCUSSIONS_GROUP, broadcast_group_event, discussion_group_name, online_users_snapshot
from .serializers import (
    AccountDeleteSerializer,
    CommentCreateSerializer,
    CommentSerializer,
    DiscussionCreateSerializer,
    DiscussionSerializer,
    DiscussionUpdateSerializer,
    LoginSerializer,
    TokenRefreshRequestSerializer,
    OnlineUserSerializer,
    ProfilePrivacySerializer,
    RegisterSerializer,
    UserProfileSerializer,
)

User = get_user_model()


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response(UserProfileSerializer(user, context={"request": request}).data, status=status.HTTP_201_CREATED)


def _token_payload_for_user(user, request):
    refresh = RefreshToken.for_user(user)
    return {
        "user": UserProfileSerializer(user, context={"request": request}).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class TokenRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(_token_payload_for_user(user, request), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            raise ValidationError({"detail": "Invalid email or password."})

        login(request, user)
        return Response(UserProfileSerializer(user, context={"request": request}).data)


class TokenLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            raise ValidationError({"detail": "Invalid email or password."})

        return Response(_token_payload_for_user(user, request))


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TokenRefreshRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refresh = RefreshToken(serializer.validated_data["refresh"])
        except TokenError as exc:
            raise ValidationError({"detail": "Invalid refresh token."}) from exc

        return Response({"access": str(refresh.access_token)})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        serializer = ProfilePrivacySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.is_profile_anonymous = serializer.validated_data["is_profile_anonymous"]
        request.user.save(update_fields=["is_profile_anonymous"])
        return Response(UserProfileSerializer(request.user, context={"request": request}).data)


class PublicProfileView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]


class AccountDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        serializer = AccountDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        delete_content = serializer.validated_data["delete_content"]

        user = request.user
        with transaction.atomic():
            if delete_content:
                affected_discussion_ids = list(
                    Comment.objects.filter(author=user).values_list("discussion_id", flat=True).distinct()
                )
                Discussion.objects.filter(created_by=user).delete()
                Comment.objects.filter(author=user).delete()
                if affected_discussion_ids:
                    for discussion in Discussion.objects.filter(pk__in=affected_discussion_ids):
                        discussion.comments_count = discussion.comments.count()
                        discussion.save(update_fields=["comments_count"])
            else:
                Discussion.objects.filter(created_by=user).update(created_by=None)
                Comment.objects.filter(author=user).update(author=None)
            user.delete()

        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DiscussionListCreateView(generics.ListCreateAPIView):
    queryset = Discussion.objects.select_related("created_by").order_by("-views_count", "-updated_at", "-created_at")
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return DiscussionCreateSerializer
        return DiscussionSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        discussion = serializer.save()
        discussion.refresh_from_db()
        output = DiscussionSerializer(discussion, context=self.get_serializer_context()).data
        broadcast_group_event(
            DISCUSSIONS_GROUP,
            {
                "type": "discussion_created",
                "discussion": output,
            },
        )
        return Response(output, status=status.HTTP_201_CREATED)


class DiscussionDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        discussion = get_object_or_404(
            Discussion.objects.select_related("created_by").prefetch_related(
                Prefetch("comments", queryset=Comment.objects.select_related("author"))
            ),
            pk=pk,
        )
        data = DiscussionSerializer(discussion, context={"request": request}).data
        data["comments"] = CommentSerializer(
            discussion.comments.all(),
            many=True,
            context={"request": request, "discussion": discussion},
        ).data
        return Response(data)

    def patch(self, request, pk):
        if not request.user.is_authenticated:
            raise PermissionDenied("Authentication required.")

        discussion = get_object_or_404(Discussion, pk=pk)
        if discussion.created_by_id != request.user.id:
            raise PermissionDenied("Only the discussion owner can update this discussion.")

        serializer = DiscussionUpdateSerializer(instance=discussion, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        output = DiscussionSerializer(discussion, context={"request": request}).data
        event = {"type": "discussion_updated", "discussion": output}
        broadcast_group_event(DISCUSSIONS_GROUP, event)
        broadcast_group_event(discussion_group_name(str(discussion.pk)), event)
        return Response(output)

    def delete(self, request, pk):
        if not request.user.is_authenticated:
            raise PermissionDenied("Authentication required.")

        discussion = get_object_or_404(Discussion, pk=pk)
        if discussion.created_by_id != request.user.id:
            raise PermissionDenied("Only the discussion owner can delete this discussion.")

        discussion_id = str(discussion.pk)
        discussion.delete()
        event = {"type": "discussion_deleted", "discussion_id": discussion_id}
        broadcast_group_event(DISCUSSIONS_GROUP, event)
        broadcast_group_event(discussion_group_name(discussion_id), event)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DiscussionCommentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        discussion = get_object_or_404(Discussion, pk=pk)
        if discussion.is_closed and discussion.created_by_id != request.user.id:
            raise PermissionDenied("This discussion is closed.")

        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(discussion=discussion, author=request.user)
        discussion.refresh_from_db(fields=["updated_at", "comments_count"])

        comment_output = CommentSerializer(comment, context={"request": request, "discussion": discussion}).data
        discussion_output = DiscussionSerializer(discussion, context={"request": request}).data
        broadcast_group_event(
            DISCUSSIONS_GROUP,
            {
                "type": "discussion_updated",
                "discussion": discussion_output,
            },
        )
        broadcast_group_event(
            discussion_group_name(str(discussion.pk)),
            {
                "type": "comment_created",
                "comment": comment_output,
                "discussion": discussion_output,
            },
        )

        return Response(
            comment_output,
            status=status.HTTP_201_CREATED,
        )


class DiscussionViewTrackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        discussion = get_object_or_404(Discussion, pk=pk)
        header_value = request.headers.get("X-Device-Id")
        should_set_cookie = False

        if header_value:
            try:
                device_id = uuid.UUID(header_value)
            except ValueError as exc:
                raise ValidationError({"detail": "Invalid X-Device-Id header."}) from exc
        else:
            cookie_value = request.COOKIES.get("forum_device_id")
            try:
                if cookie_value:
                    device_id = uuid.UUID(cookie_value)
                else:
                    device_id = uuid.uuid4()
                    should_set_cookie = True
            except ValueError:
                device_id = uuid.uuid4()
                should_set_cookie = True

        today = timezone.localdate()
        try:
            _, created = DiscussionView.objects.get_or_create(
                discussion=discussion,
                device_id=device_id,
                view_date=today,
            )
        except OperationalError:
            created = False

        if created:
            try:
                Discussion.objects.filter(pk=discussion.pk).update(views_count=F("views_count") + 1)
            except OperationalError:
                created = False

        response = Response({"counted": created})
        if should_set_cookie:
            response.set_cookie(
                "forum_device_id",
                str(device_id),
                max_age=60 * 60 * 24 * 365 * 2,
                httponly=False,
                samesite="Lax",
                secure=False,
            )
        return response


class AdminOnlineUsersView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        payload = online_users_snapshot()
        serializer = OnlineUserSerializer(payload, many=True)
        return Response(serializer.data)
