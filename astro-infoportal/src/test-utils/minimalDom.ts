import { parse } from "node-html-parser";

/**
 * Just enough DOM for react-dom to hydrate server HTML, commit updates and
 * dispatch delegated click events, so hydration can be tested without adding
 * a DOM package. Not a general-purpose DOM: extend it when a test needs more.
 */

const XHTML = "http://www.w3.org/1999/xhtml";

type Listener = (event: ShimEvent) => void;

class ShimEvent {
  target: ShimNode | null = null;
  currentTarget: ShimNode | ShimWindow | null = null;
  eventPhase = 0;
  defaultPrevented = false;
  isTrusted = false;
  timeStamp = Date.now();
  propagationStopped = false;
  bubbles: boolean;
  cancelable: boolean;

  constructor(
    readonly type: string,
    init: { bubbles?: boolean; cancelable?: boolean } = {},
  ) {
    this.bubbles = !!init.bubbles;
    this.cancelable = !!init.cancelable;
  }

  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }
  stopPropagation() {
    this.propagationStopped = true;
  }
  stopImmediatePropagation() {
    this.propagationStopped = true;
  }
}

class ListenerTarget {
  private listeners: { type: string; fn: Listener; capture: boolean }[] = [];

  addEventListener(
    type: string,
    fn: Listener,
    options?: boolean | { capture?: boolean },
  ) {
    const capture = typeof options === "boolean" ? options : !!options?.capture;
    if (
      !this.listeners.some(
        (l) => l.type === type && l.fn === fn && l.capture === capture,
      )
    ) {
      this.listeners.push({ type, fn, capture });
    }
  }

  removeEventListener(
    type: string,
    fn: Listener,
    options?: boolean | { capture?: boolean },
  ) {
    const capture = typeof options === "boolean" ? options : !!options?.capture;
    this.listeners = this.listeners.filter(
      (l) => !(l.type === type && l.fn === fn && l.capture === capture),
    );
  }

  invoke(event: ShimEvent, capture: boolean) {
    for (const l of [...this.listeners]) {
      if (l.type === event.type && l.capture === capture) {
        l.fn.call(this, event);
        if (event.propagationStopped) return;
      }
    }
  }
}

class ShimNode extends ListenerTarget {
  parentNode: ShimNode | null = null;
  childNodes: ShimNode[] = [];

  constructor(
    readonly nodeType: number,
    readonly nodeName: string,
    public ownerDocument: ShimDocument | null,
  ) {
    super();
  }

  get firstChild() {
    return this.childNodes[0] ?? null;
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }
  get nextSibling(): ShimNode | null {
    const siblings = this.parentNode?.childNodes;
    return siblings?.[siblings.indexOf(this) + 1] ?? null;
  }
  get previousSibling(): ShimNode | null {
    const siblings = this.parentNode?.childNodes;
    return siblings?.[siblings.indexOf(this) - 1] ?? null;
  }
  get parentElement(): ShimNode | null {
    return this.parentNode?.nodeType === 1 ? this.parentNode : null;
  }

  insertBefore(node: ShimNode, ref: ShimNode | null) {
    node.parentNode?.removeChild(node);
    const index = ref ? this.childNodes.indexOf(ref) : -1;
    if (index < 0) this.childNodes.push(node);
    else this.childNodes.splice(index, 0, node);
    node.parentNode = this;
    return node;
  }
  appendChild(node: ShimNode) {
    return this.insertBefore(node, null);
  }
  removeChild(node: ShimNode) {
    this.childNodes = this.childNodes.filter((child) => child !== node);
    node.parentNode = null;
    return node;
  }
  contains(node: ShimNode | null): boolean {
    for (let n = node; n; n = n.parentNode) if (n === this) return true;
    return false;
  }

  get textContent(): string {
    return this.childNodes
      .filter((child) => child.nodeType !== 8)
      .map((child) => child.textContent)
      .join("");
  }
  set textContent(value: string) {
    for (const child of [...this.childNodes]) this.removeChild(child);
    if (value) this.appendChild(new ShimText(value, this.ownerDocument));
  }

  dispatchEvent(event: ShimEvent) {
    event.target = this;
    const path: ShimNode[] = [];
    for (let n: ShimNode | null = this; n; n = n.parentNode) path.push(n);
    const window = this.ownerDocument?.defaultView;
    const run = (
      node: ShimNode | ShimWindow,
      capture: boolean,
      phase: number,
    ) => {
      if (event.propagationStopped) return;
      event.currentTarget = node;
      event.eventPhase = phase;
      node.invoke(event, capture);
    };
    if (window) window.event = event;
    if (window) run(window, true, 1);
    for (const node of [...path].reverse().slice(0, -1)) run(node, true, 1);
    run(this, true, 2);
    run(this, false, 2);
    if (event.bubbles) {
      for (const node of path.slice(1)) run(node, false, 3);
      if (window) run(window, false, 3);
    }
    if (window) window.event = undefined;
    event.currentTarget = null;
    event.eventPhase = 0;
    return !event.defaultPrevented;
  }
}

class ShimText extends ShimNode {
  constructor(
    public data: string,
    ownerDocument: ShimDocument | null,
  ) {
    super(3, "#text", ownerDocument);
  }
  get nodeValue() {
    return this.data;
  }
  set nodeValue(value: string) {
    this.data = value;
  }
  override get textContent() {
    return this.data;
  }
  override set textContent(value: string) {
    this.data = value;
  }
}

