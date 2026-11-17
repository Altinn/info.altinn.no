import { html, css, LitElement, nothing } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { UmbPropertyEditorConfigCollection } from "@umbraco-cms/backoffice/property-editor";
import "@umbraco-cms/backoffice/tiptap";

const API_URL = "/umbraco/management/api/v1/operational-messages";

// A trimmed-down version of the "Richtext editor" data type: plain formatting and links,
// no media or blocks, since a driftsmelding is short text.
const TIPTAP_CONFIG = new UmbPropertyEditorConfigCollection([
  {
    alias: "extensions",
    value: [
      "Umb.Tiptap.RichTextEssentials",
      "Umb.Tiptap.Bold",
      "Umb.Tiptap.Italic",
      "Umb.Tiptap.Underline",
      "Umb.Tiptap.Link",
      "Umb.Tiptap.BulletList",
      "Umb.Tiptap.OrderedList",
    ],
  },
  {
    alias: "toolbar",
    value: [
      [
        ["Umb.Tiptap.Toolbar.Bold", "Umb.Tiptap.Toolbar.Italic", "Umb.Tiptap.Toolbar.Underline"],
        ["Umb.Tiptap.Toolbar.BulletList", "Umb.Tiptap.Toolbar.OrderedList"],
        ["Umb.Tiptap.Toolbar.Link", "Umb.Tiptap.Toolbar.Unlink"],
      ],
    ],
  },
]);

function isBlankMarkup(markup) {
  if (!markup) return true;
  const doc = new DOMParser().parseFromString(markup, "text/html");
  return (doc.body.textContent ?? "").trim() === "";
}

class AltinnNewOperationalMessageElement extends UmbElementMixin(LitElement) {
  static properties = {
    _title: { state: true },
    _description: { state: true },
    _color: { state: true },
    _colors: { state: true },
    _pendingStartPageChanges: { state: true },
    _confirmPending: { state: true },
    _submitting: { state: true },
    _error: { state: true },
    _receipt: { state: true },
    _showValidation: { state: true },
  };

  constructor() {
    super();
    this.#resetForm();
    this._colors = [];
    this._pendingStartPageChanges = false;
    this._submitting = false;
    this._error = null;
    this._receipt = null;
    this._auth = null;
    this.consumeContext(UMB_AUTH_CONTEXT, (ctx) => {
      this._auth = ctx;
      this.#loadSetup();
    });
  }

