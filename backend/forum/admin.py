from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Comment, Discussion, DiscussionAnonIdentity, DiscussionView, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "name", "gender", "birth_date", "is_staff", "is_active")
    search_fields = ("email", "name")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal", {"fields": ("name", "gender", "birth_date")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "name", "gender", "birth_date", "password1", "password2", "is_staff", "is_active"),
            },
        ),
    )


@admin.register(Discussion)
class DiscussionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "created_by",
        "is_anonymous",
        "is_closed",
        "views_count",
        "comments_count",
        "created_at",
        "updated_at",
    )
    list_filter = ("is_anonymous", "is_closed")
    search_fields = ("title",)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "discussion", "author", "created_at", "updated_at")
    search_fields = ("content",)


@admin.register(DiscussionAnonIdentity)
class DiscussionAnonIdentityAdmin(admin.ModelAdmin):
    list_display = ("discussion", "user", "anon_number")


@admin.register(DiscussionView)
class DiscussionViewAdmin(admin.ModelAdmin):
    list_display = ("discussion", "device_id", "view_date", "created_at")
    search_fields = ("device_id",)
