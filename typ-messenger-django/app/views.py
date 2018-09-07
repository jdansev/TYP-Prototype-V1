from django.shortcuts import render
from rest_framework import generics
from .serializers import GroupSerializer, MessageSerializer
from .models import Group, Message

from rest_framework.views import APIView
from rest_framework.response import Response

from django.http import HttpResponse
import json

from django.utils.crypto import get_random_string

from rest_framework.views import APIView

from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User


def index(request):
	return render(request, "app/index.html", context=None)


class UserIndex(APIView):
	def get(self, request):
		print(request.user)
		return Response({"success": "200"})


def delete_all(request):
	count = Group.objects.all().count()
	Group.objects.all().delete()
	return HttpResponse("<p>Successfully deleted " + str(count) + " items.</p>")

class MessageList(APIView):

	def get(self, request, *args, **kwargs):
		pk = kwargs.get('pk', '0')
		messages = Message.objects.filter(group__id=pk)
		serializer = MessageSerializer(messages, many=True)
		return Response(serializer.data)

	def post(self, request, *args, **kwargs):
		pk = kwargs.get('pk', '0')
		group = Group.objects.get(pk=pk)

		print(request.data['user_token'])

		user = Token.objects.get(key=request.data['user_token']).user

		# print(Token.objects.get(key=request.data['user_token']).count())
		token = Token.objects.get(key=request.data['user_token'])

		message = Message.objects.create(message=request.data['message'], group=group, sender=user, token=token)
		message.save()
		return HttpResponse(json.dumps({'success': True}), content_type='application/json')

class GroupList(APIView):

	def get(self, request, format=None):
		groups = Group.objects.all()
		serializer = GroupSerializer(groups, many=True)
		return Response(serializer.data)

	def post(self, request, format=None):
		name = request.data['name']
		description = request.data['description']
		unique_token = get_random_string(length=32)
		group = Group.objects.create(name=name,description=description,unique_token=unique_token)
		return HttpResponse(json.dumps({'success': True}), content_type='application/json')

	def delete(self, request, format=None):
		Group.objects.filter(id=request.data['id']).delete()
		return HttpResponse(json.dumps({'success': True}), content_type='application/json')













