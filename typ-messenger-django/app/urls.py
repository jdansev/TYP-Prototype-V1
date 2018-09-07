
from django.conf.urls import include, url
from rest_framework.urlpatterns import format_suffix_patterns
from . import views


from rest_framework.authtoken import views as rest_framework_views

urlpatterns = [
	url(r'^$', views.index, name='index'),
    url(r'^groups/$', views.GroupList.as_view()),
    url(r'^groups/delete$', views.delete_all),
    url(r'^messages/(?P<pk>\d+)/$', views.MessageList.as_view()),

    url(r'^get_auth_token/$', rest_framework_views.obtain_auth_token, name='get_auth_token'),

    url(r'^user-index/', views.UserIndex.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
