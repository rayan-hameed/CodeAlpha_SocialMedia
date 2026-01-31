import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")
django.setup()
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
u, p = "testuser", "testpassword123"
User.objects.filter(username=u).delete()
User.objects.create_user(username=u, password=p)
if authenticate(username=u, password=p): print("AUTH_OK")
else: print("AUTH_FAILED")
