import { AfterViewInit, Component, Input } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { ProfileServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'friend-profile-picture',
    template:
    `<img [src]="profilePicture" style="width: 32px;" class="{{cssClass}}" alt="...">`
})
export class FriendProfilePictureComponent implements AfterViewInit {

    @Input() userId: number;
    @Input() tenantId: number;
    @Input() cssClass = 'media-object';
    profilePicture = AppConsts.appBaseUrl + '/assets/common/images/nopicture.png';

    constructor(
        private _profileService: ProfileServiceProxy
    ) {
    }

    ngAfterViewInit(): void {
        this.setProfileImage();
    }

    private setProfileImage(): void {

        if (!this.tenantId) {
            this.tenantId = undefined;
        }

        if(this.userId > 0){
            this._profileService.getProfilePictureByUserGet(this.userId).subscribe((result) => {
                if (result && result.profilePicture) {
                    this.profilePicture = 'data:image/jpeg;base64,' + result.profilePicture;
                }
            });
        }
    }
}
