import datetime
import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import IntegrityError, models, transaction
from django.db.models import F
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.full_clean(exclude=["password"])
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class GenderChoices(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        PREFER_NOT = "prefer_not_to_say", "Prefer not to say"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=120)
    gender = models.CharField(max_length=32, choices=GenderChoices.choices)
    birth_date = models.DateField()
    is_profile_anonymous = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "gender", "birth_date"]

    objects = UserManager()

    def clean(self):
        super().clean()
        if self.birth_date >= datetime.date.today():
            raise ValidationError({"birth_date": "Date of birth must be in the past."})

    def __str__(self):
        return self.email


class Discussion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="discussions")
    is_anonymous = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    views_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-views_count", "-updated_at", "-created_at"]

    def __str__(self):
        return self.title

    @property
    def last_activity(self):
        return self.updated_at


class Comment(models.Model):
    discussion = models.ForeignKey(Discussion, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="comments")
    anonymous_display_name = models.CharField(max_length=32, null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self):
        return f"Comment {self.pk}"

    def save(self, *args, **kwargs):
        if self._state.adding and self.discussion_id and self.discussion.is_anonymous:
            if self.author_id:
                identity = get_or_create_anonymous_identity(self.discussion, self.author)
                self.anonymous_display_name = f"Anon #{identity.anon_number}"
            elif not self.anonymous_display_name:
                self.anonymous_display_name = "[deleted]"

        is_new = self._state.adding
        with transaction.atomic():
            super().save(*args, **kwargs)
            if is_new:
                Discussion.objects.filter(pk=self.discussion_id).update(
                    comments_count=F("comments_count") + 1,
                    updated_at=timezone.now(),
                )
            else:
                Discussion.objects.filter(pk=self.discussion_id).update(updated_at=timezone.now())


class DiscussionAnonIdentity(models.Model):
    discussion = models.ForeignKey(Discussion, on_delete=models.CASCADE, related_name="anon_identities")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="anon_identities")
    anon_number = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["discussion", "user"], name="uniq_discussion_user_anon"),
            models.UniqueConstraint(fields=["discussion", "anon_number"], name="uniq_discussion_anon_number"),
        ]


class DiscussionView(models.Model):
    discussion = models.ForeignKey(Discussion, on_delete=models.CASCADE, related_name="daily_views")
    device_id = models.UUIDField(default=uuid.uuid4)
    view_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["discussion", "device_id", "view_date"], name="uniq_discussion_daily_device_view")
        ]


class OnlineUserConnection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="online_connections")
    channel_name = models.CharField(max_length=255, unique=True)
    connected_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["last_seen"]),
            models.Index(fields=["user", "last_seen"]),
        ]


def get_or_create_anonymous_identity(discussion: Discussion, user: User) -> DiscussionAnonIdentity:
    identity = DiscussionAnonIdentity.objects.filter(discussion=discussion, user=user).first()
    if identity:
        return identity

    with transaction.atomic():
        next_num = (
            DiscussionAnonIdentity.objects.select_for_update()
            .filter(discussion=discussion)
            .aggregate(max_num=models.Max("anon_number"))
            .get("max_num")
            or 0
        ) + 1
        try:
            return DiscussionAnonIdentity.objects.create(discussion=discussion, user=user, anon_number=next_num)
        except IntegrityError:
            return DiscussionAnonIdentity.objects.get(discussion=discussion, user=user)
