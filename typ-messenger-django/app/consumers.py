import json
from channels import Group
from channels.sessions import channel_session

from channels.auth import channel_session_user, channel_session_user_from_http

# from urlparse import parse_qs
from urllib.parse import parse_qs

from rest_framework.authtoken.models import Token




@channel_session
def ws_add(message, room):

	params = parse_qs(message.content["query_string"])
	token = params[b'token'][0].decode("utf-8")

	if Token.objects.filter(key=token).count() == 1:

		username = Token.objects.get(key=token).user.username
		message.channel_session['username'] = username
		message.channel_session['token'] = token

		print(username)
		print('authenticated')
		print(token)
	else:
		print('user not authenticated')
		return

	

	Group("chat-%s" % room).add(message.reply_channel)
	# Group('chat-%s' % room).send({
	#     'text': json.dumps({
	#         # "message": "JOINED the chat", 'username': username,

	#         "message": "user JOINED the chat",
	#     }),
	# })
	message.channel_session['room'] = room
	
	message.reply_channel.send({"accept": True})


@channel_session_user_from_http
@channel_session
def ws_message(message):

	username = message.channel_session['username']
	token = message.channel_session['token']
	room = message.channel_session['room']

	# username = message.channel_session['username']

	Group('chat-%s' % room).send({
	    'text': json.dumps({
	        # 'message': message.content['text'], 'username': username,
	        'username': username,
	        'token': token,
	        'message': message.content['text'],
	    }),
	})

@channel_session
def ws_disconnect(message):
    room = message.channel_session['room']

    # username = message.channel_session['username']

    # Group('chat-%s' % room).send({
    #     'text': json.dumps({
    #         # "message": "LEFT the chat", 'username': username,

    #         "message": "user LEFT the chat"
    #     }),
    # })
    Group("chat-%s" % room).discard(message.reply_channel)





