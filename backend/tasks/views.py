from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD for the logged-in user's tasks only (authorization)."""
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


def _auth_response(user):
    token, _ = Token.objects.get_or_create(user=user)
    return {"token": token.key, "name": user.first_name or user.email}


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    name = (request.data.get("name") or "").strip()
    if not email or len(password) < 6:
        return Response({"error": "Enter an email and a password of 6+ characters."}, status=400)
    if User.objects.filter(username=email).exists():
        return Response({"error": "That email is already registered."}, status=400)
    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    return Response(_auth_response(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = (request.data.get("email") or "").strip().lower()
    user = authenticate(username=email, password=request.data.get("password") or "")
    if not user:
        return Response({"error": "Wrong email or password."}, status=400)
    return Response(_auth_response(user))
