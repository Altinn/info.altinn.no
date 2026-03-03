/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { SchemaPageViewModel } from "./SchemaPageViewModel";

export interface ModalViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  title?: string;
  html?: RichTextAreaProps;
  schemaPage?: SchemaPageViewModel;
}
