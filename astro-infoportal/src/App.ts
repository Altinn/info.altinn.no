// @ts-nocheck
import React from "react";
import ReactDOM from "react-dom";
import * as ReactDOMServer from "react-dom/server";
import * as ReactDOMClient from "react-dom/client";
import * as Components from "./App.Components";
import { createRoot } from "react-dom/client";

global.ReactDOMServer = ReactDOMServer;
global.ReactDOMClient = ReactDOMClient;
global.ReactDOM = ReactDOM;
global.React = React;
global.Components = Components;
global.createRoot = createRoot;
