from rest_framework import serializers
from .models import Group, Message

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

import datetime

class GroupSerializer(serializers.ModelSerializer):
	unique_token = '1234567890123456'
	class Meta:
		model = Group
		fields = ('id', 'name', 'description', 'unique_token',) # '__all__'

class SenderSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ('username',)

class TokenSerializer(serializers.ModelSerializer):
	class Meta:
		model = Token
		fields = ('key',)

class MessageSerializer(serializers.ModelSerializer):
	token = TokenSerializer()
	sender = SenderSerializer()
	class Meta:
		model = Message
		fields = ('id', 'message', 'date_time', 'sender', 'token',) # '__all__'
