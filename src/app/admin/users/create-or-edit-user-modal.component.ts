import { AfterViewChecked, Component, ElementRef, EventEmitter, Injector, Output, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreateOrUpdateUserInput, PasswordComplexitySetting, ProfileServiceProxy, UserEditDto, UserRoleDto, UserServiceProxy, UserListDto, CreateActiveDirectoryUserInput,  CreateLdapUserInput } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap';
import * as _ from 'lodash';
import { finalize } from 'rxjs/operators';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { DataTable } from 'primeng/primeng';
import { DataTableHelper } from '@shared/helpers/DataTableHelper';


@Component({
    selector: 'createOrEditUserModal',
    templateUrl: './create-or-edit-user-modal.component.html',
    styles: [`.user-edit-dialog-profile-image {
             margin-bottom: 20px;
        }`
    ]
})
export class CreateOrEditUserModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('dataTableAD') dataTableAD: DataTable;
    @ViewChild('dataTableNS') dataTableNS: DataTable;
    @ViewChild('dataTableLDAP') dataTableLDAP: DataTable;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    dataTableHelperAD: DataTableHelper = new DataTableHelper();
    dataTableHelperNS: DataTableHelper = new DataTableHelper();
    dataTableHelperLDAP: DataTableHelper = new DataTableHelper();

    active = false;
    saving = false;
    canChangeUserName = true;
    isLockoutEnabled: boolean = this.setting.getBoolean('Eaf.Middleware.UserManagement.UserLockOut.IsEnabled');
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();

    user: UserEditDto = new UserEditDto();
    systemRoles: UserRoleDto[];
    activeDirectoryRoles: UserRoleDto[];
    ldapRoles: UserRoleDto[];

    sendActivationEmail = false;
    setRandomPassword = true;
    passwordComplexityInfo = '';
    profilePicture: string;

    ldapEnabled: boolean = false;
    activeDirectoryEnabled: boolean = false;


    userType: string = 'system';
    isActiveActiveDirectory: boolean = true;
    isActiveLdap: boolean = true;

    isCurrentSystemUser = true;

    filters: {
        filterTextActiveDirectory: string;
        filterTextLdap: string;
    } = <any>{};

    selectedActiveDirectoryUsers: UserListDto[] = [];
    selectedLdapUsers: UserListDto[] = [];

    get isValid(): boolean {
        let valid = false;

        valid = (this.userType == 'system' && this.systemRoles.filter(role => role.isAssigned).length > 0) ||
        (this.userType == 'activedirectory' && this.activeDirectoryRoles.filter(role => role.isAssigned).length > 0) ||
        (this.userType == 'ldap' && this.ldapRoles.filter(role => role.isAssigned).length > 0)

        return valid;
    }

    constructor(
        injector: Injector,
        private _userService: UserServiceProxy,
        private _profileService: ProfileServiceProxy
    ) {
        super(injector);
    }

    show(userId?: number, authenticationSource?: string): void {

        this.isCurrentSystemUser = authenticationSource == undefined;
        this.activeDirectoryEnabled = AppConsts.appActiveDirectoryEnabled;
        this.ldapEnabled = AppConsts.appLdapEnabled;

        this.systemRoles = [];
        this.activeDirectoryRoles = [];
        this.ldapRoles = [];

        if (!userId) {
            this.active = true;
            this.setRandomPassword = true;
            this.sendActivationEmail = false;
        }

        this._userService.getUserForEdit(userId).subscribe(userResult => {
            this.user = userResult.user;

            userResult.roles.forEach(role => {
                this.systemRoles.push(this.createUserRole(role));
                this.activeDirectoryRoles.push(this.createUserRole(role));
                this.ldapRoles.push(this.createUserRole(role));
            });

            this.canChangeUserName = this.user.userName !== AppConsts.userManagement.defaultAdminUserName;

            this.getProfilePicture(userResult.profilePictureId);

            if (userId) {
                this.active = true;

                setTimeout(() => {
                    this.setRandomPassword = false;
                }, 0);

                this.sendActivationEmail = false;
            }

            this._profileService.getPasswordComplexitySetting().subscribe(passwordComplexityResult => {
                this.passwordComplexitySetting = passwordComplexityResult.setting;
                this.setPasswordComplexityInfo();
                this.modal.show();
            });
        });
    }

    setPasswordComplexityInfo(): void {

        this.passwordComplexityInfo = '<ul>';

        if (this.passwordComplexitySetting.requireDigit) {
            this.passwordComplexityInfo += '<li>' + this.l('PasswordComplexity_RequireDigit_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requireLowercase) {
            this.passwordComplexityInfo += '<li>' + this.l('PasswordComplexity_RequireLowercase_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requireUppercase) {
            this.passwordComplexityInfo += '<li>' + this.l('PasswordComplexity_RequireUppercase_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requireNonAlphanumeric) {
            this.passwordComplexityInfo += '<li>' + this.l('PasswordComplexity_RequireNonAlphanumeric_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requiredLength) {
            this.passwordComplexityInfo += '<li>' + this.l('PasswordComplexity_RequiredLength_Hint', this.passwordComplexitySetting.requiredLength) + '</li>';
        }

        this.passwordComplexityInfo += '</ul>';
    }

    getProfilePicture(profilePictureId: string): void {
        if (!profilePictureId) {
            this.profilePicture = this.appRootUrl() + 'assets/common/images/nopicture.png';
        } else {
            this._profileService.getProfilePictureById(profilePictureId).subscribe(result => {

                if (result && result.profilePicture) {
                    this.profilePicture = 'data:image/jpeg;base64,' + result.profilePicture;
                } else {
                    this.profilePicture = this.appRootUrl() + 'assets/common/images/nopicture.png';
                }
            });
        }
    }

    onShown(): void {

        document.getElementById('Name').focus();
    }

    save(): void {
        let input = new CreateOrUpdateUserInput();

        input.user = this.user;
        input.setRandomPassword = this.setRandomPassword;
        input.sendActivationEmail = this.sendActivationEmail;
        input.assignedRoleNames =
            _.map(
                _.filter(this.systemRoles, { isAssigned: true }), role => role.roleName
            );

        this.saving = true;
        this._userService.createOrUpdateUser(input)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.closeEmit();
            });
    }

    saveByActiveDirectoryUser(): void {

        var input = new CreateActiveDirectoryUserInput();

        input.userNames = _.map(
            _.filter(this.selectedActiveDirectoryUsers), user => user.emailAddress
        );

        input.assignedRoleNames =
            _.map(
                _.filter(this.activeDirectoryRoles, { isAssigned: true }), role => role.roleName
            );

        input.isActive = this.isActiveActiveDirectory;

        this.saving = true;
        this._userService.createUsersByActiveDirectory(input)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.closeEmit();
            });
    }

    saveByLdapUser(): void {

        var input = new CreateLdapUserInput();

        input.userNames = _.map(
            _.filter(this.selectedLdapUsers), user => user.userName
        );

        input.assignedRoleNames =
            _.map(
                _.filter(this.ldapRoles, { isAssigned: true }), role => role.roleName
            );

        input.isActive = this.isActiveLdap;

        this.saving = true;
        this._userService.createUsersByLdap(input)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.closeEmit();
            });
    }


    closeEmit(): void {
        this.notify.success(this.l('SavedSuccessfully'));
        this.close();
        this.modalSave.emit(null);
    }

    close(): void {

        if(this.activeDirectoryEnabled && this.dataTableAD != undefined) {
            this.filters.filterTextActiveDirectory = "";
            this.dataTableHelperAD.records = null;
            this.dataTableAD.reset();
        }


        if(this.ldapEnabled && this.dataTableLDAP != undefined) {
            this.filters.filterTextLdap = "";
            this.dataTableHelperLDAP.records = null;
            this.dataTableLDAP.reset();
        }

        this.active = false;
        this.modal.hide();
    }

    getActiveDirectoryUsers(): void {
        this.selectedActiveDirectoryUsers = [];
        this.dataTableHelperAD.showLoadingIndicator();

        this._userService.getActiveDirectoryUsers(
            this.filters.filterTextActiveDirectory,
        ).pipe(finalize(() => this.dataTableHelperAD.hideLoadingIndicator())).subscribe(result => {
            this.dataTableHelperAD.totalRecordsCount = result.length;
            this.dataTableHelperAD.records = result;
            this.dataTableHelperAD.hideLoadingIndicator();
        });
    }


    getLdapUsers(): void {
        this.selectedLdapUsers = [];
        this.dataTableHelperLDAP.showLoadingIndicator();

        this._userService.getLdapUsers(
            this.filters.filterTextLdap,
        ).pipe(finalize(() => this.dataTableHelperLDAP.hideLoadingIndicator())).subscribe(result => {
            this.dataTableHelperLDAP.totalRecordsCount = result.length;
            this.dataTableHelperLDAP.records = result;
            this.dataTableHelperLDAP.hideLoadingIndicator();
        });
    }

    selectTab(userType: string): void {
        this.userType = userType;
    }

    createUserRole(role: UserRoleDto): UserRoleDto {
        var userRole = new UserRoleDto();

        userRole.roleId = role.roleId;
        userRole.roleDisplayName = role.roleDisplayName;
        userRole.roleName = role.roleName;
        userRole.isAssigned = role.isAssigned;

        return userRole;
    }
}
