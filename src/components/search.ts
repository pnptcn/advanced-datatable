/// <reference lib="dom" />

class SearchOverlay extends HTMLElement {
    private searchOverlay: HTMLElement;
    private searchInput: HTMLInputElement;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        const template = document.createElement("template");
        template.innerHTML = `
            <div id="search-overlay" part="overlay">
                <input type="search" id="search-input" placeholder="Type to search...">
            </div>
        `;

        this.shadowRoot!.appendChild(template.content.cloneNode(true));
        this.searchOverlay = this.shadowRoot!.querySelector("[part=overlay]") as HTMLElement;
        this.searchInput = this.shadowRoot!.querySelector("#search-input") as HTMLInputElement;

        this.searchOverlay.style.opacity = "0";
    }

    connectedCallback() {
        this.searchInput.addEventListener("input", () => {
            const query = this.searchInput.value.toLowerCase();
            this.dispatchEvent(
                new CustomEvent("search-query", {
                    detail: query,
                    bubbles: true,
                    composed: true,
                })
            );
        });

        document.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "Enter" || event.key === "Escape") {
                this.hideOverlay();
            } else if (!this.classList.contains("visible")) {
                this.showOverlay();
            }
        });
    }

    showOverlay() {
        this.classList.add("visible");
        this.searchInput.focus();
    }

    hideOverlay() {
        this.classList.remove("visible");
        this.searchInput.blur();
    }
}

customElements.define("search-overlay", SearchOverlay);