import { html, css, LitElement, nothing } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";

const REPORT_URL = "/umbraco/management/api/v1/form-changes/report";
const DEFAULT_RANGE_DAYS = 14;

const SECTIONS = [
  { key: "newPages", headline: "Nye skjemasider", empty: "Ingen nye skjemasider i perioden." },
  { key: "changedPages", headline: "Endrede skjemasider", empty: "Ingen endrede skjemasider i perioden." },
  { key: "unpublishedPages", headline: "Avpubliserte skjemasider", empty: "Ingen avpubliserte skjemasider i perioden." },
  { key: "trashedPages", headline: "Forkastede skjemasider", empty: "Ingen forkastede skjemasider i perioden." },
];

const dateFormat = new Intl.DateTimeFormat("nb-NO", {
  timeZone: "Europe/Oslo",
  dateStyle: "short",
  timeStyle: "short",
});

// yyyy-MM-dd in the editor's local time zone, as <input type="date"> expects.
function toInputDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

class AltinnFormChangesElement extends UmbElementMixin(LitElement) {
  static properties = {
    _report: { state: true },
    _loading: { state: true },
    _error: { state: true },
  };

  constructor() {
    super();
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - DEFAULT_RANGE_DAYS);
    this._selection = { fromDate: toInputDate(from), toDate: toInputDate(today) };
    this._report = null;
    this._loading = false;
    this._error = null;
    this._auth = null;
    this.consumeContext(UMB_AUTH_CONTEXT, (ctx) => {
      this._auth = ctx;
      if (!this._report && !this._loading) this.#loadReport();
    });
  }

  async #authHeader() {
    const token = await this._auth?.getLatestToken?.();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  #onFieldChange(field, e) {
    this._selection = { ...this._selection, [field]: e.target.value };
  }

  async #loadReport() {
    this._loading = true;
    this._error = null;
    try {
      const headers = await this.#authHeader();
      const params = new URLSearchParams();
      const { fromDate, toDate } = this._selection;
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`${REPORT_URL}?${params.toString()}`, { headers });
      if (!res.ok) {
        let message = `Kunne ikke hente endringer (status ${res.status}).`;
        try {
          const body = await res.json();
          message = body?.detail ?? body?.title ?? message;
        } catch {
          // Non-JSON error body — keep the status message.
        }
        this._error = message;
        return;
      }
      this._report = await res.json();
    } catch (e) {
      this._error = e?.message ?? "Kunne ikke hente endringer.";
    } finally {
      this._loading = false;
    }
  }

  #renderSection({ key, headline, empty }) {
    const rows = this._report?.[key] ?? [];
    return html`
      <uui-box headline=${`${headline} (${rows.length})`}>
        ${rows.length === 0
          ? html`<p><em>${empty}</em></p>`
          : html`
              <uui-table>
                <uui-table-head>
                  <uui-table-head-cell>Tjenesteeier</uui-table-head-cell>
                  <uui-table-head-cell>Skjemaside</uui-table-head-cell>
                  <uui-table-head-cell>Språkvariant</uui-table-head-cell>
                  <uui-table-head-cell>Dato</uui-table-head-cell>
                </uui-table-head>
                ${rows.map(
                  (row) => html`
                    <uui-table-row>
                      <uui-table-cell>${row.serviceOwner}</uui-table-cell>
                      <uui-table-cell>
                        <a href=${`/umbraco/section/content/workspace/document/edit/${row.key}`}>${row.title}</a>
                      </uui-table-cell>
                      <uui-table-cell>${row.language}</uui-table-cell>
                      <uui-table-cell>${dateFormat.format(new Date(row.date))}</uui-table-cell>
                    </uui-table-row>
                  `,
                )}
              </uui-table>
            `}
      </uui-box>
    `;
  }

  render() {
    return html`
      <uui-box headline="Skjemaendringer">
        <p>
          Oversikt over skjemasider som er publisert for første gang, endret, avpublisert eller forkastet
          (lagt i papirkurven) i perioden. Én rad per skjemaside og språkvariant, nyeste først.
        </p>
        <p class="note">
          Skjemasider som er slettet permanent fra papirkurven vises ikke. En ny skjemaside vises bare
          under «Nye», selv om den er endret senere i samme periode.
        </p>

        <div class="filters">
          <label for="fromDate">Fra dato</label>
          <input
            id="fromDate"
            type="date"
            .value=${this._selection.fromDate}
            @change=${(e) => this.#onFieldChange("fromDate", e)} />

          <label for="toDate">Til dato</label>
          <input
            id="toDate"
            type="date"
            .value=${this._selection.toDate}
            @change=${(e) => this.#onFieldChange("toDate", e)} />

          <uui-button
            look="primary"
            color="default"
            ?disabled=${this._loading}
            @click=${() => this.#loadReport()}>
            ${this._loading ? "Oppdaterer…" : "Oppdater"}
          </uui-button>
        </div>

        ${this._error
          ? html`<uui-toast-notification color="danger" open>
              <uui-toast-notification-layout headline="Feil">${this._error}</uui-toast-notification-layout>
            </uui-toast-notification>`
          : nothing}
      </uui-box>

      ${this._report ? SECTIONS.map((section) => this.#renderSection(section)) : nothing}
    `;
  }

  static styles = css`
    :host { display: block; padding: 24px; }
    uui-box { display: block; margin-bottom: 24px; }
    p { margin: 0 0 16px; }
    .note { color: var(--uui-color-text-alt, #68676b); }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 16px;
      align-items: center;
    }
    .filters label { font-weight: 600; }
    .filters input {
      padding: 6px 8px;
      border: 1px solid var(--uui-color-border, #d8d7d9);
      border-radius: 3px;
      font: inherit;
    }
  `;
}

customElements.define("altinn-form-changes", AltinnFormChangesElement);
export default AltinnFormChangesElement;
