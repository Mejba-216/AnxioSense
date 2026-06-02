import os

from celery import Celery
from decouple import config

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("anxiety_tracker")
app.conf.broker_url = config("REDIS_URL", default="redis://localhost:6379/0")
app.conf.result_backend = config("REDIS_URL", default="redis://localhost:6379/0")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
