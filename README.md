# TYP. Messenger

TYP. Messenger is an ultra sleek messaging platform.

![alt text](./demo.png)

### Setup

*First clone this repo:*
```
git clone https://github.com/jdansev/TYP-Messenger
```

*Start a new python virtual environment and activate it:*
```
virtuenenv env -p python3
source env/bin/activate
```

Install the dependecies listed in the requirements.txt file. Be sure to do this inside of a virtual environment if you want to keep this project's dependecies separate from your global depedencies:
```
pip3 install -r requirements.txt
```

*Install redis server with homebrew and start it:*
```
brew install redis
redis-server
```

*You can now fire up the django server:*
```
python3 manage.py runserver
```

*Start a TYP. messenger client:*
```
electron .
```

Or instead package it as a standalone electron app:
`electron-packager . --overwrite --platform=darwin --arch=x64 --prune=true --out=release-builds`


### Groups

These APIs are used to manage groups without needing to go through Django's admin panel.

*To list the groups:*
```
http://127.0.0.1:8000/groups/
```

*To delete all groups:*
```
http://127.0.0.1:8000/groups/delete
```

*You can also flush django's database. This will remove all existing users and groups:*
```
python3 manage.py flush
```
