import { html, css, LitElement } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";

const ENDPOINT = "/umbraco/management/api/v1/legacy-links";
const STATUS_URL = `${ENDPOINT}/status`;
const POLL_INTERVAL_MS = 2000;

class AltinnLegacyLinksElement extends UmbElementMixin(LitElement) {
  static properties = {
    _status: { state: true },
    _busy: { state: true },
    _error: { state: true },
  };

  constructor() {
    super();
    this._status = null;
    this._busy = false;
    this._error = null;
    this._timer = null;
    this._auth = null;
    this._notifications = null;
    this.consumeContext(UMB_AUTH_CONTEXT, (ctx) => {
      this._auth = ctx;
    });
    this.consumeContext(UMB_NOTIFICATION_CONTEXT, (ctx) => {
      this._notifications = ctx;
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.#fetchStatus();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopPolling();
  }

  async #authHeader() {
    const token = await this._auth?.getLatestToken?.();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async #fetchStatus() {
    try {
      const headers = await this.#authHeader();
      const res = await fetch(STATUS_URL, { headers });
      if (!res.ok) {
        this._error = `Status ${res.status}: ${res.statusText}`;
        return;
      }
      const data = await res.json();
      this._error = null;
      this._status = data;
      this._busy = !!data?.isRunning;
      if (this._busy) this.#startPolling();
      else this.#stopPolling();
    } catch (e) {
      this._error = e?.message ?? "Failed to load status";
    }
  }

  #startPolling() {
    if (this._timer) return;
    this._timer = window.setInterval(() => this.#fetchStatus(), POLL_INTERVAL_MS);
  }

  #stopPolling() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  async #start(dryRun) {
    if (!dryRun && !confirm("This will replace legacy .aspx links and republish all affected pages. Continue?")) {
      return;
    }

    this._busy = true;
    this._error = null;

    try {
      const headers = await this.#authHeader();
      const res = await fetch(`${ENDPOINT}?dryRun=${dryRun}`, { method: "POST", headers });
      if (res.status === 409) {
        this._notifications?.peek("warning", {
          data: { headline: "Already running", message: "A legacy link job is already in progress." },
        });
        await this.#fetchStatus();
        this.#startPolling();
        return;
      }
      if (!res.ok) {
        this._busy = false;
        let msg = `Status ${res.status}`;
        try {
          const body = await res.json();
          msg = body?.detail ?? body?.title ?? msg;
        } catch {}
        this._notifications?.peek("danger", {
          data: { headline: "Legacy link job failed to start", message: msg },
        });
        return;
      }
      this._notifications?.peek("positive", { data: { message: dryRun ? "Dry run started" : "Legacy link replacement started" } });
      await this.#fetchStatus();
      this.#startPolling();
    } catch (e) {
      this._busy = false;
      this._notifications?.peek("danger", {
        data: { headline: "Legacy link job failed to start", message: e?.message ?? "Unknown error" },
      });
    }
  }

  render() {
    const s = this._status;
    const pct = s?.percentComplete ?? 0;
    const progressFraction = pct / 100;
    return html`
      <uui-box headline="Replace legacy links">
        <p>
          Replaces internal links from the old CMS (<code>~/link/…aspx</code>) with Umbraco
          internal links in all published pages, and republishes the changed pages.
          Pages with unpublished changes are skipped. Run a dry run first to see what will change.
        </p>

        ${this._error
          ? html`<uui-toast-notification color="danger">${this._error}</uui-toast-notification>`
          : ""}

        ${s
          ? html`
              <dl class="status">
                <dt>Status</dt><dd>${s.status ?? "—"}${s.dryRun ? " (dry run)" : ""}</dd>
                <dt>Processed</dt><dd>${s.processedItems ?? 0} / ${s.totalItems ?? 0}</dd>
                <dt>Progress</dt><dd>${pct}%</dd>
                <dt>Changed pages</dt><dd>${s.changedPages ?? 0}</dd>
                <dt>Skipped pages</dt><dd>${s.skippedPages ?? 0}</dd>
                <dt>Replaced links</dt><dd>${s.replacedLinks ?? 0}</dd>
                <dt>Unresolved links</dt><dd>${s.unresolvedLinks ?? 0}</dd>
              </dl>
              ${this._busy
                ? html`<uui-loader-bar .progress=${progressFraction}></uui-loader-bar>`
                : ""}
            `
          : html`<p><em>Loading status…</em></p>`}

        <uui-button
          look="secondary"
          ?disabled=${this._busy}
          @click=${() => this.#start(true)}>
          Dry run
        </uui-button>
        <uui-button
          look="primary"
          color="default"
          ?disabled=${this._busy}
          @click=${() => this.#start(false)}>
          ${this._busy ? "Running…" : "Replace links"}
        </uui-button>

        ${s?.log?.length
          ? html`<pre class="log">${s.log.join("\n")}</pre>`
          : ""}
      </uui-box>
    `;
  }

  static styles = css`
    :host { display: block; padding: 24px; }
    uui-box { display: block; max-width: 960px; }
    p { margin: 0 0 16px; }
    dl.status {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
      margin: 16px 0;
    }
    dl.status dt { font-weight: 600; }
    dl.status dd { margin: 0; }
    uui-loader-bar { display: block; margin-bottom: 24px; }
    uui-button { margin-top: 16px; }
    pre.log {
      margin-top: 24px;
      max-height: 480px;
      overflow: auto;
      font-size: 12px;
      white-space: pre-wrap;
    }
  `;
}

customElements.define("altinn-legacy-links", AltinnLegacyLinksElement);
export default AltinnLegacyLinksElement;
