var GradientFactory = /** @class */ (function () {
    function GradientFactory() {
        this.beginColor = {
            red: 0,
            green: 0,
            blue: 0
        };
        this.endColor = {
            red: 255,
            green: 255,
            blue: 255
        };
        this.colorStops = 24;
        this.colors = [];
        this.colorKeys = ['red', 'green', 'blue'];
    }
    GradientFactory.prototype.byte_to_hex = function (n) {
        var hexVals = "0123456789ABCDEF";
        return String(hexVals.substr((n >> 4) & 0x0F, 1)) + hexVals.substr(n & 0x0F, 1);
    };
    GradientFactory.prototype.rgb_to_hex = function (r, g, b) {
        return '#' + this.byte_to_hex(r) + this.byte_to_hex(g) + this.byte_to_hex(b);
    };
    GradientFactory.prototype.parse_color = function (color) {
        if ((color).toString() === "[object Object]") {
            return color;
        }
        else {
            color = (color.charAt(0) == "#") ? color.substring(1, 7) : color;
            return {
                red: parseInt((color).substring(0, 2), 16),
                green: parseInt((color).substring(2, 4), 16),
                blue: parseInt((color).substring(4, 6), 16)
            };
        }
    };
    GradientFactory.prototype.generate = function (opts) {
        var colors = [];
        this.colors = [];
        var options = opts || {};
        var diff = {
            red: 0,
            green: 0,
            blue: 0
        };
        var len = this.colorKeys.length;
        var pOffset = 0;
        if (typeof (options.from) !== 'undefined') {
            this.beginColor = this.parse_color(options.from);
        }
        if (typeof (options.to) !== 'undefined') {
            this.endColor = this.parse_color(options.to);
        }
        if (typeof (options.stops) !== 'undefined') {
            this.colorStops = options.stops;
        }
        this.colorStops = Math.max(1, this.colorStops - 1);
        for (var x = 0; x < this.colorStops; x++) {
            pOffset = parseFloat(x, 10) / this.colorStops;
            for (var y = 0; y < len; y++) {
                diff[this.colorKeys[y]] = this.endColor[this.colorKeys[y]] - this.beginColor[this.colorKeys[y]];
                diff[this.colorKeys[y]] = (diff[this.colorKeys[y]] * pOffset) + this.beginColor[this.colorKeys[y]];
            }
            this.colors.push(this.rgb_to_hex(diff.red, diff.green, diff.blue));
        }
        this.colors.push(this.rgb_to_hex(this.endColor.red, this.endColor.green, this.endColor.blue));
        return this.colors;
    };
    return GradientFactory;
}());
var MessageUIManager = /** @class */ (function () {
    function MessageUIManager() {
        var self = this;
        self.message_input = $('#message-input');
        self.send_inner = $('.send-inner');
        self.send_btn_div = $('.send-btn-div');
        self.send_btn_div.hover(function () {
            self.readyState();
        }, function () {
            if (!(self.message_input.val())) {
                self.defaultState(100);
            }
        });
        self.send_btn_div.click(function () {
            self.flyAnimation();
            messageHandler.sendMessage();
            self.clearInput();
            self.focusInput();
        });
        self.message_input.bind('change keyup', function () {
            this.value ? self.readyState() : self.defaultState(250);
        });
        self.message_input.focus();
    }
    MessageUIManager.prototype.readyState = function () {
        this.send_inner.addClass('ready');
    };
    MessageUIManager.prototype.defaultState = function (ms) {
        var self = this;
        setTimeout(function () {
            self.send_inner.removeClass('ready');
        }, ms);
    };
    MessageUIManager.prototype.clearInput = function () {
        this.message_input.val('');
    };
    MessageUIManager.prototype.focusInput = function () {
        this.message_input.focus();
    };
    MessageUIManager.prototype.setColorScheme = function (color) {
        this.send_inner.css({
            backgroundColor: color
        });
        this.message_input.css({
            caretColor: color
        });
    };
    MessageUIManager.prototype.flyAnimation = function () {
        var self = this;
        if (!(self.message_input.val()))
            return; // check that input is not empty
        // fly animation
        $('.send-btn').stop().animate({
            opacity: 0,
            top: "-=40px"
        }, 300, function () {
            $('.send-btn').css({
                opacity: '100',
                top: '0'
            });
            self.defaultState();
        });
    };
    return MessageUIManager;
}());
var MessageManager = /** @class */ (function () {
    function MessageManager() {
        this.messages = new Array();
    }
    MessageManager.prototype.addMessage = function (message) { this.messages.push(message); };
    MessageManager.prototype.getAllMessages = function () { return this.messages; };
    MessageManager.prototype.clearMessages = function () { this.messages = []; };
    return MessageManager;
}());
// NEW
var MessageHandler = /** @class */ (function () {
    function MessageHandler() {
        var self = this;
        this.message_input = $('#message-input');
        this.container = $('.container');
        this.socket = null;
        this.api_manager = new APIManager();
        self.bindEnterKeyPress();
    }
    MessageHandler.prototype.bindEnterKeyPress = function () {
        var self = this;
        $(document).keypress(function (e) {
            if (e.which == 13) {
                self.sendMessage();
                messageUIManager.clearInput();
            }
        });
    };
    MessageHandler.prototype.sendMessageAjax = function () {
        var self = this;
        var current_group_id = groupManager.getCurrentGroup().id;
        var user_token = my_token;
        $.ajax({
            url: 'http://127.0.0.1:8000/messages/' + current_group_id + '/',
            type: 'POST',
            data: {
                message: self.message_input.val(),
                user_token: user_token
            }
        });
    };
    MessageHandler.prototype.sendMessage = function () {
        var self = this;
        if (self.message_input.val() == "")
            return; // validate if not blank
        self.sendMessageAjax();
        messageUIManager.flyAnimation();
        self.sendMessageSocket(self.message_input.val());
    };
    MessageHandler.prototype.loadMessages = function (data) {
        this.beginChatSocket(groupManager.getCurrentGroup().token);
        this.clearMessages();
        messageManager.clearMessages();
        // save messages
        $.each(data, function (k, message) {
            var new_message = {
                message: message.message,
                sender_username: message.sender.username,
                sender_token: message.token.key
            };
            messageManager.addMessage(new_message);
        });
        // load all messages into fluid motion elements
        fluidMotion.loadFluidMotionElementsFromArray(messageManager.getAllMessages());
    };
    MessageHandler.prototype.getMessages = function () {
        var api_url = 'http://127.0.0.1:8000/messages/' + groupManager.getCurrentGroup().id + '.json';
        this.api_manager.makeAPICall(api_url, this.loadMessages, this);
    };
    MessageHandler.prototype.clearMessages = function () {
        this.container.html('');
    };
    MessageHandler.prototype.clearInput = function () {
        this.message_input.val('');
    };
    MessageHandler.prototype.beginChatSocket = function (unique_group_identifier) {
        if (this.socket)
            this.socket.close();
        this.socket = new WebSocket("ws://127.0.0.1:8000/chat/" + unique_group_identifier + "?token=" + my_token);
        this.waitForSocketConnection(null);
    };
    MessageHandler.prototype.sendMessageSocket = function (message) {
        var self = this;
        self.waitForSocketConnection(function () {
            self.socket.send(message);
        });
    };
    MessageHandler.prototype.waitForSocketConnection = function (callback) {
        var self = this;
        setTimeout(function () {
            if (self.socket.readyState === 1) {
                self.socket.onmessage = function (e) {
                    var json_object_data = JSON.parse(e.data);
                    // construct a new message object
                    var message = {
                        message: json_object_data.message,
                        sender_username: json_object_data.username,
                        sender_token: json_object_data.token
                    };
                    fluidMotion.loadFluidMotionElement(message);
                };
                if (callback != null && typeof callback == 'function') {
                    callback();
                }
                return;
            }
            else {
                self.waitForSocketConnection(callback);
            }
        }, 50);
    };
    return MessageHandler;
}());
// NEW
var GroupUIManager = /** @class */ (function () {
    function GroupUIManager() {
        var self = this;
        self.group_container = $('.group-container');
        self.message_input = $('#message-input');
        self.menu_div = $('.menu-div');
        self.dim = $('.dim');
        self.group_item = $('.group');
        self.api_manager = new APIManager();
        self.mouse_leave_lock = false;
        self.menu_div.mouseleave(function () {
            (!self.mouse_leave_lock) ? self.hideMenu() : self.mouse_leave_lock = false;
        });
        self.getFirstGroup();
    }
    GroupUIManager.prototype.showMenu = function () {
        this.getGroups();
        this.mouse_leave_lock = false;
        this.menu_div.stop().animate({
            right: "0"
        }, 300);
        this.dim.css({
            display: 'block'
        });
        this.dim.stop().animate({
            opacity: 0.65
        }, 300, function () {
        });
    };
    GroupUIManager.prototype.hideMenu = function () {
        var self = this;
        self.menu_div.stop().animate({
            right: "-400px"
        }, 300, function () {
            self.mouse_leave_lock = false;
        });
        self.dim.stop().animate({
            opacity: 0
        }, 300, function () {
            self.dim.css({
                display: 'none'
            });
        });
        messageUIManager.focusInput();
    };
    GroupUIManager.prototype.clearGroupContainer = function () {
        this.group_container.html('');
    };
    GroupUIManager.prototype.loadFirstGroupMessages = function (data) {
        if (data[0]) {
            var first_group = data[0];
            groupManager.addGroup(first_group.id, first_group.name, first_group.description, first_group.unique_token);
            // set as current group
            groupManager.setCurrentGroup(first_group.id);
            // load group messages
            messageHandler.getMessages();
        }
    };
    GroupUIManager.prototype.getFirstGroup = function () {
        var api_url = "http://127.0.0.1:8000/groups.json";
        this.api_manager.makeAPICall(api_url, this.loadFirstGroupMessages, this);
    };
    GroupUIManager.prototype.getGroups = function () {
        var api_url = "http://127.0.0.1:8000/groups.json";
        this.api_manager.makeAPICall(api_url, this.loadGroups, this);
    };
    GroupUIManager.prototype.loadGroups = function (data) {
        var self = this;
        self.clearGroupContainer();
        groupManager.clearGroupList();
        $.each(data, function (k, group) {
            var group_element = $('<div></div>');
            group_element.addClass('group');
            group_element.data('id', group.id); // attach id to retrive associated data when clicked
            var group_title = $('<h1></h1>');
            group_title.addClass('group-item');
            group_title.addClass('group-name');
            group_title.html(group.name);
            var group_description = $('<p></p>');
            group_description.addClass('group-item');
            group_description.addClass('group-description');
            group_description.html(group.description);
            group_element.append(group_title);
            group_element.append(group_description);
            self.group_container.append(group_element);
            // bind click event to each individual group element
            group_element.click(function () {
                self.mouse_leave_lock = true;
                if (groupManager.getGroupList()) {
                    var gid = group_element.data('id');
                    // set as current group
                    groupManager.setCurrentGroup(gid);
                    // load group messages
                    messageHandler.getMessages();
                }
                setTimeout(function () {
                    self.hideMenu();
                }, 300);
            });
            groupManager.addGroup(group.id, group.name, group.description, group.unique_token);
        });
    };
    return GroupUIManager;
}());
var GroupManager = /** @class */ (function () {
    function GroupManager() {
        this.groups = new Array();
        this.current_group = null;
    }
    GroupManager.prototype.addGroup = function (id, name, description, token) {
        this.groups.push({
            id: id,
            name: name,
            description: description,
            token: token
        });
    };
    GroupManager.prototype.getGroupData = function (id) {
        var self = this;
        for (var i = 0; i < self.groups.length; i++) {
            if (self.groups[i].id == id)
                return self.groups[i];
        }
        return null;
    };
    GroupManager.prototype.checkExists = function (id) {
        var self = this;
        for (var i = 0; i < self.groups.length; i++) {
            if (self.groups[i].id == id)
                return true;
        }
        return false;
    };
    GroupManager.prototype.setCurrentGroup = function (id) { this.current_group = this.getGroupData(id); };
    GroupManager.prototype.getCurrentGroup = function () { return this.current_group; };
    GroupManager.prototype.clearGroupList = function () { this.groups = []; };
    GroupManager.prototype.numberOfGroups = function () { return this.groups.length; };
    GroupManager.prototype.getGroupList = function () { return this.groups; };
    return GroupManager;
}());
var APIManager = /** @class */ (function () {
    function APIManager() {
    }
    APIManager.prototype.createCORSRequest = function (method, url) {
        var xhr = new XMLHttpRequest();
        // XHR for Chrome / Firefox / Opera / Safari.
        if ("withCredentials" in xhr)
            xhr.open(method, url, true);
        else if (typeof XDomainRequest != "undefined") {
            xhr = new XDomainRequest();
            xhr.open(method, url);
        }
        else
            xhr = null;
        return xhr;
    };
    // Make the actual CORS request.
    APIManager.prototype.makeAPICall = function (url, callback, callbackobj) {
        var self = this;
        var xhr = self.createCORSRequest('GET', url);
        if (!xhr) {
            alert('CORS not supported');
            return;
        }
        // Response handlers
        xhr.onload = function () {
            var json_object_data = $.parseJSON(xhr.responseText);
            if (typeof callback == 'function') {
                callback.apply(callbackobj, [json_object_data]);
            }
        };
        xhr.onerror = function () { alert('Woops, there was an error calling the API.'); };
        xhr.send();
    };
    return APIManager;
}());
var ColorFade = /** @class */ (function () {
    function ColorFade(theme_colors) {
        var self = this;
        self.gradient_factory = new GradientFactory();
        self.container = $('.container');
        self.scroll_container = $('.scroll-container');
        self.container_height = self.container.outerHeight();
        self.theme_colors = theme_colors;
        self.gradient_list = self.gradient_factory.generate({
            from: self.theme_colors[0],
            to: self.theme_colors[1],
            stops: self.container_height
        });
        messageUIManager.setColorScheme(self.theme_colors[1]);
        self.scroll_container.on({
            scroll: function () { self.refreshGradients(); }
        });
        self.refreshGradients();
    }
    ColorFade.prototype.changeTheme = function (new_colors) {
        var self = this;
        self.gradient_list = self.gradient_factory.generate({
            from: new_colors[0],
            to: new_colors[1],
            stops: self.container_height
        });
        self.refreshGradients();
    };
    ColorFade.prototype.refreshGradients = function () {
        var self = this;
        var scrollTop = document.getElementsByClassName('scroll-container')[0].scrollTop;
        var message_list = document.getElementsByClassName('message');
        // optimized for speed using javascript, no jquery
        for (var i = 0; i < message_list.length; i++) {
            var message_pos = message_list[i].parentNode.offsetTop - scrollTop;
            if (message_pos < 0) {
                message_list[i].style.backgroundColor = self.gradient_list[0];
                continue;
            }
            if (message_pos > self.container_height) {
                message_list[i].style.backgroundColor = self.gradient_list[self.gradient_list.length - 1];
                break;
            }
            message_list[i].style.backgroundColor = self.gradient_list[Math.round(message_pos)];
        }
    };
    return ColorFade;
}());
var FluidMotionElement = /** @class */ (function () {
    function FluidMotionElement(element) {
        this.element = element;
        this.easing = 'ease-out';
        this.top = element.get(0).offsetTop;
    }
    FluidMotionElement.prototype.initialize = function () {
        var self = this;
        self.element.css({
            transition: 'transform ' + self.duration + ' ' + self.easing,
            position: 'absolute',
            top: self.top
        });
    };
    FluidMotionElement.prototype.disableFluidTransition = function () {
        this.element.css({ transition: 'none' });
    };
    FluidMotionElement.prototype.enableFluidTransition = function (i) {
        var self = this;
        var duration = (i * 0.02) + 0.1;
        self.duration = duration.toFixed(2) + 's';
        self.element.css({
            transition: 'transform ' + self.duration + ' ' + self.easing
        });
    };
    return FluidMotionElement;
}());
var Direction;
(function (Direction) {
    Direction[Direction["Normal"] = 0] = "Normal";
    Direction[Direction["Reversed"] = 1] = "Reversed";
})(Direction || (Direction = {}));
var FluidMotion = /** @class */ (function () {
    function FluidMotion(direction) {
        var self = this;
        self.target_container = $('.container');
        self.scroll_view = $('.scroll-view');
        self.scroll_container = $('.scroll-container');
        self.fluid_motion_elements = [];
        self.direction = direction;
        self.scroll_container.on({
            scroll: function () {
                self.fluid_motion_elements.forEach(function (element) {
                    element.element.css('transform', 'translateY(' + -self.scroll_container.scrollTop() + 'px)');
                });
            }
        });
    }
    FluidMotion.prototype.clearFluidMotionElements = function () {
        this.fluid_motion_elements = [];
    };
    // can apply to both receiving or sending messages
    FluidMotion.prototype.loadFluidMotionElement = function (message) {
        var self = this;
        self.disableAllFluidTransitions();
        self.fluid_motion_elements.forEach(function (item) {
            item.element.css({
                position: 'relative'
            });
        });
        // check if user tag is needed
        var messages = messageManager.getAllMessages();
        if ((messages.length == 0 || // if first message, or
            (messages.length >= 1 && // last message is defined, and
                messages[messages.length - 1].sender_token != message.sender_token)) // this message was sent by a different user, and
            && (message.sender_token != my_token)) {
            fluidMotion.addUserTag(message.sender_username);
        }
        // add the message to list
        messageManager.addMessage(message);
        // div.message-container
        var fluid_element = $('<div/>');
        fluid_element.addClass('message-container');
        // determine if message direction is to or from
        (message.sender_token == my_token) ? fluid_element.addClass('to') : fluid_element.addClass('from');
        // div.message
        var message_div = $('<div/>');
        message_div.addClass('message');
        message_div.html(message.message);
        // div.message-container > div.message
        fluid_element.append(message_div);
        // div.container > div.message-container
        self.target_container.append(fluid_element);
        // initialize as a new fluid motion element
        var new_fluid_element = new FluidMotionElement(fluid_element);
        switch (self.direction) {
            case Direction.Normal:
                self.fluid_motion_elements.push(new_fluid_element);
                break;
            case Direction.Reversed:
                self.fluid_motion_elements.unshift(new_fluid_element);
                break;
            default: self.fluid_motion_elements.push(new_fluid_element);
        }
        self.finishLoad();
    };
    FluidMotion.prototype.finishLoad = function () {
        var self = this;
        // resize the scroll view
        self.resizeScrollView();
        // after load, scroll the container to bottom and re-enable all transitions
        self.scroll_container.stop().animate({
            scrollTop: self.scroll_view.outerHeight(true)
        }, 800, function () {
            self.recalcAllFluidTransitions();
        });
        // update color fade colors
        colorFade.refreshGradients();
    };
    FluidMotion.prototype.loadFluidMotionElementsFromArray = function (messages) {
        var self = this;
        self.clearFluidMotionElements();
        // loop through all message objects
        for (var i = 0; i < messages.length; i++) {
            // before creating the message, check if user tag should be made
            if ((!messages[i - 1] || // if it's the first message in the array or
                (messages[i - 1] && // check first if not undefined
                    messages[i - 1].sender_token != messages[i].sender_token)) // this message was sent by a different user
                && (messages[i].sender_token != my_token)) {
                fluidMotion.addUserTag(messages[i].sender_username);
            }
            // div.message-container
            var fluid_element = $('<div/>');
            fluid_element.addClass('message-container');
            // determine if message direction is to or from
            (messages[i].sender_token == my_token) ? fluid_element.addClass('to') : fluid_element.addClass('from');
            // now to actually construct the DOM element
            // div.message
            var message_div = $('<div/>');
            message_div.addClass('message');
            message_div.html(messages[i].message);
            // div.message-container > div.message
            fluid_element.append(message_div);
            // div.container > div.message-container
            self.target_container.append(fluid_element);
            // initialize as a new fluid motion element
            var new_fluid_element = new FluidMotionElement(fluid_element);
            switch (self.direction) {
                case Direction.Normal:
                    self.fluid_motion_elements.push(new_fluid_element);
                    break;
                case Direction.Reversed:
                    self.fluid_motion_elements.unshift(new_fluid_element);
                    break;
                default: self.fluid_motion_elements.push(new_fluid_element);
            }
            // resize the scroll view
            self.resizeScrollView();
        }
        self.finishLoad();
    };
    FluidMotion.prototype.addUserTag = function (username) {
        var self = this;
        var fluid_element = $('<div/>');
        fluid_element.addClass('message-container');
        fluid_element.addClass('from');
        var message_div = $('<div/>');
        message_div.addClass('user-tag');
        message_div.html(username);
        fluid_element.append(message_div);
        self.target_container.append(fluid_element);
        var new_fluid_element = new FluidMotionElement(fluid_element);
        switch (self.direction) {
            case Direction.Normal:
                self.fluid_motion_elements.push(new_fluid_element);
                break;
            case Direction.Reversed:
                self.fluid_motion_elements.unshift(new_fluid_element);
                break;
            default:
                self.fluid_motion_elements.push(new_fluid_element);
        }
    };
    FluidMotion.prototype.recalcAllFluidTransitions = function () {
        this.fluid_motion_elements.forEach(function (item, i) {
            item.enableFluidTransition(i);
        });
    };
    FluidMotion.prototype.disableAllFluidTransitions = function () {
        this.fluid_motion_elements.forEach(function (item) {
            item.disableFluidTransition();
        });
    };
    FluidMotion.prototype.initAllFluidElements = function () {
        if (typeof window.ontouchstart == 'undefined') {
            this.fluid_motion_elements.forEach(function (item) {
                item.initialize();
            });
        }
    };
    FluidMotion.prototype.resizeScrollView = function () {
        var self = this;
        self.scroll_view.css({
            height: function () {
                var h = 0;
                self.fluid_motion_elements.forEach(function (item) {
                    h += item.element.outerHeight(true);
                });
                return h + 30;
            }
        });
    };
    return FluidMotion;
}());
// TEST USERS
// johndoe543
// var my_token: string = "3be803023537776f9dbce26479dc33233144c0f6";
// jamesbond007
var my_token = "a4b8c8d951b24892acb3e565e27a65f76f06f5cc";
// peterquill987
// var my_token: string = "710147067e4bba79305a9770622c1c52d3c5caf5";
var groupManager;
var groupUIManager;
var messageManager;
var messageHandler;
var messageUIManager;
var fluidMotion;
var colorFade;
function electronConfig() {
    // set electron zoom
    var webFrame = require('electron').webFrame;
    webFrame.setZoomFactor(1);
}
window.onload = function () {
    electronConfig();
    var themePalette = {
        'endless river': ['#43cea2', '#185a9d'],
        'redish yellow': ['#f1c40f', '#e74c3c'],
        'vivid': ['#fcb045', '#ee0979'],
        'ibiza sunset': ['#ff6a00', '#ee0979'],
        'ocean': ['#36D1DC', '#5B86E5'],
        'purplish red': ['#8e44ad', '#c0392b'],
        'redgray': ['#f3f3f3', '#5B86E5'],
        'quepal': ['#38ef7d', '#11998e']
    };
    messageManager = new MessageManager();
    messageHandler = new MessageHandler();
    messageUIManager = new MessageUIManager();
    groupManager = new GroupManager();
    groupUIManager = new GroupUIManager();
    colorFade = new ColorFade(
    // themePalette['endless river'],
    // themePalette['redish yellow'],
    // themePalette['vivid'],
    // themePalette['ibiza sunset'],
    // themePalette['ocean'],
    // themePalette['purplish red'],
    // themePalette['redgray'],
    themePalette['quepal']);
    fluidMotion = new FluidMotion(Direction.Reversed);
};
