

// Custom Elements
customElements.define('ice-section',
  class extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById('section-template').content;
      const shadow = this.attachShadow({mode: 'open'})
        .appendChild(template.cloneNode(true));
    }
  }
);
customElements.define('ice-theory',
  class extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById('theory-template').content;
      const shadow = this.attachShadow({mode: 'open'})
        .appendChild(template.cloneNode(true));
    }
  }
);

document.addEventListener('load', () => {
  const targetWrapper = document.getElementById('iceberg');
});