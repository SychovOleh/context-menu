'use strict';
(function() {
  const getScrollbarWidth = () => {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar";

    document.body.appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);

    var widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
  }

  const changeRootClasses = (nodeElem, classToAdd, classToRemove) => {
    nodeElem.classList.remove([classToRemove]);
    nodeElem.classList.add([classToAdd]);
  }

  const topWalker = (node, testFunc, lastParent) => {
    while (node && node !== lastParent) {
      if (testFunc(node)) {
        return node;
      }
      node = node.parentNode;
    }
  }

  class ContextMenu {
    constructor(nodeForInsert = document.body, structure) {
      nodeForInsert === null ? this.nodeForInsert = document.body : this.nodeForInsert = nodeForInsert;

      this.objOfActions = {};
      this.menu = this.buildContMenuContent(structure);
      changeRootClasses(this.menu, 'context-menu', 'menu__item--parent');

      this.nodeForInsert.addEventListener('contextmenu', this.onContextMemu.bind(this));
      document.addEventListener('click', this.onClick.bind(this));
      window.addEventListener('resize', this.hide.bind(this))

      this.scrollbarWidth = getScrollbarWidth();
      this.haveNestedEls = this.menu.querySelectorAll('.menu__item--with-children');
      Array.prototype.slice.call(this.haveNestedEls).forEach((el, i) => {
        el.addEventListener('mouseenter', this.onMouseEnter.bind(this));
        el.addEventListener('mouseleave', this.onMouseLeave.bind(this));
      })

      this.colOfRightPointStart = [];
    }

    determMainPos() {
      this.colOfRightPointStart = [];
      this.menu.classList.remove('left');
      this.menu.classList.remove('right');
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
      let pxToBorderRight = this.viewportWidth - event.clientX;
      let pxToBorderBelow = this.viewportHeight - event.clientY;

      // Find the side
      if ((this.menu.clientWidth + this.scrollbarWidth) >= pxToBorderRight) {
        this.menu.style.left = (event.clientX - this.menu.clientWidth) + 'px';
        this.menu.classList.add('left');
      } else {
        this.menu.style.left = event.clientX + 'px';
        this.menu.classList.add('right');
      }

      // Find above or below
      if (this.menu.clientHeight >= pxToBorderBelow) {
        this.menu.style.top = (event.clientY - this.menu.clientHeight) + 'px';
      } else {
        this.menu.style.top = event.clientY + 'px';
      }

      // Find point of horisontal starting nested elements
      if (this.menu.classList.contains('right')) {
        this.rightPointStart = event.clientX + (this.menu.clientWidth - 1);
      } else {
        this.rightPointStart = event.clientX;
      }
      this.colOfRightPointStart.push(this.rightPointStart);

      // this.nestedIndex = 0;
    }

    determPosNestedEl(target) {
      let hasChildrenEl = target.querySelector('.menu__item--parent');
      let parentLeaf = hasChildrenEl.parentNode.parentNode;

      // determine Horisontal position
      let curHorisontStart = this.colOfRightPointStart[this.colOfRightPointStart.length - 1];
      if (parentLeaf.classList.contains('right')) {
        if (this.viewportWidth - (curHorisontStart + hasChildrenEl.clientWidth + this.scrollbarWidth) > 0) {
          let toRightOpen = target.clientWidth - 1;
          hasChildrenEl.style.left = toRightOpen + 'px';
          curHorisontStart += (hasChildrenEl.clientWidth - 1);
          hasChildrenEl.classList.add('right');
        } else {
          let toLeftOpen = hasChildrenEl.clientWidth;
          hasChildrenEl.style.left = -toLeftOpen + 'px';
          curHorisontStart -= (parentLeaf.clientWidth + (hasChildrenEl.clientWidth - 1));
          hasChildrenEl.classList.add('left');
        }
      } else {
        if (curHorisontStart - hasChildrenEl.clientWidth > 0) {
          let toLeftOpen = hasChildrenEl.clientWidth;
          hasChildrenEl.style.left = -toLeftOpen + 'px';
          curHorisontStart -= hasChildrenEl.clientWidth;
          hasChildrenEl.classList.add('left');
        } else {
          let toRightOpen = target.clientWidth - 1;
          hasChildrenEl.style.left = toRightOpen + 'px';
          curHorisontStart += (parentLeaf.clientWidth + (hasChildrenEl.clientWidth - 1));
          hasChildrenEl.classList.add('right');
        }
      }
      this.colOfRightPointStart.push(curHorisontStart);

      // determine Vertical position
      let parentOffset = parentLeaf.getBoundingClientRect();
      let targetOffset = target.getBoundingClientRect();
      let newLeafStartTopPos;

      newLeafStartTopPos = -(parentOffset.top - targetOffset.top);
      hasChildrenEl.style.top = (newLeafStartTopPos - 4) + 'px';

      let hasChildrenOffset = hasChildrenEl.getBoundingClientRect();
      let isLeafGoBot = (this.viewportHeight - hasChildrenOffset.bottom) > 0;
      if (!isLeafGoBot) {
        newLeafStartTopPos = parentLeaf.clientHeight - hasChildrenEl.clientHeight;
        hasChildrenEl.style.top = (newLeafStartTopPos - 1) + 'px';
      }
    }

    determHorisontal(hasChildrenEl, parentLeaf) {

    }
    isContextMenu() {
      if (this.menu.classList.contains('context-menu--active'))
        return true;
    }
    show() {
      this.menu.classList.add('context-menu--active');
      this.menu.style.display = 'block';
      // wheelOff.disableScroll();
    }
    hide() {
      this.menu.style.display = 'none';
      this.menu.classList.remove('context-menu--active');
      this.menu.classList.remove('left');
      this.menu.classList.remove('right');
      // wheelOff.enableScroll();
    }

    onMouseEnter(event) {
      event.target.children[1].style.display = 'block';
      this.determPosNestedEl(event.target);
    }
    onMouseLeave(event) {
      event.target.children[1].style.display = 'none';
      event.target.children[1].classList.remove('left');
      event.target.children[1].classList.remove('right');

      this.colOfRightPointStart.pop();

    }
    buildContMenuContent(contentStructure) {
      let ul = document.createElement('ul');
      ul.classList.add('menu__item--parent');
      contentStructure.forEach((el) => {
        let li = document.createElement('li');
        li.textContent = el.title;
        if (el.submenu) {
          let span = document.createElement('span');
          span.classList.add('arrow');
          span.textContent = '➤'
          li.appendChild(span);

          li.className = 'menu__item--with-children';
          li.appendChild(this.buildContMenuContent(el.submenu));
        } else {
          li.className = 'menu__item--action';
          this.objOfActions[el.title] = el.action;
        }
        ul.appendChild(li);
      })
      return ul
    }
    onContextMemu(event) {
      if (event.target === this.nodeForInsert) {
        event.preventDefault();
        if (!this.isContextMenu()) {
          this.show();
          this.nodeForInsert.appendChild(this.menu);
          this.determMainPos();
        } else {
          this.determMainPos();
        }
      }
    }
    onClick(event) {
      if (this.isContextMenu()) {
        let actions = this.menu.querySelectorAll('.menu__item--action');
        actions = [].slice.call(actions).forEach(el => {
          if (event.target === el) {
            let actionKey = el.textContent;
            this.objOfActions[actionKey]();
          }
          if (!topWalker(event.target, (curNode) => this.menu === curNode)) {
            this.hide();
          }
        })
      }
    }
  }
  window.ContextMenu = ContextMenu;
})()