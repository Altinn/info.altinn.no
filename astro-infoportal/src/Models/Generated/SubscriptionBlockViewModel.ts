/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";

export interface SubscriptionBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  subscriptionType: number;
  title?: string;
  ingress?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  sendButton?: string;
  confirmationText?: string;
  undoText?: string;
  confirmationUndoText?: string;
  invalidMissingEmail?: string;
  invalidEmail?: string;
}
