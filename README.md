# TYP. Messenger

TYP. Messenger is an ultra sleek messaging platform.

![alt text](./demo.png)

## Setup

**First clone this repo:**
```
git clone https://github.com/jdansev/TYP-Messenger
```

**Start a new python virtual environment and activate it:**
```
virtuenenv env -p python3
source env/bin/activate
```

Install the dependencies listed in the requirements.txt file. Be sure to do this inside of a virtual environment if you want to keep this project's dependencies separate from your global ones. To do so run this:
```
pip3 install -r requirements.txt
```

**Install redis with homebrew and start it:**
```
brew install redis
redis-server
```

**Now fire up the server:**
```
python3 manage.py runserver
```

**Start a TYP. messenger client:**
```
electron .
```

**Or instead package it as a standalone electron app:**
```
electron-packager . --overwrite --platform=darwin --arch=x64 --prune=true --out=release-builds
```


## Managing groups

These APIs are used to manage groups without needing to go through Django's admin panel.

**List the groups:**
```
http://127.0.0.1:8000/groups/
```

**Delete all groups:**
```
http://127.0.0.1:8000/groups/delete
```

You can also flush django's database. This will remove all existing users and groups:
```
python3 manage.py flush
```
