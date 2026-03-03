/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";

export interface PersonViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  ssn?: string;
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  telephoneNumber?: string;
  mobileNumber?: string;
  mailingAddress?: string;
  mailingPostalCode?: string;
  mailingPostalCity?: string;
  addressMunicipalNumber?: string;
  addressMunicipalName?: string;
  addressStreetName?: string;
  addressHouseNumber?: string;
  addressHouseLetter?: string;
  addressPostalCode?: string;
  addressCity?: string;
  dateOfDeath: Date;
}
