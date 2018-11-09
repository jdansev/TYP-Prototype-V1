class GradientFactory {
    beginColor = {
        red: 0,
        green: 0,
        blue: 0,
    };
    endColor = {
        red: 255,
        green: 255,
        blue: 255,
    }
    colorStops: number;
    colors: string[];
    colorKeys: string[];
    constructor() {
        this.colorStops = 24;
        this.colors = [];
        this.colorKeys = ['red', 'green', 'blue'];
    }
    private byte_to_hex(n) {
        var hexVals = "0123456789ABCDEF";
		return String(hexVals.substr((n >> 4) & 0x0F, 1)) + hexVals.substr(n & 0x0F, 1);
    }
    private rgb_to_hex(r, g, b) {
        return '#' + this.byte_to_hex(r) + this.byte_to_hex(g) + this.byte_to_hex(b);
    }
    private parse_color(color) {
        if ((color).toString() === "[object Object]") {
            return color;
        } else {
            color = (color.charAt(0) == "#") ? color.substring(1, 7) : color;
            return {
                red: parseInt((color).substring(0, 2), 16),
                green: parseInt((color).substring(2, 4), 16),
                blue: parseInt((color).substring(4, 6), 16)
            };
        }
    }
    public generate(opts) {
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
        if (typeof(options.from) !== 'undefined') {
            this.beginColor = this.parse_color(options.from);
        }
        if (typeof(options.to) !== 'undefined') {
            this.endColor = this.parse_color(options.to);
        }
        if (typeof(options.stops) !== 'undefined') {
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
    }

}

class MessageUIManager {

    message_input: any;
    send_inner: any;
    send_btn_div: any;

    constructor() {
        var self: any = this;

        self.message_input = $( '#message-input' );
        self.send_inner = $( '.send-inner' );
        self.send_btn_div = $( '.send-btn-div' );

        self.send_btn_div.hover(
            function() { // on hover
                self.readyState();
            },
            function() { // on unhover
                if (!(self.message_input.val())) {
                    self.defaultState(100);
                }
            }
        );

        self.send_btn_div.click(function() {
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

    private readyState() {
        this.send_inner.addClass('ready');
    }

    private defaultState(ms: any) {
        var self: any = this;
        setTimeout(function() {
            self.send_inner.removeClass('ready');
        }, ms);
    }

    public clearInput() {
        this.message_input.val('');
    }

    public focusInput() {
        this.message_input.focus();
    }

    public setColorScheme(color: string) {
        this.send_inner.css({
            backgroundColor: color,
        });
        this.message_input.css({
            caretColor: color,
        })
    }

    public flyAnimation() {
        var self: any = this;

        if (!(self.message_input.val())) return; // check that input is not empty

        // fly animation
        $('.send-btn').stop().animate({
            opacity: 0,
            top: "-=40px",
        }, 300, function() { // Animation complete.
            $('.send-btn').css({
                opacity: '100',
                top: '0',
            });
            self.defaultState();
        });
        
    }

}


interface Message {
    message: string;
    sender_username: string;
    sender_token: string;
}

class MessageManager {
    messages: Array<Message>;
    constructor() { this.messages = new Array<Message>(); }
    public addMessage(message: Message) { this.messages.push(message); }
    public getAllMessages() { return this.messages; }
    public clearMessages() { this.messages = []; }
}

// NEW
class MessageHandler {
    
    message_input: any;
    container: any;
    socket: any;
    api_manager: APIManager;

    constructor() {
        var self: any = this;
        this.message_input = $( '#message-input' );
        this.container = $( '.container' );
        this.socket = null;
        this.api_manager = new APIManager();
        self.bindEnterKeyPress();
    }

    private bindEnterKeyPress() {
        var self: any = this;
        $(document).keypress(function(e) {
            if (e.which == 13) { // when enter key is pressed
                self.sendMessage();
                messageUIManager.clearInput();
            }
        });
    }

    private sendMessageAjax() {
        var self: any = this;
        var current_group_id = groupManager.getCurrentGroup().id;
        var user_token = my_token;
        $.ajax({
            url: 'http://127.0.0.1:8000/messages/' + current_group_id + '/',
            type: 'POST',
            data: {
                message: self.message_input.val(),
                user_token: user_token,
            },
            // DEBUGGING FUNCTIONS
            // error: function() {
                // alert('an error occured');
                // console.log('send error');
            // },
            // success: function() {
                // alert('sent successful');
                // console.log('send success');
            // },
        });
    }

    public sendMessage() {
        var self: any = this;
        if (self.message_input.val() == "") return; // validate if not blank
        self.sendMessageAjax();
        messageUIManager.flyAnimation();
        self.sendMessageSocket(self.message_input.val());
    }

    private loadMessages(data) {
        this.beginChatSocket(groupManager.getCurrentGroup().token);
        this.clearMessages();
        messageManager.clearMessages();
        // save messages
        $.each(data, function(k, message) {
            var new_message: Message = {
                message: message.message,
                sender_username: message.sender.username,
                sender_token: message.token.key,
            }
            messageManager.addMessage(new_message);
        });
        // load all messages into fluid motion elements
        fluidMotion.loadFluidMotionElementsFromArray(messageManager.getAllMessages());
    }

    public getMessages() {
        var api_url = 'http://127.0.0.1:8000/messages/' + groupManager.getCurrentGroup().id + '.json';
        this.api_manager.makeAPICall(api_url, this.loadMessages, this);
    }

    private clearMessages() {
        this.container.html('');
    }

    private clearInput() {
        this.message_input.val('');
    }

    public beginChatSocket(unique_group_identifier: string) {
        if (this.socket) this.socket.close();
        this.socket = new WebSocket("ws://127.0.0.1:8000/chat/" + unique_group_identifier + "?token=" + my_token);
        this.waitForSocketConnection(null);
    }

    public sendMessageSocket(message: string) {
        var self: any = this;
        self.waitForSocketConnection(function() {
            self.socket.send(message);
        });
    }
    
    public waitForSocketConnection(callback) {
        var self: any = this;
        setTimeout(function () {
            if (self.socket.readyState === 1) { // connection is made
                self.socket.onmessage = function(e) {
                    var json_object_data = JSON.parse(e.data);
                    // construct a new message object
                    var message = {
                        message: json_object_data.message,
                        sender_username: json_object_data.username,
                        sender_token: json_object_data.token,
                    };
                    fluidMotion.loadFluidMotionElement(message);
                }
                if (callback != null && typeof callback == 'function'){
                    callback();
                }
                return;
            } else { // wait for a connection
                self.waitForSocketConnection(callback);
            }
        }, 50);
    }

}

// NEW
class GroupUIManager {

    group_container: any;
    message_input: any;
    menu_div: any;
    dim: any;
    group_item: any;

    api_manager: APIManager;
    mouse_leave_lock: boolean;

    constructor() {
        var self: any = this;

        self.group_container = $( '.group-container' );
        self.message_input = $( '#message-input' );
        self.menu_div = $( '.menu-div' );
        self.dim = $( '.dim' );
        self.group_item = $( '.group' );

        self.api_manager = new APIManager();
        self.mouse_leave_lock = false;

        self.menu_div.mouseleave(function() {
            (!self.mouse_leave_lock) ? self.hideMenu() : self.mouse_leave_lock = false;
        });

        self.getFirstGroup();
    }

    public showMenu() {
        this.getGroups();
        this.mouse_leave_lock = false;
        this.menu_div.stop().animate({
            right: "0",
        }, 300);
        this.dim.css({
            display: 'block',
        })
        this.dim.stop().animate({
            opacity: 0.65,
        }, 300, function() {
        });
    }

    public hideMenu() {
        var self: any = this;
        self.menu_div.stop().animate({
            right: "-400px",
        }, 300, function() {
            self.mouse_leave_lock = false;
        });
        self.dim.stop().animate({
            opacity: 0,
        }, 300, function() {
            self.dim.css({
                display: 'none',
            })
        });
        messageUIManager.focusInput();
    }

    private clearGroupContainer() {
        this.group_container.html('');
    }

    private loadFirstGroupMessages(data) {

        if (data[0]) {
            var first_group = data[0];
            groupManager.addGroup(
                first_group.id,
                first_group.name,
                first_group.description,
                first_group.unique_token,
            );
            // set as current group
            groupManager.setCurrentGroup(first_group.id);
            // load group messages
            messageHandler.getMessages();
        }

    }


    private getFirstGroup() {
        var api_url: string = "http://127.0.0.1:8000/groups.json";
        this.api_manager.makeAPICall(api_url, this.loadFirstGroupMessages, this);
    }


    private getGroups() {
        var api_url: string = "http://127.0.0.1:8000/groups.json";
        this.api_manager.makeAPICall(api_url, this.loadGroups, this);
    }

    public loadGroups(data) {
        var self: any = this;

        self.clearGroupContainer();
        groupManager.clearGroupList();

        $.each(data, function(k, group) {

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
            group_element.click(function() {
                self.mouse_leave_lock = true;

                if (groupManager.getGroupList()) {

                    var gid = group_element.data('id');

                    // set as current group
                    groupManager.setCurrentGroup(gid);

                    // load group messages
                    messageHandler.getMessages();

                }

                setTimeout(function() {
                    self.hideMenu();
                }, 300);
            });

            groupManager.addGroup(
                group.id,
                group.name,
                group.description,
                group.unique_token,
            );

        });

    }

}

interface Group {
    id: number,
    name: string,
    description: string,
    token: string,
}

class GroupManager {

    groups: Array<Group>;
    current_group: Group;

    constructor() {
        this.groups = new Array<Group>();
        this.current_group = null;
    }

    public addGroup(id: number, name: string, description: string, token: string) {
        this.groups.push({
            id: id,
            name: name,
            description: description,
            token: token,
        });
    }

    public getGroupData(id: number): Group {
        var self = this;
        for (var i = 0; i < self.groups.length; i++) {
            if (self.groups[i].id == id) return self.groups[i];
        }
        return null;
    }

    public checkExists(id: number): Boolean {
        var self = this;
        for (var i = 0; i < self.groups.length; i++) {
            if (self.groups[i].id == id) return true;
        }
        return false;
    }

    public setCurrentGroup(id: number) { this.current_group = this.getGroupData(id); }
    public getCurrentGroup(): Group { return this.current_group; }
    public clearGroupList() { this.groups = []; }
    public numberOfGroups() { return this.groups.length; }
    public getGroupList() { return this.groups; }

}

class APIManager {
    private createCORSRequest(method, url) {
        var xhr = new XMLHttpRequest();
        // XHR for Chrome / Firefox / Opera / Safari.
        if ("withCredentials" in xhr) xhr.open(method, url, true);
        // XDomainRequest for IE.
        else if (typeof XDomainRequest != "undefined") { 
            xhr = new XDomainRequest();
            xhr.open(method, url);
        }
        // CORS not supported.
        else xhr = null;
        return xhr;
    }
    // Make the actual CORS request.
    public makeAPICall(url, callback, callbackobj) {
        var self: any = this;
        var xhr = self.createCORSRequest('GET', url);
        if (!xhr) { alert('CORS not supported'); return; }
        // Response handlers
        xhr.onload = function() {
            var json_object_data = $.parseJSON(xhr.responseText);
            if (typeof callback == 'function') {
                callback.apply(callbackobj, [json_object_data]);
            }
        };
        xhr.onerror = function() { alert('Woops, there was an error calling the API.'); };
        xhr.send();
    }
}

class ColorFade {
    gradient_factory: GradientFactory;
    container_height: number;
    gradient_list: Array<string>;
    container: any;
    scroll_container: any;
    theme_colors: Array<string>;

    constructor(theme_colors: Array<string>) {
        var self: any = this;
        self.gradient_factory = new GradientFactory();
        self.container = $( '.container' );
        self.scroll_container = $( '.scroll-container' );
        self.container_height = self.container.outerHeight();
        self.theme_colors = theme_colors;
        self.gradient_list = self.gradient_factory.generate({
            from: self.theme_colors[0],
            to: self.theme_colors[1],
            stops: self.container_height,
        });
        messageUIManager.setColorScheme(self.theme_colors[1]);
        self.scroll_container.on({
            scroll: function() { self.refreshGradients(); }
        });
        self.refreshGradients();
    }

    public changeTheme(new_colors: Array<string>) {
        var self: any = this;
        self.gradient_list = self.gradient_factory.generate({
            from: new_colors[0],
            to: new_colors[1],
            stops: self.container_height,
        });
        self.refreshGradients();
    }

    public refreshGradients() {

        var self: any = this;
        var scrollTop: number = document.getElementsByClassName('scroll-container')[0].scrollTop;
        var message_list: any = document.getElementsByClassName('message');

        // optimized for speed using javascript, no jquery
        for (var i = 0; i < message_list.length; i++) {
            var message_pos: number = message_list[i].parentNode.offsetTop - scrollTop;
            if (message_pos < 0) {
                message_list[i].style.backgroundColor = self.gradient_list[0];
                continue;
            }
            if (message_pos > self.container_height) {
                message_list[i].style.backgroundColor = self.gradient_list[self.gradient_list.length-1];
                break;
            }
            message_list[i].style.backgroundColor = self.gradient_list[Math.round(message_pos)];
        }

    }

}

class FluidMotionElement {
	element: any;
	easing: string;
	duration: string;
    top: any;
    
	constructor(element: any) {
		this.element = element;
		this.easing = 'ease-out';
        this.top = element.get(0).offsetTop;
    }

    public initialize() {
		var self = this;
        self.element.css({
            transition: 'transform ' + self.duration + ' ' + self.easing,
            position: 'absolute',
            top: self.top,
        });
    }
    
    public disableFluidTransition() {
        this.element.css({ transition: 'none', });
    }
    
	public enableFluidTransition(i:number) {
		var self = this;
        var duration = (i * 0.02) + 0.1;
        self.duration = duration.toFixed(2) + 's';
		self.element.css({
			transition: 'transform ' + self.duration + ' ' + self.easing,
		});
	}
}

enum Direction {
	Normal,
	Reversed,
}

class FluidMotion {
	target_container: any;
	fluid_motion_elements: FluidMotionElement[];
	scroll_container: any;
	scroll_view: any;
    direction: Direction;

	constructor(direction: Direction) {
        var self: any = this;

		self.target_container = $( '.container' );
		self.scroll_view = $( '.scroll-view' );
        self.scroll_container = $( '.scroll-container' );

        self.fluid_motion_elements = [];
        self.direction = direction;

        self.scroll_container.on({
            scroll: function () {
                self.fluid_motion_elements.forEach(function(element) {
                    element.element.css('transform', 'translateY(' + -self.scroll_container.scrollTop() + 'px)')
                });
            },
        });
    }
    
    public clearFluidMotionElements() {
        this.fluid_motion_elements = [];
    }

    // can apply to both receiving or sending messages
    public loadFluidMotionElement(message: Message) {
        var self: any = this;

        self.disableAllFluidTransitions();
        self.fluid_motion_elements.forEach(function(item) {
			item.element.css({
				position: 'relative',
			});
        });

        // check if user tag is needed
        var messages: Array<Message> = messageManager.getAllMessages();
        if ((messages.length == 0 || // if first message, or
            (messages.length >= 1 && // last message is defined, and
            messages[messages.length-1].sender_token != message.sender_token)) // this message was sent by a different user, and
            && (message.sender_token != my_token)) // user who sent it is not me
        {
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
            case Direction.Normal: self.fluid_motion_elements.push(new_fluid_element); break;
            case Direction.Reversed: self.fluid_motion_elements.unshift(new_fluid_element); break;
            default: self.fluid_motion_elements.push(new_fluid_element);
        }
        self.finishLoad();
    }

    public finishLoad() {
        var self: any = this;
        // resize the scroll view
        self.resizeScrollView();
        // after load, scroll the container to bottom and re-enable all transitions
        self.scroll_container.stop().animate({
            scrollTop : self.scroll_view.outerHeight(true)
        }, 800, function() {
            self.recalcAllFluidTransitions();
        });
        // update color fade colors
        colorFade.refreshGradients();
    }


    public loadFluidMotionElementsFromArray(messages: Array<Message>) {
        var self: any = this;
        self.clearFluidMotionElements();

        // loop through all message objects
        for (var i = 0; i < messages.length; i++) {
            // before creating the message, check if user tag should be made
            if ((!messages[i-1] || // if it's the first message in the array or
                (messages[i-1] &&   // check first if not undefined
                messages[i-1].sender_token != messages[i].sender_token)) // this message was sent by a different user
                && (messages[i].sender_token != my_token)) // and that user is not me, then add a user tag
            {
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
                case Direction.Normal: self.fluid_motion_elements.push(new_fluid_element); break;
                case Direction.Reversed: self.fluid_motion_elements.unshift(new_fluid_element); break;
                default: self.fluid_motion_elements.push(new_fluid_element);
            }

            // resize the scroll view
            self.resizeScrollView();
        }
        self.finishLoad();
    }

    public addUserTag(username: string) {
        var self: any = this;
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
    }
    
	public recalcAllFluidTransitions() {
		this.fluid_motion_elements.forEach(function(item, i) {
			item.enableFluidTransition(i);
		});
    }

    public disableAllFluidTransitions() {
		this.fluid_motion_elements.forEach(function(item) {
			item.disableFluidTransition();
		});
    }
    
	public initAllFluidElements() {
		if (typeof window.ontouchstart == 'undefined') {
			this.fluid_motion_elements.forEach(item => {
				item.initialize();
			});
		}
    }
    
	private resizeScrollView() {
        var self: any = this;
		self.scroll_view.css({
			height: function() {
                var h: number = 0;
				self.fluid_motion_elements.forEach(function(item) {
                    h += item.element.outerHeight(true);
                });
				return h + 30;
			},
        });
	}

}


// User 1: Ellen (ibiza sunset)
// var my_token: string = "872534c6ff2ca0d21011c4078b334dd865aef0a9";

// User 2: Parker (ocean)
var my_token: string = "60a99b28c3a15573ee3cc5b18e0536d7c817a21d";

// User 3: Sue (purplish red)
// var my_token: string = "ef51f485495d77367e277a5c58b59ec4fa691dc2";


var groupManager: GroupManager;
var groupUIManager: GroupUIManager;
var messageManager: MessageManager;
var messageHandler: MessageHandler;
var messageUIManager: MessageUIManager;
var fluidMotion: FluidMotion;
var colorFade: ColorFade;


function electronConfig() {
    // set electron zoom
    const {webFrame} = require('electron');
    webFrame.setZoomFactor(1);
}

window.onload = function() {

    electronConfig();

    var themePalette = {
        'endless river': ['#43cea2', '#185a9d'],
        'redish yellow': ['#f1c40f', '#e74c3c'],
        'vivid': ['#fcb045', '#ee0979'],
        'ibiza sunset': ['#ff6a00','#ee0979'],
        'ocean': ['#36D1DC','#5B86E5'],
        'purplish red': ['#8e44ad','#c0392b'],

        'redgray': ['#f3f3f3','#5B86E5'],

        'quepal': ['#38ef7d', '#11998e'],
    }

    
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
        themePalette['ocean'],
        // themePalette['purplish red'],

        // themePalette['redgray'],
        // themePalette['quepal'],
    );

    fluidMotion = new FluidMotion(Direction.Reversed);
    

}





