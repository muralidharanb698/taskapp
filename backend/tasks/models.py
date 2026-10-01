from django.contrib.auth.models import User
from django.db import models


class Task(models.Model):
    STATUS = [("todo", "To Do"), ("doing", "In Progress"), ("done", "Done")]
    PRIORITY = [("low", "Low"), ("medium", "Medium"), ("high", "High")]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default="todo")
    priority = models.CharField(max_length=10, choices=PRIORITY, default="medium")
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
