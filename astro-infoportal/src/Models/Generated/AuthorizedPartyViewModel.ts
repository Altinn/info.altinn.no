/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { AuthorizedPartyType } from "./AuthorizedPartyType";

export interface AuthorizedPartyViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  partyUuid: string;
  name?: string;
  organizationNumber?: string;
  dateOfBirth?: string;
  partyId: number;
  type: AuthorizedPartyType;
  unitType?: string;
  isDeleted: boolean;
  onlyHierarchyElementWithNoAccess: boolean;
  authorizedResources: string[];
  authorizedRoles: string[];
  subunits: AuthorizedPartyViewModel[];
}
