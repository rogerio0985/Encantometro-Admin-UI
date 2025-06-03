import { AfterViewInit, Component, EventEmitter, Injector, OnInit, Input, Output, ViewChild, ViewEncapsulation, NgZone, HostBinding, ElementRef, HostListener } from '@angular/core';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomHelper } from '@shared/helpers/DomHelper';
import { HttpClient } from '@angular/common/http';
import { FileUpload } from 'primeng/fileupload';
import { finalize } from 'rxjs/operators';
import {
    BlockUserInput,
    ChatSide,
    ChatServiceProxy,
    CommonLookupServiceProxy,
    CreateFriendshipRequestByUserNameInput,
    CreateFriendshipRequestInput,
    FindUsersInput,
    FriendshipDto,
    FriendshipState,
    FriendshipServiceProxy,
    MarkAllUnreadMessagesOfUserAsReadInput,
    NameValueDto,
    ProfileServiceProxy,
    UnblockUserInput,
    UserLoginInfoDto,
    ChatMessageReadState,
    ChatMessageDto
} from '@shared/service-proxies/service-proxies';
import { LocalStorageService } from '@shared/utils/local-storage.service';
import { filter as _filter, map as _map, forEach as _forEach, min as _min, reduce as _reduce } from 'lodash';
import { ChatFriendDto } from './ChatFriendDto';
import { ChatSignalrService } from './chat-signalr.service';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { LayoutRefService } from '@metronic/app/core/services/layout-ref.service';
import * as moment from 'moment';

