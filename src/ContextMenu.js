'use strict';
(function() {
  const getScrollbarWidth = () => {
    let outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar";

    document.body.appendChild(outer);

    const widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    let inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);

    const widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
  }

  const scroll = {
    disableScroll() {
      if ($(document).height() > $(window).height()) {
        let scrollTop = ($('html').scrollTop()) ? $('html').scrollTop() : $('body').scrollTop();
        $('html').addClass('noscroll').css('top', -scrollTop);
      }
    },
    enableScroll() {
      let scrollTop = parseInt($('html').css('top'), 10);
      $('html').removeClass('noscroll');
      $('html,body').scrollTop(-scrollTop);
    }
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

      Array.prototype.slice.call(this.nodeForInsert).forEach((el, i) => {
        el.addEventListener('contextmenu', this.onContextMemu.bind(this));
      })
      document.addEventListener('click', this.onClick.bind(this));
      window.addEventListener('resize', this.hide.bind(this))

      this.scrollbarWidth = getScrollbarWidth();
      this.haveNestedEls = this.menu.querySelectorAll('.menu__item--with-children');
      Array.prototype.slice.call(this.haveNestedEls).forEach((el, i) => {
        el.addEventListener('mouseenter', this.onMouseEnter.bind(this));
        el.addEventListener('mouseleave', this.onMouseLeave.bind(this));
      })
    }

    determMainPos() {
      this.menu.classList.remove('left');
      this.menu.classList.remove('right');
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
      let pxToBorderRight = this.viewportWidth - event.clientX;
      let pxToBorderBelow = this.viewportHeight - event.clientY;

      // Find the side
      if ((this.menu.clientWidth + this.scrollbarWidth) < pxToBorderRight) {
        this.menu.style.left = event.clientX + 'px';
        this.menu.classList.add('right');
      } else if (event.clientX - this.menu.clientWidth > 0) {
        this.menu.style.left = (event.clientX - this.menu.clientWidth) + 'px';
        this.menu.classList.add('left');
      } else {
        this.menu.style.left = 1 + 'px';
        this.menu.classList.add('left');
      }

      // Find above or below
      if (this.menu.clientHeight >= pxToBorderBelow) {
        this.menu.style.top = (event.clientY - this.menu.clientHeight) + 'px';
      } else {
        this.menu.style.top = event.clientY + 'px';
      }
    }

    determPosNestedEl(target) {
      this.target = target;
      const newElHasChildren = target.querySelector('.menu__item--parent');
      const parentLeaf = newElHasChildren.parentNode.parentNode;

      const parentOffset = parentLeaf.getBoundingClientRect();
      const targetOffset = target.getBoundingClientRect();

      // DETERMINE HORISONTEL POSITION

      if (parentLeaf.classList.contains('right')) {
        if (this.viewportWidth - (parentOffset.right + newElHasChildren.clientWidth + this.scrollbarWidth - 1) > 0) {
          const toRightOpen = parentOffset.right - 1;
          newElHasChildren.style.left = toRightOpen + 'px';
          newElHasChildren.classList.add('right');
        } else if (parentOffset.left - newElHasChildren.clientWidth > 0) {
          const toLeftOpen = parentOffset.left;
          newElHasChildren.style.left = toLeftOpen - newElHasChildren.clientWidth + 'px';
          newElHasChildren.classList.add('left');
        } else {
          newElHasChildren.style.left = 0 + 'px';
          newElHasChildren.classList.add('left');
        }
      } else {
        if (parentOffset.left - newElHasChildren.clientWidth > 0) {
          const toLeftOpen = parentOffset.left;
          newElHasChildren.style.left = toLeftOpen - newElHasChildren.clientWidth + 'px';
          newElHasChildren.classList.add('left');
        } else if (parentOffset.right + newElHasChildren.clientWidth < this.viewportWidth - this.scrollbarWidth) {
          const toRightOpen = parentOffset.right - 1;
          newElHasChildren.style.left = toRightOpen + 'px';
          newElHasChildren.classList.add('right');
        } else {
          newElHasChildren.style.left = this.viewportWidth - this.scrollbarWidth - newElHasChildren.clientWidth + 'px';
          newElHasChildren.classList.add('right');
        }
      }

      // DETERMINE VERTICAL POSITION

      let newLeafStartTopPos = targetOffset.top;
      newElHasChildren.style.top = newLeafStartTopPos - 4 + 'px';

      let newElOffset = newElHasChildren.getBoundingClientRect();
      let isLeafGoBot = newElOffset.bottom < this.viewportHeight;
      if (!isLeafGoBot) {
        newLeafStartTopPos = newElHasChildren.clientHeight - target.clientHeight
        let posNow = newElOffset.top;
        newElHasChildren.style.top = posNow - newLeafStartTopPos + 9 + 'px';
        if (newElHasChildren.getBoundingClientRect().top < 0) {
          newElHasChildren.style.top = 0 + 'px';
        }
      }
      let timerEnter = setTimeout(() => {
        this.target.children[1].style.visibility = 'visible';
        this.target.children[1].classList.add('active');
      }, 300)
    }

    onMouseEnter(event) {
      event.target.children[1].style.visibility = 'hidden';
      event.target.children[1].style.display = 'block';
      this.determPosNestedEl(event.target);
    }
    onMouseLeave(event) {
      // let timerLeave = setTimeout(() => {
      event.target.children[1].classList.remove('active');
      event.target.children[1].style.display = 'none';
      event.target.children[1].classList.remove('left');
      event.target.children[1].classList.remove('right');
      // }, 400)
    }

    isContextMenu() {
      if (this.menu.classList.contains('context-menu--active'))
        return true;
    }
    show() {
      this.menu.classList.add('context-menu--active');
      this.menu.style.display = 'block';
      scroll.disableScroll();
      // wheelOff.disableScroll();
    }
    hide() {
      // wheelOff.enableScroll();
      this.menu.style.display = 'none';
      this.menu.classList.remove('context-menu--active');
      this.menu.classList.remove('left');
      this.menu.classList.remove('right');
      scroll.enableScroll();
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
      event.preventDefault();

      if (!this.isContextMenu()) {
        this.show();
        event.target.appendChild(this.menu);
        this.determMainPos();
      } else {
        this.determMainPos();
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