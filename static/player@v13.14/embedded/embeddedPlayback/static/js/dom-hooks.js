const DATA_ATTRIBUTE_NAMES = {
  onClick: "data-ws-onclick",
  tabData: "data-ws-tab",
  toggleHiddenButton: "data-ws-toggle-hidden-button",
  toggleHiddenData: "data-ws-toggle-hidden-data",
}

class GenericDomHooks {

  // TODO: Add all hooks to here - this will be the only one called:
  static initAll() {
    GenericDomHooks.setDataOnClickHooks();
    GenericDomHooks.setTabSelectorsHooks();
    GenericDomHooks.setToggleHiddenHooks();
  }

  static setDataOnClickHooks() {
    let attributeName = DATA_ATTRIBUTE_NAMES.onClick;
    document.querySelectorAll( "[" + attributeName + "]" ).forEach((el)=>{
      el.addEventListener('click',(ev)=> {
        if (ev.currentTarget instanceof Element) {
          let value = ev.currentTarget.getAttribute(attributeName);
          console.log('clicked el ' + value);
          if (window[value] && window[value] instanceof Function) {
            window[value]();
          }
        }
      });
    });
  };

  static setTabSelectorsHooks() {
    // Per tab selector click:
    function onTabSelected(tabName) {
      let tabSelectors = document.getElementsByClassName("tab-selector");
      for (const tabSelector of tabSelectors) {
        if (tabSelector.getAttribute(DATA_ATTRIBUTE_NAMES.tabData) == tabName) {
          tabSelector.className = "tab-selector selected";
        } else {
          tabSelector.className = "tab-selector";
        }
      }

      let tabSections = document.getElementsByClassName("tab-section");
      for (const tab of tabSections) {
        if (tab.getAttribute(DATA_ATTRIBUTE_NAMES.tabData) == tabName) {
          tab.className = "tab-section";
        } else {
          tab.className = "tab-section hidden";
        }
      }
    }


    let tabSelectors = document.getElementsByClassName("tab-selector");
    for (const tabSelector of tabSelectors) {
      tabSelector.addEventListener('click', function (e) {
        onTabSelected(tabSelector.getAttribute(DATA_ATTRIBUTE_NAMES.tabData));
      })
    }
  }

  static setToggleHiddenHooks() {
    let buttonAttributeName = DATA_ATTRIBUTE_NAMES.toggleHiddenButton;
    let dataAttributeName = DATA_ATTRIBUTE_NAMES.toggleHiddenData;
    document.querySelectorAll( "[" + buttonAttributeName + "]" ).forEach((el)=>{
      el.addEventListener('click',(ev)=> {
        if (ev.currentTarget instanceof Element) {
          let value = ev.currentTarget.getAttribute(buttonAttributeName);

          document.querySelectorAll( "[" + dataAttributeName + "='" + value + "']" ).forEach((elData)=>{
              if (elData instanceof Element) {
                if (elData.classList.contains('hidden')) {
                  elData.classList.remove('hidden');
                } else {
                  elData.classList.add('hidden');
                }
              }
          });
        }
      });
    });
  }

}


GenericDomHooks.initAll();