@Component({
    templateUrl: './chat-bar.component.html',
    selector: 'chat-bar',
    styleUrls: ['./chat-bar.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class ChatBarComponent extends AppComponentBase implements OnInit, AfterViewInit {

    @Output() onProgress: EventEmitter<any> = new EventEmitter();
    @Input() userLookupModal: CommonLookupModalComponent;

    public progress = 0;
    uploadUrl: string;
    isFileSelected = false;


    @HostBinding('style.overflow') styleOverflow: any = 'hidden';

    @ViewChild('ChatMessage') chatMessageInput: ElementRef;
    @ViewChild('chatScrollBar') chatScrollBar;

    @ViewChild('chatImageUpload') chatImageUpload: FileUpload;
    @ViewChild('chatFileUpload') chatFileUpload: FileUpload;

    friendDtoState: typeof FriendshipState = FriendshipState;

    friends: ChatFriendDto[];
    currentUser: UserLoginInfoDto = this.appSession.user;
    profilePicture = AppConsts.appBaseUrl + '/assets/common/images/nopicture.png';
    chatMessage = '';

    tenantToTenantChatAllowed = false;
    tenantToHostChatAllowed = false;
    interTenantChatAllowed = false;
    sendingMessage = false;
    loadingPreviousUserMessages = false;
    userNameFilter = '';
    serverClientTimeDifference = 0;
    isMultiTenancyEnabled: boolean = this.multiTenancy.isEnabled;
    appChatSide: typeof ChatSide = ChatSide;
    appChatMessageReadState: typeof ChatMessageReadState = ChatMessageReadState;

    _isOpen: boolean;
    _pinned = false;
    _selectedUser: ChatFriendDto = new ChatFriendDto();

    @HostListener('mouseleave') mouseleave() {
        if (!this.pinned) {
            this.closeChat();
        }
    }

    get chatUserSearchHint(): string {
        return this.l('ChatUserSearch_Hint');
    }

    set isOpen(newValue: boolean) {
        if (newValue === this._isOpen) {
            return;
        }

        this._localStorageService.setItem('app.chat.isOpen', newValue);
        this._isOpen = newValue;

        if (newValue) {
            this.markAllUnreadMessagesOfUserAsRead(this.selectedUser);
        }
    }

    get isOpen(): boolean {
        return this._isOpen;
    }

    set pinned(newValue: boolean) {
        if (newValue === this._pinned) {
            return;
        }

        this._pinned = newValue;
        this._localStorageService.setItem('app.chat.pinned', newValue);
    }
    get pinned(): boolean {
        return this._pinned;
    }

    set selectedUser(newValue: ChatFriendDto) {
        if (newValue === this._selectedUser) {
            return;
        }

        this._selectedUser = newValue;

        //NOTE: this is a fix for localForage is not able to store user with messages array filled
        if (newValue.messages) {
            newValue.messages = [];
            newValue.messagesLoaded = false;
        }
        this._localStorageService.setItem('app.chat.selectedUser', newValue);
    }
    get selectedUser(): ChatFriendDto {
        return this._selectedUser;
    }

    constructor(
        private el: ElementRef,
        injector: Injector,
        private layoutRefService: LayoutRefService,
        private _friendshipService: FriendshipServiceProxy,
        private _chatService: ChatServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy,
        private _localStorageService: LocalStorageService,
        private _chatSignalrService: ChatSignalrService,
        private _profileService: ProfileServiceProxy,
        private _httpClient: HttpClient,
        private _dateTimeService: DateTimeService,
        public _zone: NgZone) {
        super(injector);
        this.uploadUrl = AppConsts.remoteServiceBaseUrl + '/api/services/app/Chat/UploadFile';
    }

    shareCurrentLink() {
        this.chatMessage = '[link]{"message":"' + window.location.href + '"}';
        this.sendMessage();
    }
    shareFile() {
        this.chatFileUpload.basicFileInput.nativeElement.click();
    }
    shareImage() {
        this.chatImageUpload.basicFileInput.nativeElement.click();
    }

    openChat(): void {
        let side = document.getElementById('chatSideRight');
        side.classList.add('mr-0');
        this.isOpen = this._pinned;
    }

    closeChat(): void {
        let side = document.getElementById('chatSideRight');
        if (side.classList.contains('mr-0')) {
            side.classList.remove('mr-0');
        }
        if (side.classList.contains('ml-0')) {
            side.classList.remove('ml-0');
        }
        this.isOpen = this._pinned;
    }
    showChat(): void {
        let side = document.getElementById('chatSideRight');
        if (!side.classList.contains('mr-0')) {
            side.classList.add('mr-0');
        }
        this.isOpen = true;
    }

    uploadImage(data: { files: File }): void {
        const formData: FormData = new FormData();
        const file = data.files[0];
        formData.append('file', file, file.name);
        this.progress = 1;
        this._httpClient
            .post<any>(this.uploadUrl, formData)
            .pipe(finalize(() => this.chatImageUpload.clear()))
            .subscribe(response => {
                this.chatMessage = '[image]{"id":"' + response.result.id + '", "name":"' + response.result.name + '", "contentType":"' + response.result.contentType + '"}';
                this.sendMessage();
                this.isFileSelected = false;
                this.progress = 0;
            });
    }

    uploadFile(data: { files: File }): void {
        const formData: FormData = new FormData();
        const file = data.files[0];
        this.progress = 1;
        formData.append('file', file, file.name);
        this._httpClient
            .post<any>(this.uploadUrl, formData)
            .pipe(finalize(() => this.chatFileUpload.clear()))
            .subscribe(response => {
                this.chatMessage = '[file]{"id":"' + response.result.id + '", "name":"' + response.result.name + '", "contentType":"' + response.result.contentType + '"}';
                this.sendMessage();
                this.isFileSelected = false;
                this.progress = 0;
            });
    }

    onBeforeSend(event): void {
        this.isFileSelected = true;
        event.xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
            if (e.lengthComputable) {
                this.progress = Math.round((e.loaded / e.total) * 100);
            }
            console.log('progress ' + this.progress);
            this.onProgress.emit({ originalEvent: e, progress: this.progress });
        }, false);

        event.xhr.onprogress = (e) => {
            if (event.lengthComputable) {
                this.progress = Math.round((e.loaded / e.total) * 100);
            }
            console.log('onprogress ' + this.progress);
            this.onProgress.emit({ originalEvent: e, progress: this.progress });
        }
    }
    onProgressChange($event) {
        console.log('onProgressChange ' + $event);
        this.progress = $event;
    }
    ngOnInit(): void {
        this.init();
    }

    getShownUserName(selectUser: ChatFriendDto): string {
        let name = selectUser.name != null ? selectUser.name : selectUser.friendUserName;
        let surname = selectUser.surname != null ? selectUser.surname : "";
        if (!this.isMultiTenancyEnabled) {
            return name + " " + surname;
        }

        return (selectUser.friendTenancyName ? selectUser.friendTenancyName : '.') + '\\' + name;
    }
    getShowTitle(selectUser: ChatFriendDto): string {
        let name = selectUser.name != null ? selectUser.name : selectUser.friendUserName;
        let surname = selectUser.surname != null ? selectUser.surname : "";
        return name + " " + surname + " <" + selectUser.email + ">";
    }

    getProfilePicture(): void {
        this._profileService.getProfilePicture().subscribe(result => {
            if (result && result.profilePicture) {
                this.profilePicture = 'data:image/jpeg;base64,' + result.profilePicture;
            }
        });
    }

    block(user: FriendshipDto): void {
        const blockUserInput = new BlockUserInput();
        blockUserInput.tenantId = user.friendTenantId;
        blockUserInput.userId = user.friendUserId;

        this._friendshipService.blockUser(blockUserInput).subscribe(() => {
            this.notify.info(this.l('UserBlocked'));
        });
    }

    unblock(user: FriendshipDto): void {
        const unblockUserInput = new UnblockUserInput();
        unblockUserInput.tenantId = user.friendTenantId;
        unblockUserInput.userId = user.friendUserId;

        this._friendshipService.unblockUser(unblockUserInput).subscribe(() => {
            this.notify.info(this.l('UserUnblocked'));
        });
    }

    markAllUnreadMessagesOfUserAsRead(user: ChatFriendDto): void {
        if (!user || !this.isOpen) {
            return;
        }

        const unreadMessages = _filter(user.messages, m => m.readState === ChatMessageReadState.Unread);
        const unreadMessageIds = _map(unreadMessages, 'id');

        if (!unreadMessageIds.length) {
            return;
        }

        const input = new MarkAllUnreadMessagesOfUserAsReadInput();
        input.tenantId = user.friendTenantId;
        input.userId = user.friendUserId;
        input.groupId = user.groupId;

        this._chatService.markAllUnreadMessagesOfUserAsRead(input).subscribe(() => {
            _forEach(user.messages, message => {
                if (unreadMessageIds.indexOf(message.id) >= 0) {
                    message.readState = ChatMessageReadState.Read;
                }
            });
        });
    }

    loadPreviousMesssagesOfSelectedUser(): void {
        this._zone.run(() => {
            this.loadMessages(this.selectedUser, null);
        });
    }

    loadMessages(user: ChatFriendDto, callback: any): void {
        this.loadingPreviousUserMessages = true;

        let minMessageId;
        if (user.messages && user.messages.length) {
            minMessageId = _min(_map(user.messages, m => m.id));
        }

        this._chatService.getUserChatMessages(minMessageId, user.friendTenantId ? user.friendTenantId : undefined, user.friendUserId, user.groupId)
            .subscribe(result => {
                if (!user.messages) {
                    user.messages = [];
                }
                user.messages = result.items.concat(user.messages);

                this.markAllUnreadMessagesOfUserAsRead(user);

                if (!result.items.length) {
                    user.allPreviousMessagesLoaded = true;
                }

                this.loadingPreviousUserMessages = false;
                if (callback) {
                    callback();
                }
            });
    }

    openSearchModal(userName: string, tenantId?: number): void {
        this.userLookupModal.filterText = userName;
        this.userLookupModal.show();
    }

    addFriendSelected(item: NameValueDto): void {
        const userId = item.value;
        const input = new CreateFriendshipRequestInput();
        input.userId = parseInt(userId);
        input.tenantId = this.appSession.tenant ? this.appSession.tenant.id : null;

        this._friendshipService.createFriendshipRequest(input).subscribe(() => {
            this.userNameFilter = '';
        });
    }

    search(): void {
        const input = new CreateFriendshipRequestByUserNameInput();

        if (this.userNameFilter.indexOf('\\') === -1) {
            input.userName = this.userNameFilter;
        } else {
            const tenancyAndUserNames = this.userNameFilter.split('\\');
            input.tenancyName = tenancyAndUserNames[0];
            input.userName = tenancyAndUserNames[1];
        }

        if (!input.tenancyName || !this.interTenantChatAllowed) {
            const tenantId = this.appSession.tenant ? this.appSession.tenant.id : null;
            this.openSearchModal(input.userName, tenantId);
        } else {
            this._friendshipService.createFriendshipRequestByUserName(input).subscribe(() => {
                this.userNameFilter = '';
            });
        }
    }

    getFriendOrNull(userId: number, tenantId?: number): ChatFriendDto {
        const friends = _filter(this.friends, friend => friend.friendUserId === userId && friend.friendTenantId === tenantId);
        if (friends.length) {
            return friends[0];
        }
        return null;
    }

    getFilteredFriends(state: FriendshipState, userNameFilter: string): FriendshipDto[] {
        const foundFriends = _filter(this.friends, friend => friend.state === state &&
            this.getShownUserName(friend)
                .toLocaleLowerCase()
                .indexOf(userNameFilter.toLocaleLowerCase()) >= 0);

        return foundFriends;
    }

    getFilteredFriendsCount(state: FriendshipState): number {
        return _filter(this.friends, friend => friend.state === state).length;
    }

    getUserNameByChatSide(chatSide: ChatSide): string {
        return chatSide === ChatSide.Sender ?
            this.currentUser.userName :
            this.selectedUser.friendUserName;
    }

    getFixedMessageTime(messageTime: Date | string): moment.Moment {
        if (typeof messageTime === 'string') {
            messageTime = this._dateTimeService.fromISODateString(messageTime);
        }
        return moment(this._dateTimeService.plusSeconds(messageTime, -1 * this.serverClientTimeDifference));
    }

    getFriendsAndSettings(callback: any): void {
        this._chatService.getUserChatFriendsWithSettings().subscribe(result => {
            this.friends = (result.friends as ChatFriendDto[]);
            this.serverClientTimeDifference = this._dateTimeService.getDiffInSeconds(this._dateTimeService.getDate(), result.serverTime);
            this.triggerUnreadMessageCountChangeEvent();
            callback();
        });
    }

    scrollToBottom(): void {
        setTimeout(() => {
            this.chatScrollBar.directiveRef.scrollToBottom();
        });
    }

    loadLastState(): void {
        const self = this;

        self._localStorageService.getItem('app.chat.isOpen', (err, isOpen) => {
            self.isOpen = isOpen;

            self._localStorageService.getItem('app.chat.pinned', (err, pinned) => {
                self.pinned = pinned;
            });

            if (isOpen) {
                this.showChat();
                self._localStorageService.getItem('app.chat.selectedUser', (err, selectedUser) => {
                    if (selectedUser && selectedUser.friendUserId) {
                        self.selectFriend(selectedUser);
                    }
                });
            }
        });
    }

    selectFriend(friend: ChatFriendDto): void {
        const chatUser = this.getFriendOrNull(friend.friendUserId, friend.friendTenantId);
        this.selectedUser = chatUser;
        if (!chatUser) {
            return;
        }
        this.chatMessage = '';
        if (!chatUser.messagesLoaded) {
            this.loadMessages(chatUser, () => {
                chatUser.messagesLoaded = true;
                this.adjustChatScrollbarHeight();
                this.scrollToBottom();
                this.chatMessageInput.nativeElement.focus();
            });
        } else {
            this.markAllUnreadMessagesOfUserAsRead(this.selectedUser);
            this.adjustChatScrollbarHeight();
            this.scrollToBottom();
            this.chatMessageInput.nativeElement.focus();
        }
    }

    adjustChatScrollbarHeight(): void {
        if (!this.selectedUser.friendUserId && !this.selectedUser.groupId) {
            return;
        }

        let height =
            document.getElementById('kt_quick_sidebar').clientHeight -
            document.getElementById('kt_chat_content').getElementsByClassName('card-header')[0].clientHeight -
            document.getElementById('kt_chat_content').getElementsByClassName('card-footer')[0].clientHeight -
            100;

        this.chatScrollBar.directiveRef.elementRef.nativeElement.parentElement.style.height = height + 'px';
    }

    sendMessage(event?: any): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (!this.chatMessage) {
            return;
        }

        this.sendingMessage = true;
        const tenancyName = this.appSession.tenant ? this.appSession.tenant.tenancyName : null;
        this._chatSignalrService.sendMessage({
            tenantId: this.selectedUser.friendTenantId,
            userId: this.selectedUser.friendUserId,
            message: this.chatMessage,
            tenancyName: tenancyName,
            userName: this.appSession.user.userName,
            profilePictureId: this.appSession.user.profilePictureId,
            groupId: this.selectedUser.groupId
        }, () => {
            this.chatMessage = '';
            this.sendingMessage = false;
        });
    }

    reversePinned(): void {
        this.pinned = !this.pinned;
    }

    quickSideBarBackClick(): void {
        this.selectedUser = new ChatFriendDto();
    }

    ngAfterViewInit(): void {

        this.userLookupModal.configure({
            title: this.l('SelectAUser'),
            dataSource: (skipCount: number, maxResultCount: number, filter: string, tenantId?: number) => {
                const input = new FindUsersInput();
                input.filter = filter;
                input.maxResultCount = maxResultCount;
                input.skipCount = skipCount;
                input.tenantId = tenantId;
                return this._commonLookupService.findUsers(input);
            }
        });

        setTimeout(() => {
            this.layoutRefService.addElement('asideRight', this.el.nativeElement);
        });
    }

    triggerUnreadMessageCountChangeEvent(): void {
        let totalUnreadMessageCount = 0;

        if (this.friends) {
            totalUnreadMessageCount = _reduce(this.friends, (memo, friend) => memo + friend.unreadMessageCount, 0);
        }

        eaf.event.trigger('app.chat.unreadMessageCountChanged', totalUnreadMessageCount);
    }

    registerEvents(): void {
        const self = this;

        function onMessageReceived(message) {
            const user = self.getFriendOrNull(message.targetUserId, message.targetTenantId);
            if (!user) {
                return;
            }
            user.messages = user.messages || [];
            user.messages.push(message);

            if (message.side === ChatSide.Receiver) {
                user.unreadMessageCount += 1;
                message.readState = ChatMessageReadState.Unread;
                self.triggerUnreadMessageCountChangeEvent();

                if (self.isOpen && self.selectedUser !== null && user.friendTenantId === self.selectedUser.friendTenantId && user.friendUserId === self.selectedUser.friendUserId) {
                    self.markAllUnreadMessagesOfUserAsRead(user);
                } else {
                    self.notify.info(
                        eaf.utils.formatString('{0}: {1}', user.friendUserName, eaf.utils.truncateString(message.message, 100)),
                        null,
                        {
                            onclick() {
                                if (document.body.className.indexOf('offcanvas-on') < 0) {
                                    self.showChatPanel();
                                    self.isOpen = true;
                                }

                                self.selectFriend(user);
                                self.pinned = true;
                            }
                        });
                }
            }

            self.scrollToBottom();
        }

        eaf.event.on('app.chat.messageReceived', message => {
            self._zone.run(() => {
                onMessageReceived(message);
            });
        });

        function onFriendshipRequestReceived(data, isOwnRequest) {
            if (!isOwnRequest) {
                eaf.notify.info(self.l('UserSendYouAFriendshipRequest', data.friendUserName));
            }
            if (!_filter(self.friends, f => f.friendUserId === data.friendUserId && f.friendTenantId === data.friendTenantId).length) {
                self.friends.push(data);
            }
        }

        eaf.event.on('app.chat.friendshipRequestReceived', (data, isOwnRequest) => {
            self._zone.run(() => {
                onFriendshipRequestReceived(data, isOwnRequest);
            });
        });

        function onUserConnectionStateChanged(data) {
            const user = self.getFriendOrNull(data.friend.userId, data.friend.tenantId);
            if (!user) {
                return;
            }

            user.isOnline = data.isConnected;
        }

        eaf.event.on('app.chat.userConnectionStateChanged', data => {
            self._zone.run(() => {
                onUserConnectionStateChanged(data);
            });
        });

        function onUserStateChanged(data) {
            const user = self.getFriendOrNull(data.friend.userId, data.friend.tenantId);
            if (!user) {
                return;
            }

            user.state = data.state;
        }

        eaf.event.on('app.chat.userStateChanged', data => {
            self._zone.run(() => {
                onUserStateChanged(data);
            });
        });

        function onAllUnreadMessagesOfUserRead(data) {
            const user = self.getFriendOrNull(data.friend.userId, data.friend.tenantId);
            if (!user) {
                return;
            }

            user.unreadMessageCount = 0;
            self.triggerUnreadMessageCountChangeEvent();
        }

        eaf.event.on('app.chat.allUnreadMessagesOfUserRead', data => {
            self._zone.run(() => {
                onAllUnreadMessagesOfUserRead(data);
            });
        });

        function onReadStateChange(data) {
            const user = self.getFriendOrNull(data.friend.userId, data.friend.tenantId);
            if (!user) {
                return;
            }

            _forEach(user.messages, message => {
                message.receiverReadState = ChatMessageReadState.Read;
            });
        }

        eaf.event.on('app.chat.readStateChange', data => {
            self._zone.run(() => {
                onReadStateChange(data);
            });
        });

        function onConnected() {
            self.getFriendsAndSettings(() => {
                DomHelper.waitUntilElementIsReady('#kt_quick_sidebar', () => {
                    self.loadLastState();
                });
            });
        }

        eaf.event.on('app.chat.connected', () => {
            self._zone.run(() => {
                onConnected();
            });
        });

        eaf.event.on('app.show.quickUserPanel', () => {
            this.closeChat();
        });
    }

    getReadStateHtml(message: ChatMessageDto): string {
        let readStateClass = message.receiverReadState === ChatMessageReadState.Read ? ' text-primary' : ' text-muted';
        return message.side === ChatSide.Sender ? '<i class="read-state-check fa fa-check' + readStateClass + '" aria-hidden="true"></i>' : '';
    }

    showChatPanel(): void {
        document.body.className += ' offcanvas-on';
        document.getElementById('kt_quick_sidebar').className += ' offcanvas-on';
    }

    onWindowResize(event): void {
        this.adjustChatScrollbarHeight();
    }

    init(): void {
        this.registerEvents();
        this.getProfilePicture();

        this.tenantToTenantChatAllowed = this.feature.isEnabled('App.ChatFeature.TenantToTenant');
        this.tenantToHostChatAllowed = this.feature.isEnabled('App.ChatFeature.TenantToHost');
        this.interTenantChatAllowed = this.feature.isEnabled('App.ChatFeature.TenantToTenant') || this.feature.isEnabled('App.ChatFeature.TenantToHost') || !this.appSession.tenant;

        this._zone.run(() => {
            this.getFriendsAndSettings(() => {
                DomHelper.waitUntilElementIsReady('#kt_quick_sidebar', () => {
                    this.loadLastState();
                });
            });
        });
    }

    getTitle(info: UserLoginInfoDto | ChatFriendDto, chat: ChatMessageDto): string {
        if (info instanceof UserLoginInfoDto) {
            return info.name + " " + info.surname + " <" + info.emailAddress + ">";
        }
        if (info instanceof ChatFriendDto) {
            if (info.friendUserId > 0)
                return info.name + " " + info.surname + " <" + info.email + ">";
            return chat.targetUserName;
        }
    }

    getFriendName(friend: ChatFriendDto, chat: ChatMessageDto): string {
        if (friend.friendUserId > 0)
            return friend.name;
        return chat.targetUserName;
    }

    getFriendUserId(friend: ChatFriendDto, chat: ChatMessageDto): number {
        if (friend.friendUserId > 0)
            return friend.friendUserId;
        return chat.targetUserId;
    }
}
