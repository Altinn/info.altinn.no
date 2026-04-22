export interface AuthorizedParty {
  partyUuid: string;
  name?: string | null;
  organizationNumber?: string | null;
  dateOfBirth?: string | null;
  partyId: number;
  type: "None" | "Person" | "Organization" | "SelfIdentified" | number;
  unitType?: string | null;
  isDeleted: boolean;
  onlyHierarchyElementWithNoAccess: boolean;
  authorizedResources: string[];
  authorizedRoles: string[];
  subunits: AuthorizedParty[];
}

export interface ProfileGroup {
  name?: string | null;
  isFavorite: boolean;
  parties: string[];
}

export interface ProfileSettingPreference {
  language?: string | null;
  preSelectedPartyId?: number | null;
  doNotPromptForParty?: boolean | null;
  preselectedPartyUuid?: string | null;
  showClientUnits?: boolean | null;
  shouldShowSubEntities: boolean;
  shouldShowDeletedEntities?: boolean | null;
}

export interface PartyDto {
  partyId: number;
  partyUuid?: string | null;
  partyTypeName: string | number;
  orgNumber?: string | null;
  unitType?: string | null;
  name?: string | null;
  isDeleted: boolean;
  personDateOfBirth?: string | null;
  onlyHierarchyElementWithNoAccess: boolean;
}

export interface UserProfile {
  userId: number;
  userUuid?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  partyId: number;
  party?: PartyDto | null;
  userType: string | number;
  profileSettingPreference?: ProfileSettingPreference | null;
  isReserved: boolean;
}

export interface CurrentUserResponse {
  selfAccountUuid: string | null;
  currentAccountUuid: string | null;
  showDeletedEntities?: boolean | null;
}
