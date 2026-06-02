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
  language?: string | null;
}

// Altinn 3 `enduser/connections` shapes (new actor list, behind USE_NEW_ACTOR_LIST).
export interface ConnectionEntity {
  id: string;
  name: string;
  type: string;
  variant?: string | null;
  parent?: ConnectionEntity | null;
  children?: ConnectionEntity[] | null;
  partyid?: number | null;
  organizationIdentifier?: string | null;
  dateOfBirth?: string | null;
  isDeleted: boolean;
}

export interface ConnectionRoleInfo {
  id: string;
  code?: string | null;
}

export interface Connection {
  party: ConnectionEntity;
  roles: ConnectionRoleInfo[];
  connections: Connection[];
}

export interface PaginatedResult<T> {
  links?: { next?: string | null } | null;
  data?: T[];
}
