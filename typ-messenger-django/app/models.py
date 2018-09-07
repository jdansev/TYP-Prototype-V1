from django.db import models

from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token
from django.conf import settings

from django.contrib.auth.models import User

# This code is triggered whenever a new user has been created and saved to the database


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

class Group(models.Model):
	name = models.CharField(max_length=96, blank=False)
	description = models.CharField(max_length=1024, blank=True)
	unique_token = models.CharField(max_length=32)
	class Meta:
		ordering = ['name']
	def __unicode__(self):
	     return self.name

class Message(models.Model):
	message = models.CharField(max_length=1024, blank=False)
	group = models.ForeignKey(Group, on_delete=models.CASCADE, default='')

	sender = models.ForeignKey(User, on_delete=models.CASCADE, default=0)
	token = models.ForeignKey(Token, on_delete=models.CASCADE, default=0)

	date_time = models.DateTimeField(auto_now_add=True)

	

	class Meta:
		ordering = ['date_time']
	def __unicode__(self):
	     return self.message
