import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")
django.setup()

from django.contrib.auth.models import User
print("Existing Users:")
for u in User.objects.all():
    print(f"ID: {u.id}, Username: {u.username}, Password (hashed): {u.password[:10]}...")