class ShimComment extends ShimNode {
  constructor(
    public data: string,
    ownerDocument: ShimDocument | null,
  ) {
    super(8, "#comment", ownerDocument);
  }
  get nodeValue() {
    return this.data;
  }
  override get textContent() {
    return this.data;
  }
}

const toCamel = (name: string) =>
  name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

class ShimElement extends ShimNode {
  readonly namespaceURI = XHTML;
  private attributeMap = new Map<string, string>();
  readonly style = {
    setProperty: (name: string, value: string) => {
      (this.style as Record<string, unknown>)[name] = value;
    },
    removeProperty: (name: string) => {
      delete (this.style as Record<string, unknown>)[name];
    },
  };

  constructor(
    readonly localName: string,
    ownerDocument: ShimDocument | null,
  ) {
    super(1, localName.toUpperCase(), ownerDocument);
  }

  get tagName() {
    return this.nodeName;
  }
  get attributes() {
    return [...this.attributeMap].map(([name, value]) => ({ name, value }));
  }
  getAttribute(name: string) {
    return this.attributeMap.get(name.toLowerCase()) ?? null;
  }
  setAttribute(name: string, value: unknown) {
    this.attributeMap.set(name.toLowerCase(), String(value));
  }
  removeAttribute(name: string) {
    this.attributeMap.delete(name.toLowerCase());
  }
  hasAttribute(name: string) {
    return this.attributeMap.has(name.toLowerCase());
  }
  setAttributeNS(_ns: string | null, name: string, value: unknown) {
    this.setAttribute(name, value);
  }
  removeAttributeNS(_ns: string | null, name: string) {
    this.removeAttribute(name);
  }
  get id() {
    return this.getAttribute("id") ?? "";
  }
  get className() {
    return this.getAttribute("class") ?? "";
  }
  get dataset() {
    const data: Record<string, string> = {};
    for (const [name, value] of this.attributeMap) {
      if (name.startsWith("data-")) data[toCamel(name.slice(5))] = value;
    }
    return data;
  }

  querySelectorAll(tagName: string): ShimElement[] {
    const matches: ShimElement[] = [];
    const visit = (node: ShimNode) => {
      for (const child of node.childNodes) {
        if (child instanceof ShimElement) {
          if (child.localName === tagName.toLowerCase()) matches.push(child);
          visit(child);
        }
      }
    };
    visit(this);
    return matches;
  }
  querySelector(tagName: string) {
    return this.querySelectorAll(tagName)[0] ?? null;
  }

  click() {
    this.dispatchEvent(
      new ShimEvent("click", { bubbles: true, cancelable: true }),
    );
  }
  focus() {}
  blur() {}
}

class ShimWindow extends ListenerTarget {
  event: ShimEvent | undefined = undefined;
  readonly navigator = { userAgent: "minimal-dom" };
  readonly HTMLIFrameElement = class HTMLIFrameElement {};
  document!: ShimDocument;
}

class ShimDocument extends ShimNode {
  readonly documentElement: ShimElement;
  readonly body: ShimElement;

  constructor(readonly defaultView: ShimWindow) {
    super(9, "#document", null);
    this.ownerDocument = null;
    this.documentElement = this.createElement("html");
    this.body = this.createElement("body");
    this.appendChild(this.documentElement);
    this.documentElement.appendChild(this.body);
  }

  get activeElement() {
    return this.body;
  }
  createElement(tagName: string) {
    return new ShimElement(tagName.toLowerCase(), this);
  }
  createElementNS(_ns: string, tagName: string) {
    return this.createElement(tagName);
  }
  createTextNode(data: string) {
    return new ShimText(data, this);
  }
  createComment(data: string) {
    return new ShimComment(data, this);
  }
  querySelectorAll(tagName: string) {
    return this.documentElement.querySelectorAll(tagName);
  }
  querySelector(tagName: string) {
    return this.documentElement.querySelector(tagName);
  }
  getElementById(id: string): ShimElement | null {
    const visit = (node: ShimNode): ShimElement | null => {
      for (const child of node.childNodes) {
        if (child instanceof ShimElement) {
          if (child.id === id) return child;
          const found = visit(child);
          if (found) return found;
        }
      }
      return null;
    };
    return visit(this);
  }
}

/** Replaces `container`'s children with the parsed `html`. */
export const setInnerHTML = (container: ShimElement, html: string) => {
  const document = container.ownerDocument as ShimDocument;
  const build = (source: any, parent: ShimNode) => {
    for (const child of source.childNodes) {
      if (child.nodeType === 3) {
        parent.appendChild(document.createTextNode(child.text));
      } else if (child.nodeType === 8) {
        parent.appendChild(document.createComment(child.rawText));
      } else if (child.nodeType === 1) {
        const element = document.createElement(child.rawTagName);
        for (const [name, value] of Object.entries(
          child.attributes as Record<string, string>,
        )) {
          element.setAttribute(name, value);
        }
        parent.appendChild(element);
        build(child, element);
      }
    }
  };
  container.textContent = "";
  build(parse(html, { comment: true }), container);
};

/**
 * Installs `window` and `document` globals for the duration of a test and
 * returns a function that removes them again.
 */
export const installMinimalDom = () => {
  const window = new ShimWindow();
  const document = new ShimDocument(window);
  window.document = document;
  const globals = globalThis as Record<string, unknown>;
  const previous = { window: globals.window, document: globals.document };
  globals.window = window;
  globals.document = document;
  return {
    window,
    document,
    uninstall: () => {
      globals.window = previous.window;
      globals.document = previous.document;
    },
  };
};

export type { ShimElement };
