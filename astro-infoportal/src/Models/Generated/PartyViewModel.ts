/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { PartyType } from "./PartyType";
import { PersonViewModel } from "./PersonViewModel";
import { OrganizationViewModel } from "./OrganizationViewModel";

export interface PartyViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  partyId: number;
  partyUuid: string;
  partyTypeName: PartyType;
  orgNumber?: string;
  ssn?: string;
  unitType?: string;
  name?: string;
  isDeleted: boolean;
  personDateOfBirth?: string;
  onlyHierarchyElementWithNoAccess: boolean;
  person?: PersonViewModel;
  organization?: OrganizationViewModel;
  childParties: PartyViewModel[];
}
