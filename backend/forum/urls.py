from django.urls import path

from .views import (
    AccountDeleteView,
    AdminOnlineUsersView,
    DiscussionCommentCreateView,
    DiscussionDetailView,
    DiscussionListCreateView,
    DiscussionViewTrackView,
    LoginView,
    LogoutView,
    MeView,
    PublicProfileView,
    RegisterView,
)

urlpatterns = [
    path("auth/register", RegisterView.as_view()),
    path("auth/login", LoginView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/me", MeView.as_view()),
    path("profiles/<uuid:pk>", PublicProfileView.as_view()),
    path("account", AccountDeleteView.as_view()),
    path("discussions", DiscussionListCreateView.as_view()),
    path("discussions/<uuid:pk>", DiscussionDetailView.as_view()),
    path("discussions/<uuid:pk>/comments", DiscussionCommentCreateView.as_view()),
    path("discussions/<uuid:pk>/view", DiscussionViewTrackView.as_view()),
    path("admin/online-users", AdminOnlineUsersView.as_view()),
]
