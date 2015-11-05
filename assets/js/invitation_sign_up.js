(function(){
    "use strict";

    /**
     * Configuration
     * @desc Object for changing the behavior of the application
     */
    var Configuration = {
        TIME_BEFORE_PROMPT_INVITATION: 15000, // in ms.

        NUMBER_PAGE_BEFORE_PROMPT_INVITATION: 5,

        USER_SESSION_KEY: "user-session",

        INVITATION_ELEMENT_ID: "invitation", //Invitation overlay element

        ANIMATION_CLASS_NAME: "slideUp" //This animation will be triggered when the invitation will be display
    };

    /**
     * Application
     * @desc the entry point of the application
     */
    var Application = {

        sessionManager: null,

        _bootstrap: function () {
            // Debugging purpose.
            this.configuration = Configuration;
            document.body.application = this;

            this.sessionManager = new UserSessionManager().init();
        }
    };

    /**
     * @constructor UserSessionManager
     * @desc Object that manage the current User Session
     */
    function UserSessionManager() {
        this.currentUserSession = null;
        this.invitationManager = null;
        this.startTime = Date.now();
    }

    /*
        Initialize the User Session
     */
    UserSessionManager.prototype.init = function() {
        if(window.sessionStorage) {
            var _userSessionSerialization,
                _currentUserSession;

            //Try to retrieve a old UserSession or create a new one
            if((_userSessionSerialization = sessionStorage.getItem(Configuration.USER_SESSION_KEY))) {
                try {
                    _currentUserSession = UserSession.createWithObject(JSON.parse(_userSessionSerialization));
                } catch (exeption) {
                    console.log(exeption);
                }
            } else {
                _currentUserSession = new UserSession();
            }

            this.currentUserSession = _currentUserSession;
            this.invitationManager = new InvitationManager();

            //We won't display the invitation if the user has already seen it.
            if (_currentUserSession.alreadyInvited) {
                return this;
            }

            //Display the invitation popup is the number of pages is reached.
            if(++this.currentUserSession.pageVisited == Configuration.NUMBER_PAGE_BEFORE_PROMPT_INVITATION) {
                this.invitationManager.display();
                this.currentUserSession.alreadyInvited = true;
                this.saveUserSession();
            } else { // otherwise wait for a certain amount of time.
                this.record();
            }

            return this;
        } else {
            throw "Session storage is not supported on your browser";
        }
    };

    /*
        wait for a certain amount of time (TIME_BEFORE_PROMPT_INVITATION) is reached,
        before displaying the invitation popup
     */
    UserSessionManager.prototype.record = function() {
        // determines the time that the user has been on the site.
        var timeout = Configuration.TIME_BEFORE_PROMPT_INVITATION - this.currentUserSession.visitTime,
            _this = this;

        setTimeout(function() {
            _this.invitationManager.display();
            _this.currentUserSession.alreadyInvited = true;
            _this.saveUserSession();
        }, timeout);

        //If the user leave the page, we save the user session before.
        window.addEventListener("beforeunload", this, true);
    };

    UserSessionManager.prototype.handleEvent = function(event) {
        if(event.type == "beforeunload") {
            this.saveUserSession();
        }
    };

    UserSessionManager.prototype.saveUserSession = function () {
        try {
            this.currentUserSession.visitTime += Date.now() - this.startTime;
            //serialize the user session.
            sessionStorage.setItem(Configuration.USER_SESSION_KEY, JSON.stringify(this.currentUserSession));
        } catch (exception) {
            console.log(exception.message);
        }
    };


    /**
     * @constructor UserSession
     * @desc Object that keeps tracks about the user
     */
    function UserSession() {
        this.pageVisited = 0;
        this.visitTime = 0;
        this.alreadyInvited = false;
    }

    /*
        Create an UserSession object
     */
    UserSession.createWithObject = function (_object) {
        var _userSession;

        if (_object && typeof _object === "object") {
            _userSession = new UserSession();
            _userSession.pageVisited = _object.pageVisited;
            _userSession.visitTime = _object.visitTime;
            _userSession.alreadyInvited = _object.alreadyInvited;
        }

        return _userSession;
    };


    /**
     * @constructor InvitationManager
     * @desc Object that display the invitation popup
     */
    function InvitationManager() {}

    InvitationManager.prototype.display = function() {
        var element = document.getElementById(Configuration.INVITATION_ELEMENT_ID);
        if(element == null) {
            console.log("The invitation element is missing.");
            return;
        }

        element.classList.add(Configuration.ANIMATION_CLASS_NAME);
    };

    Application._bootstrap(); // bootstrapping the app.

})();
