from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import Comment, Discussion, get_or_create_anonymous_identity

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    birth_date = serializers.SerializerMethodField()
    is_staff = serializers.SerializerMethodField()
    is_superuser = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "gender",
            "birth_date",
            "date_joined",
            "is_profile_anonymous",
            "is_staff",
            "is_superuser",
        ]

    def _can_view_private_fields(self, obj: User) -> bool:
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and request.user.pk == obj.pk)

    def get_email(self, obj):
        return obj.email if self._can_view_private_fields(obj) or not obj.is_profile_anonymous else None

    def get_gender(self, obj):
        return obj.gender if self._can_view_private_fields(obj) or not obj.is_profile_anonymous else None

    def get_birth_date(self, obj):
        return obj.birth_date if self._can_view_private_fields(obj) or not obj.is_profile_anonymous else None

    def get_is_staff(self, obj):
        return obj.is_staff if self._can_view_private_fields(obj) else None

    def get_is_superuser(self, obj):
        return obj.is_superuser if self._can_view_private_fields(obj) else None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "name", "gender", "birth_date", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class TokenRefreshRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class ProfilePrivacySerializer(serializers.Serializer):
    is_profile_anonymous = serializers.BooleanField()


class AccountDeleteSerializer(serializers.Serializer):
    delete_content = serializers.BooleanField()


def _author_payload(comment: Comment, discussion: Discussion):
    author = comment.author
    if discussion.is_anonymous:
        if comment.anonymous_display_name:
            return {"display_name": comment.anonymous_display_name, "user_id": None}
        if author is None:
            return {"display_name": "[deleted]", "user_id": None}
        identity = get_or_create_anonymous_identity(discussion, author)
        return {"display_name": f"Anon #{identity.anon_number}", "user_id": None}

    if author is None:
        return {"display_name": "[deleted]", "user_id": None}
    return {"display_name": author.name, "user_id": str(author.id)}


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "author", "content", "created_at", "updated_at"]

    def get_author(self, obj):
        discussion = self.context.get("discussion") or obj.discussion
        return _author_payload(obj, discussion)


class DiscussionSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    last_activity = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Discussion
        fields = [
            "id",
            "title",
            "created_by",
            "is_anonymous",
            "is_closed",
            "created_at",
            "last_activity",
            "views_count",
            "comments_count",
        ]

    def get_created_by(self, obj):
        if obj.is_anonymous:
            return {"display_name": "Anonymous", "user_id": None}
        if obj.created_by is None:
            return {"display_name": "[deleted]", "user_id": None}
        return {"display_name": obj.created_by.name, "user_id": str(obj.created_by.id)}


class DiscussionCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    content = serializers.CharField(max_length=10000)
    is_anonymous = serializers.BooleanField(default=False)

    def create(self, validated_data):
        user = self.context["request"].user
        with transaction.atomic():
            discussion = Discussion.objects.create(
                title=validated_data["title"],
                created_by=user,
                is_anonymous=validated_data["is_anonymous"],
            )
            Comment.objects.create(
                discussion=discussion,
                author=user,
                content=validated_data["content"],
            )
        return discussion


class DiscussionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discussion
        fields = ["is_closed"]


class CommentCreateSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=10000)

    def create(self, validated_data):
        return Comment.objects.create(**validated_data)


class OnlineUserSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    email = serializers.EmailField()
    is_staff = serializers.BooleanField()
    is_superuser = serializers.BooleanField()
    connections_count = serializers.IntegerField(min_value=1)
    last_seen = serializers.CharField()
