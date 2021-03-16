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
      let options = {};
      for (let line of fileParts) {
        line = line.trim();
        // process sections
        if (currentSection === null) {
          if (sections.length == 0) {
            // process directives before sections
            if (line.startsWith(">")) {
              // special title specification syntax
              options.title = line.slice(1);
            }
            if (line.startsWith("$")) {
              const cmd = line.slice(1).trim();
              const idx = cmd.indexOf(" ");
              const name = cmd.slice(0, idx);
              const sobj = cmd.slice(idx + 1);
              options[name] = JSON.parse(sobj);
            }
          }

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
      return { sections, options };
    });

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  Promise.all([documentLoad, fetchReq])
    .then(([wrapper, iceberg]) => {
      // here, we've both requested the data and have loaded the page
      console.log(wrapper);
      console.log(iceberg);

      // we always create the title container
      const titleContainer = document.createElement('div');
      titleContainer.classList.add('title-container');
      if (iceberg.options.title) {
        const titleText = document.createElement('h1');
        titleText.innerHTML = iceberg.options.title;
        titleText.classList.add('title');
        titleContainer.appendChild(titleText);
      }
      wrapper.appendChild(titleContainer);

      if (typeof(iceberg.options.parallax) === "object") {
        let paraObj = iceberg.options.parallax;

        let zdepth = paraObj.z || paraObj.zdepth;
        let perspective = paraObj.p || paraObj.persp || paraObj.perspective;

        if (typeof(zdepth) === "number") {
          document.body.style.setProperty("--bg-z-depth", zdepth);
        }
        if (typeof(perspective) === "number") {
          document.body.style.setProperty("--bg-perspective", perspective);
        }
      }

      // if parallax is a number, calculate perspective and z-depth
      if (typeof(iceberg.options.parallax) === "number") {
        //   as a number, it represents the ratio of bgScroll/fgScroll
        let scrollRatio = iceberg.options.parallax;
        //   so a value of 0.5 would be equivalent to z:1, p:1,
        // because the ratio is determined as follows:
        //                r = p / (z + p)
        // which is the exact inverse of the scale correction
        //
        //   then, to determine values, we pick a fixed p (like 1000),
        // and calculate z as follows:
        //                z = (p / r) - p
        const p = 1000;
        const z = (p / scrollRatio) - p;

        document.body.style.setProperty("--bg-z-depth", z);
        document.body.style.setProperty("--bg-perspective", p);
      }

      function addRandSpacer(section, minSize, maxSize, row) {
        const initialSpacer = document.createElement('div');
        initialSpacer.style.gridColumn = `span ${getRandomInt(minSize, maxSize)}`;
        initialSpacer.style.gridRow = `${row} / span 1`;
        section.appendChild(initialSpacer);
      }

      for (let section of iceberg.sections) {
        const sectTag = document.createElement('ice-section');
        const sectNameSpan = document.createElement('div');
        sectNameSpan.classList.add('section-label');
        sectNameSpan.slot = 'label';
        sectNameSpan.innerHTML = section.title;
        sectTag.appendChild(sectNameSpan);

        addRandSpacer(sectTag, 0, 7, 1);

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
            addRandSpacer(sectTag, 0, 7, currentRow);
          }
        }

        wrapper.appendChild(sectTag);
      }
    })
    .then(() => {
      // at this point, the entire page is loaded; we can do fun manipulations
      
      // here, lunicode is loaded, and the page is loaded
      const luni = new Lunicode();
      luni.tools.creepify.options.top = true;
      luni.tools.creepify.options.middle = true; 
      luni.tools.creepify.options.bottom = true;
      luni.tools.creepify.options.maxHeight = 20; 
      // 0-100%. maxHeight 100 and randomization 20%: the height goes from 80 to 100. randomization 70%: height goes from 30 to 100. Default: 100
      luni.tools.creepify.options.randomization = 70;
      
      const corrupted = document.querySelectorAll(".corrupted");
      for (let node of corrupted){
        for (let text of node.childNodes) {
          if (text instanceof CharacterData){
            let str = text.data;
            // first we bend
            str = luni.tools.bent.encode(str);
            // then we add some squares
            str = luni.tools.roundsquares.encode(str);
            // then we add millions of diacritics
            str = luni.tools.creepify.encode(str);
            // then we just set it back
            text.data = str;
          }
        }
        node.classList.add("noblot");
      }
    });

})();