  #resetForm() {
    this._title = "";
    this._description = "";
    this._color = "";
    this._confirmPending = false;
    this._showValidation = false;
  }

  async #authHeader() {
    const token = await this._auth?.getLatestToken?.();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async #errorMessage(res, fallback) {
    try {
      const body = await res.json();
      return body?.detail ?? body?.title ?? fallback;
    } catch {
      return fallback;
    }
  }

  async #loadSetup() {
    try {
      const res = await fetch(`${API_URL}/setup`, { headers: await this.#authHeader() });
      if (!res.ok) {
        this._error = await this.#errorMessage(res, `Kunne ikke laste skjemaet (status ${res.status}).`);
        return;
      }
      const setup = await res.json();
      this._colors = setup.colors ?? [];
      this._pendingStartPageChanges = !!setup.startPageHasPendingChanges;
      if (!this._color && this._colors.length > 0) this._color = this._colors[0];
    } catch (e) {
      this._error = e?.message ?? "Kunne ikke laste skjemaet.";
    }
  }

  get #missingTitle() {
    return this._title.trim() === "";
  }

  get #missingDescription() {
    return isBlankMarkup(this._description);
  }

  get #canSubmit() {
    return (
      !this._submitting &&
      !this.#missingTitle &&
      !this.#missingDescription &&
      !!this._color &&
      (!this._pendingStartPageChanges || this._confirmPending)
    );
  }

  async #submit() {
    this._showValidation = true;
    if (!this.#canSubmit) return;

    this._submitting = true;
    this._error = null;
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await this.#authHeader()) },
        body: JSON.stringify({
          title: this._title.trim(),
          description: this._description,
          color: this._color,
          publishPendingStartPageChanges: this._confirmPending,
        }),
      });

      if (res.status === 409) {
        // The start page got unpublished changes after the form was loaded.
        this._pendingStartPageChanges = true;
        this._confirmPending = false;
      }

      if (!res.ok) {
        this._error = await this.#errorMessage(res, `Kunne ikke legge ut driftsmeldingen (status ${res.status}).`);
        return;
      }

      this._receipt = await res.json();
      this.#resetForm();
      this._pendingStartPageChanges = false;
    } catch (err) {
      this._error = err?.message ?? "Kunne ikke legge ut driftsmeldingen.";
    } finally {
      this._submitting = false;
    }
  }

  #newMessage() {
    this._receipt = null;
    this._error = null;
    this.#resetForm();
    if (this._colors.length > 0) this._color = this._colors[0];
    this.#loadSetup();
  }

  #renderReceipt() {
    const r = this._receipt;
    return html`
      <uui-box headline="Driftsmeldingen er lagt ut">
        <p>
          «${r.title}» er publisert på bokmål og ligger nå øverst i driftsmeldingsområdet på startsiden.
          Startsiden er publisert på nytt (${r.startPageCultures.join(", ")}).
        </p>
        <p class="note">
          Det kan ta noen minutter før meldingen vises på altinn.no. Oversettelse, endring av tekst og fjerning fra
          forsiden gjør du som før, i innholdstreet.
        </p>
        <div class="actions">
          <uui-button look="primary" href=${`/umbraco/section/content/workspace/document/edit/${r.key}`}>
            Åpne driftsmeldingen
          </uui-button>
          <uui-button look="secondary" href=${`/umbraco/section/content/workspace/document/edit/${r.startPageKey}`}>
            Åpne startsiden
          </uui-button>
          <uui-button look="outline" @click=${() => this.#newMessage()}>Ny driftsmelding</uui-button>
        </div>
      </uui-box>
    `;
  }

  #renderForm() {
    const v = this._showValidation;
    return html`
      <uui-box headline="Ny driftsmelding">
        <p>
          Oppretter en driftsmelding på bokmål, publiserer den og legger den øverst i «Driftsmelding- og
          varselsområde» på startsiden. Startsiden publiseres deretter på nytt for alle språk.
        </p>
        <p class="note">
          Oversettelse, endring av tekst og fjerning fra forsiden gjør du som før, i innholdstreet.
        </p>

        <div class="form">
          <div class="field">
            <label for="title">Tittel <span class="required">*</span></label>
            <uui-input
              id="title"
              label="Tittel"
              maxlength="255"
              .value=${this._title}
              ?error=${v && this.#missingTitle}
              @input=${(e) => (this._title = e.target.value)}></uui-input>
            ${v && this.#missingTitle ? html`<div class="error">Tittel må fylles ut.</div>` : nothing}
          </div>

          <div class="field">
            <label for="color">Kritikalitet (farge) <span class="required">*</span></label>
            <select
              id="color"
              .value=${this._color}
              @change=${(e) => (this._color = e.target.value)}>
              ${this._colors.map(
                (c) => html`<option value=${c} ?selected=${c === this._color}>${c}</option>`,
              )}
            </select>
          </div>

          <div class="field">
            <label>Beskrivelse <span class="required">*</span></label>
            <umb-input-tiptap
              .configuration=${TIPTAP_CONFIG}
              .value=${this._description}
              @change=${(e) => (this._description = e.target.value)}></umb-input-tiptap>
            ${v && this.#missingDescription ? html`<div class="error">Beskrivelse må fylles ut.</div>` : nothing}
          </div>

          ${this._pendingStartPageChanges
            ? html`
                <div class="warning">
                  <strong>Startsiden har endringer som ikke er publisert.</strong>
                  Når driftsmeldingen legges ut, publiseres startsiden på nytt, og disse endringene blir publisert
                  samtidig.
                  <uui-checkbox
                    label="Jeg forstår at startsidens upubliserte endringer også blir publisert"
                    .checked=${this._confirmPending}
                    @change=${(e) => (this._confirmPending = e.target.checked)}>
                    Jeg forstår at startsidens upubliserte endringer også blir publisert
                  </uui-checkbox>
                </div>
              `
            : nothing}

          <div class="actions">
            <uui-button
              look="primary"
              color="positive"
              label="Legg ut"
              ?disabled=${this._submitting || (this._pendingStartPageChanges && !this._confirmPending)}
              .state=${this._submitting ? "waiting" : undefined}
              @click=${() => this.#submit()}>
              Legg ut
            </uui-button>
          </div>
        </div>
      </uui-box>
    `;
  }

  render() {
    return html`
      ${this._error
        ? html`<uui-box class="error-box" headline="Feil"><p>${this._error}</p></uui-box>`
        : nothing}
      ${this._receipt ? this.#renderReceipt() : this.#renderForm()}
    `;
  }

  static styles = css`
    :host { display: block; padding: 24px; max-width: 900px; }
    uui-box { display: block; margin-bottom: 24px; }
    p { margin: 0 0 16px; }
    .note { color: var(--uui-color-text-alt, #68676b); }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .field label { font-weight: 600; }
    .required { color: var(--uui-color-danger, #d42054); }
    .error { color: var(--uui-color-danger, #d42054); font-size: 0.9em; }
    uui-input { width: 100%; }
    select {
      max-width: 240px;
      padding: 6px 8px;
      border: 1px solid var(--uui-color-border, #d8d7d9);
      border-radius: 3px;
      font: inherit;
      background: var(--uui-color-surface, #fff);
      color: inherit;
    }
    umb-input-tiptap { min-height: 200px; }
    .warning {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      border-left: 4px solid var(--uui-color-warning, #fbd142);
      background: var(--uui-color-warning-standalone, #fff8e1);
      color: var(--uui-color-warning-contrast, #000);
    }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; }
    .error-box { --uui-box-header-color: var(--uui-color-danger, #d42054); }
  `;
}

customElements.define("altinn-new-operational-message", AltinnNewOperationalMessageElement);
export default AltinnNewOperationalMessageElement;
