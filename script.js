(function() {

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

  // Actual code starts here
  const documentLoad = new Promise((res, _) => {
    let listener = () => {
      const targetWrapper = document.getElementById('iceberg');
      res(targetWrapper);

      document.removeEventListener('load', listener);
      window.removeEventListener('load', listener);
    };
    document.addEventListener('load', listener);
    window.addEventListener('load', listener);
  });

  const urlParams = new URLSearchParams(window.location.search);
  const filename = urlParams.get('file') || "data.txt";

  const fetchReq = fetch(filename, {
      method: "GET",
    })
    .then(response => response.text())
    .then(responseText => {
      // we are now parsing the data
      const fileParts = responseText.split(/\r?\n/);
      let sections = [];
      let currentSection = null;
      let currentTheory = null;
      for (let line of fileParts) {
        // process sections
        if (currentSection === null) {
          if (line.startsWith("[[")) {
            let title = line.slice(2);
            currentSection = {
              title,
              theories: []
            };
            continue;
          }
        } else {
          if (line.startsWith("]]")) {
            sections.push(currentSection);
            currentSection = null;
            continue;
          }

          // process theories
          if (currentTheory === null) {
            if (line.startsWith("{{")) {
              let title = line.slice(2);
              currentTheory = {
                title,
                description: ""
              };
              continue;
            }
          } else {
            if (line.startsWith("}}")) {
              if (currentSection === null) {
                continue;
              }

              currentSection.theories.push(currentTheory);
              currentTheory = null;
              continue;
            }

            // add description lines
            currentTheory.description += line + " ";
          }
        }
      }
      return sections;
    });

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  Promise.all([documentLoad, fetchReq])
    .then(([wrapper, sections]) => {
      // here, we've both requested the data and have loaded the page
      console.log(wrapper);
      console.log(sections);

      for (let section of sections) {
        const sectTag = document.createElement('ice-section');
        const sectNameSpan = document.createElement('span');
        sectNameSpan.slot = 'label';
        sectNameSpan.innerHTML = section.title;
        sectTag.appendChild(sectNameSpan);

        const initialSpacer = document.createElement('div');
        initialSpacer.style.gridColumn = `span ${getRandomInt(0, 7)}`;
        sectTag.appendChild(initialSpacer);

        let currentRow = 1;
        let rowCount = 0;

        for (let theory of section.theories) {
          const theoryTag = document.createElement('ice-theory');
          const theoryNameSpan = document.createElement('span');
          theoryNameSpan.slot = 'title';
          theoryNameSpan.innerHTML = theory.title;

          theoryTag.innerHTML = theory.description;
          theoryTag.prepend(theoryNameSpan);

          const randSpan = getRandomInt(0, 1/*0*/);
          theoryTag.style.gridRow = `${currentRow} / span ${randSpan < 9 ? 1 : 2}`;

          sectTag.appendChild(theoryTag);

          rowCount++;

          const chance = 
            rowCount === 1 ? 1 :
            rowCount === 2 ? 5 : 10;
          const randNextLine = getRandomInt(0, 10);
          if (randNextLine < chance) {
            rowCount = 0;
            currentRow++;
          }
        }

        wrapper.appendChild(sectTag);
      }
    });

})();