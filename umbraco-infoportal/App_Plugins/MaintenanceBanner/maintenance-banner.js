class MaintenanceBannerElement extends HTMLElement {
    async connectedCallback() {
        await this.renderBanner();

        this._timer = setInterval(() => {
            this.renderBanner();
        }, 30_000);        
    }

    disconnectedCallback() {
        clearInterval(this._timer);
    }    

    async renderBanner() {
        const message = await this.getMessage();

        if (!message?.trim()) {
            this.style.display = "none";
            return;
        } else {
            this.style.removeProperty("display");
        }

        this.innerHTML = `
            <!-- Pulsating border -->
            <style>
                @keyframes maintenancePulse {
                    0%   { box-shadow: 0 0 0 0 rgba(255,185,0,.8); }
                    70%  { box-shadow: 0 0 0 10px rgba(255,185,0,0); }
                    100% { box-shadow: 0 0 0 0 rgba(255,185,0,0); }
                }

                #maintenance-box {
                    font-weight: normal;
                    font-size: 12pt;
                    margin: 5px;
                    animation: maintenancePulse 2s infinite;
                }
            </style>
            <uui-tag id="maintenance-box" color="warning">${message}</uui-tag>
        `;
    }

    async getMessage() {
        const endpoint = "/umbraco/management/api/v1/maintenance-banner/message/";
        const response = await fetch(endpoint);

        if (!response.ok) {
            return null;
        }

        return response.json();
    }
}

customElements.define("maintenance-banner", MaintenanceBannerElement);

export default MaintenanceBannerElement;
