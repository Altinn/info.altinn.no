import './SubscriptionBlock.scss';

const SubscriptionBlock = ({
  subscriptionType,
  title,
  ingress,
  emailLabel,
  emailPlaceholder,
  sendButton,
  confirmationText,
  undoText,
  confirmationUndoText,
  invalidMissingEmail,
  invalidEmail,
}: any) => {
  const subscriptionTypeStr =
    subscriptionType === 1
      ? 'newsletter'
      : subscriptionType === 2
        ? 'operationalmessage'
        : 'none';

  return (
    <div className="col-sm-12 col-md-10 col-lg-8 offset-md-1 offset-lg-2 pb-3">
      <div className="a-card a-cardImage mt-4">
        <img
          src="/assets/img/illustration/illustrasjon_nyhetsbrev.svg"
          alt=""
        />
        <div className="a-cardImage-text">
          <h2>{title || ''}</h2>
          <p>{ingress || ''}</p>

          <form
            data-toggle="validator"
            className="a-js-subscribe"
            data-disable="true"
            id="subscribtion"
            noValidate
          >
            <input
              type="hidden"
              id="subscription-type"
              value={subscriptionTypeStr}
            />
            <div className="row">
              <div className="col-8">
                <div className="form-group a-form-group">
                  <label
                    className="a-form-label sr-only"
                    htmlFor="text-input-epost"
                  >
                    {emailLabel || ''}:{' '}
                  </label>

                  <div className="a-form-group-items input-group">
                    <span className="input-group-prepend d-none d-md-block">
                      <i
                        className="ai ai-closedmessage"
                        aria-hidden="true"
                      />
                    </span>

                    <input
                      className="form-control a-hasIcon"
                      type="text"
                      placeholder={emailPlaceholder || ''}
                      name="email-field"
                      data-val="true"
                      id="text-input-epost"
                      required
                      data-val-required={invalidMissingEmail || ''}
                      data-val-regex={invalidEmail || ''}
                      data-val-regex-pattern="(('[^']+')|(([a-zA-Z0-9!#$%&amp;'*+-=?^_`{|}~])+(.([a-zA-Z0-9!#$%&amp;'*+-=?^_`{|}~])+)*))@@((((([a-zA-Z0-9æøåÆØÅ]([a-zA-Z0-9-æøåÆØÅ]{0,61})[a-zA-Z0-9æøåÆØÅ].)|[a-zA-Z0-9æøåÆØÅ].){1,9})([a-zA-Z]{2,14}))|((d{1,3}).(d{1,3}).(d{1,3}).(d{1,3})))"
                      aria-required="true"
                      aria-describedby="text-input-epost-error"
                      aria-invalid="true"
                    />
                  </div>
                  <div
                    className="a-message a-message-error"
                    data-valmsg-for="email-field"
                    data-valmsg-replace="true"
                  />
                </div>
              </div>
              <div className="col-4">
                <button
                  type="button"
                  className="a-btn disabled"
                  id="a-js-subscribtion-submit"
                  disabled
                >
                  {sendButton || ''}
                </button>
              </div>
            </div>
            <p
              className="a-fontSizeXS a-js-finishText"
              style={{display: 'none'}}
            >
              {confirmationText || ''}{' '}
              <a className="a-js-undo">{undoText || ''}</a>
            </p>
            <p
              className="a-fontSizeXS a-js-altText"
              style={{display: 'none'}}
            >
              {confirmationUndoText || ''}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBlock;
