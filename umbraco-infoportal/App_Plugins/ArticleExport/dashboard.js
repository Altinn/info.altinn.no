import { html, css, LitElement, nothing } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";

const BASE_URL = "/umbraco/management/api/v1/article-export";
const FILTERS_URL = `${BASE_URL}/filters`;
const EXPORT_URL = `${BASE_URL}/export`;

class AltinnArticleExportElement extends UmbElementMixin(LitElement) {
  static properties = {
    _providers: { state: true },
    _authors: { state: true },
    _languages: { state: true },
    _loading: { state: true },
    _busy: { state: true },
    _error: { state: true },
  };

  constructor() {
    super();
    this._providers = [];
    this._authors = [];
    this._languages = [];
    this._loading = true;
    this._busy = false;
    this._error = null;
    this._auth = null;
    this._notifications = null;
    this._selection = { language: "", provider: "", author: "", fromDate: "", toDate: "" };
    this.consumeContext(UMB_AUTH_CONTEXT, (ctx) => {
      this._auth = ctx;
    });
    this.consumeContext(UMB_NOTIFICATION_CONTEXT, (ctx) => {
      this._notifications = ctx;
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.#loadFilters();
  }

  async #authHeader() {
    const token = await this._auth?.getLatestToken?.();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async #loadFilters() {
    this._loading = true;
    this._error = null;
    try {
      const headers = await this.#authHeader();
      const url = this._selection.language
        ? `${FILTERS_URL}?language=${encodeURIComponent(this._selection.language)}`
        : FILTERS_URL;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        this._error = `Kunne ikke hente filtervalg (status ${res.status}).`;
        return;
      }
      const data = await res.json();
      this._providers = data?.providers ?? [];
      this._authors = data?.authors ?? [];
      this._languages = data?.languages ?? [];
    } catch (e) {
      this._error = e?.message ?? "Kunne ikke hente filtervalg.";
    } finally {
      this._loading = false;
    }
  }

  #onLanguageChange(e) {
    this._selection = { ...this._selection, language: e.target.value };
  }

  #onFieldChange(field, e) {
    this._selection = { ...this._selection, [field]: e.target.value };
  }

  async #onGenerate() {
    this._busy = true;
    this._error = null;
    try {
      const headers = await this.#authHeader();
      const params = new URLSearchParams();
      const { language, provider, author, fromDate, toDate } = this._selection;
      if (language) params.set("language", language);
      if (provider) params.set("provider", provider);
      if (author) params.set("author", author);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`${EXPORT_URL}?${params.toString()}`, { headers });
      if (!res.ok) {
        let message = `Status ${res.status}`;
        try {
          const body = await res.json();
          message = body?.detail ?? body?.title ?? message;
        } catch {
          // Non-JSON error body — keep the status message.
        }
        this._notifications?.peek("danger", {
          data: { headline: "Eksport feilet", message },
        });
        return;
      }

      const blob = await res.blob();
      const filename = this.#filenameFromResponse(res) ?? "article-export.docx";
      this.#triggerDownload(blob, filename);
      this._notifications?.peek("positive", { data: { message: "Dokument generert" } });
    } catch (e) {
      this._notifications?.peek("danger", {
        data: { headline: "Eksport feilet", message: e?.message ?? "Ukjent feil" },
      });
    } finally {
      this._busy = false;
    }
  }

  #filenameFromResponse(res) {
    const header = res.headers.get("content-disposition");
    if (!header) return null;
    const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8) {
      try {
        return decodeURIComponent(utf8[1]);
      } catch {
        // Fall through to the plain filename form.
      }
    }
    const plain = header.match(/filename="?([^";]+)"?/i);
    return plain ? plain[1] : null;
  }

  #triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    // Do NOT attach the anchor to the document: the Umbraco backoffice has a global
    // click/router interceptor that would try to pushState() to the blob: URL and throw a
    // SecurityError. A detached anchor still triggers the download but is invisible to it.
    anchor.click();
    // Revoke after a delay so the download has time to start (early revoke can cancel it).
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  render() {
    return html`
      <uui-box headline="Artikkel eksport">
        <p>Generer et Word-dokument med artikler, skjema og tilskudd, filtrert på tjenesteeier, koordinator, språk og dato.</p>

        ${this._error
          ? html`<uui-toast-notification color="danger" open>
              <uui-toast-notification-layout headline="Feil">${this._error}</uui-toast-notification-layout>
            </uui-toast-notification>`
          : nothing}

        ${this._loading
          ? html`<p><em>Laster filtervalg…</em></p>`
          : html`
              <div class="grid">
                <label for="language">Språk</label>
                <select id="language" @change=${(e) => this.#onLanguageChange(e)}>
                  ${this._languages.map(
                    (l) => html`<option value=${l.isoCode}>${l.name}</option>`,
                  )}
                </select>

                <label for="provider">Tjenesteeier</label>
                <select id="provider" @change=${(e) => this.#onFieldChange("provider", e)}>
                  <option value="">Alle</option>
                  ${this._providers.map((p) => html`<option value=${p}>${p}</option>`)}
                </select>

                <label for="author">Koordinator</label>
                <select id="author" @change=${(e) => this.#onFieldChange("author", e)}>
                  <option value="">Alle</option>
                  ${this._authors.map((a) => html`<option value=${a}>${a}</option>`)}
                </select>

                <label for="fromDate">Fra dato</label>
                <input id="fromDate" type="date" @change=${(e) => this.#onFieldChange("fromDate", e)} />

                <label for="toDate">Til dato</label>
                <input id="toDate" type="date" @change=${(e) => this.#onFieldChange("toDate", e)} />
              </div>

              <uui-button
                look="primary"
                color="default"
                ?disabled=${this._busy}
                @click=${() => this.#onGenerate()}>
                ${this._busy ? "Genererer…" : "Generer"}
              </uui-button>
            `}
      </uui-box>
    `;
  }

  static styles = css`
    :host { display: block; padding: 24px; }
    uui-box { display: block; max-width: 720px; }
    p { margin: 0 0 16px; }
    .grid {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 12px 16px;
      align-items: center;
      margin-bottom: 24px;
      max-width: 480px;
    }
    .grid label { font-weight: 600; }
    .grid select,
    .grid input {
      padding: 6px 8px;
      border: 1px solid var(--uui-color-border, #d8d7d9);
      border-radius: 3px;
      font: inherit;
    }
  `;
}

customElements.define("altinn-article-export", AltinnArticleExportElement);
export default AltinnArticleExportElement;
