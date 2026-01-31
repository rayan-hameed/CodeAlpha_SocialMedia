import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate

username = "testuser"
password = "testpassword123"

# Cleanup existing
User.objects.filter(username=username).delete()

# Create
user = User.objects.create_user(username=username, password=password)
print(f"Created user: {user.username}")

# Test Auth
authenticated_user = authenticate(username=username, password=password)
if authenticated_user:
    print("Authentication SUCCESSFUL!")
else:
    print("Authentication FAILED!")

# Check hashed password
print(f"Hashed password in DB: {user.password}")
