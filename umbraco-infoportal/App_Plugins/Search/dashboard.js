import { html, css, LitElement } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";

const REINDEX_URL = "/umbraco/management/api/v1/search/reindex";
const STATUS_URL = `${REINDEX_URL}/status`;
const POLL_INTERVAL_MS = 2000;

class AltinnSearchReindexElement extends UmbElementMixin(LitElement) {
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
      console.debug("[reindex dashboard] status", data);
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

  async #onReindexClick() {
    if (!confirm("This will drop the current search index and rebuild it from all published content. Continue?")) {
      return;
    }
    this._busy = true;
    this._error = null;
    try {
      const headers = await this.#authHeader();
      const res = await fetch(REINDEX_URL, { method: "POST", headers });
      if (res.status === 409) {
        this._notifications?.peek("warning", {
          data: { headline: "Already running", message: "A reindex job is already in progress." },
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
          data: { headline: "Reindex failed to start", message: msg },
        });
        return;
      }
      this._notifications?.peek("positive", { data: { message: "Reindex started" } });
      await this.#fetchStatus();
      this.#startPolling();
    } catch (e) {
      this._busy = false;
      this._notifications?.peek("danger", {
        data: { headline: "Reindex failed to start", message: e?.message ?? "Unknown error" },
      });
    }
  }

  render() {
    const s = this._status;
    const pct = s?.percentComplete ?? 0;
    const progressFraction = pct / 100;
    return html`
      <uui-box headline="Elasticsearch reindex">
        <p>
          Rebuilds the public search index across all three languages (nb, nn, en).
          The current index is dropped and replaced — search results may be incomplete during the run.
        </p>

        ${this._error
          ? html`<uui-toast-notification color="danger">${this._error}</uui-toast-notification>`
          : ""}

        ${s
          ? html`
              <dl class="status">
                <dt>Status</dt><dd>${s.status ?? "—"}</dd>
                <dt>Processed</dt><dd>${s.processedItems ?? 0} / ${s.totalItems ?? 0}</dd>
                <dt>Progress</dt><dd>${pct}%</dd>
              </dl>
              ${this._busy
                ? html`<uui-loader-bar .progress=${progressFraction}></uui-loader-bar>`
                : ""}
            `
          : html`<p><em>Loading status…</em></p>`}

        <uui-button
          look="primary"
          color="default"
          ?disabled=${this._busy}
          @click=${this.#onReindexClick}>
          ${this._busy ? "Reindex running…" : "Start reindex"}
        </uui-button>
      </uui-box>
    `;
  }

  static styles = css`
    :host { display: block; padding: 24px; }
    uui-box { display: block; max-width: 720px; }
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
  `;
}

customElements.define("altinn-search-reindex", AltinnSearchReindexElement);
export default AltinnSearchReindexElement;
