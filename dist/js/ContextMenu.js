'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  var getScrollbarWidth = function getScrollbarWidth() {
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
  };

  var scroll = {
    disableScroll: function disableScroll() {
      if ($(document).height() > $(window).height()) {
        var scrollTop = $('html').scrollTop() ? $('html').scrollTop() : $('body').scrollTop();
        $('html').addClass('noscroll').css('top', -scrollTop);
      }
    },
    enableScroll: function enableScroll() {
      var scrollTop = parseInt($('html').css('top'), 10);
      $('html').removeClass('noscroll');
      $('html,body').scrollTop(-scrollTop);
    }
  };

  var changeRootClasses = function changeRootClasses(nodeElem, classToAdd, classToRemove) {
    nodeElem.classList.remove([classToRemove]);
    nodeElem.classList.add([classToAdd]);
  };

  var topWalker = function topWalker(node, testFunc, lastParent) {
    while (node && node !== lastParent) {
      if (testFunc(node)) {
        return node;
      }
      node = node.parentNode;
    }
  };

  var ContextMenu = function () {
    function ContextMenu() {
      var _this = this;

      var nodeForInsert = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.body;
      var structure = arguments[1];

      _classCallCheck(this, ContextMenu);

      nodeForInsert === null ? this.nodeForInsert = document.body : this.nodeForInsert = nodeForInsert;

      this.objOfActions = {};
      this.menu = this.buildContMenuContent(structure);
      changeRootClasses(this.menu, 'context-menu', 'menu__item--parent');

      Array.prototype.slice.call(this.nodeForInsert).forEach(function (el, i) {
        el.addEventListener('contextmenu', _this.onContextMemu.bind(_this));
      });
      document.addEventListener('click', this.onClick.bind(this));
      window.addEventListener('resize', this.hide.bind(this));

      this.scrollbarWidth = getScrollbarWidth();
      this.haveNestedEls = this.menu.querySelectorAll('.menu__item--with-children');
      Array.prototype.slice.call(this.haveNestedEls).forEach(function (el, i) {
        el.addEventListener('mouseenter', _this.onMouseEnter.bind(_this));
        el.addEventListener('mouseleave', _this.onMouseLeave.bind(_this));
      });
    }

    _createClass(ContextMenu, [{
      key: "determMainPos",
      value: function determMainPos() {
        this.menu.classList.remove('left');
        this.menu.classList.remove('right');
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
        var pxToBorderRight = this.viewportWidth - event.clientX;
        var pxToBorderBelow = this.viewportHeight - event.clientY;

        // Find the side
        if (this.menu.clientWidth + this.scrollbarWidth < pxToBorderRight) {
          this.menu.style.left = event.clientX + 'px';
          this.menu.classList.add('right');
        } else if (event.clientX - this.menu.clientWidth > 0) {
          this.menu.style.left = event.clientX - this.menu.clientWidth + 'px';
          this.menu.classList.add('left');
        } else {
          this.menu.style.left = 1 + 'px';
          this.menu.classList.add('left');
        }

        // Find above or below
        if (this.menu.clientHeight >= pxToBorderBelow) {
          this.menu.style.top = event.clientY - this.menu.clientHeight + 'px';
        } else {
          this.menu.style.top = event.clientY + 'px';
        }
      }
    }, {
      key: "determPosNestedEl",
      value: function determPosNestedEl(target) {
        var _this2 = this;

        this.target = target;
        var newElHasChildren = target.querySelector('.menu__item--parent');
        var parentLeaf = newElHasChildren.parentNode.parentNode;

        var parentOffset = parentLeaf.getBoundingClientRect();
        var targetOffset = target.getBoundingClientRect();

        // DETERMINE HORISONTEL POSITION

        if (parentLeaf.classList.contains('right')) {
          if (this.viewportWidth - (parentOffset.right + newElHasChildren.clientWidth + this.scrollbarWidth - 1) > 0) {
            var toRightOpen = parentOffset.right - 1;
            newElHasChildren.style.left = toRightOpen + 'px';
            newElHasChildren.classList.add('right');
          } else if (parentOffset.left - newElHasChildren.clientWidth > 0) {
            var toLeftOpen = parentOffset.left;
            newElHasChildren.style.left = toLeftOpen - newElHasChildren.clientWidth + 'px';
            newElHasChildren.classList.add('left');
          } else {
            newElHasChildren.style.left = 0 + 'px';
            newElHasChildren.classList.add('left');
          }
        } else {
          if (parentOffset.left - newElHasChildren.clientWidth > 0) {
            var _toLeftOpen = parentOffset.left;
            newElHasChildren.style.left = _toLeftOpen - newElHasChildren.clientWidth + 'px';
            newElHasChildren.classList.add('left');
          } else if (parentOffset.right + newElHasChildren.clientWidth < this.viewportWidth - this.scrollbarWidth) {
            var _toRightOpen = parentOffset.right - 1;
            newElHasChildren.style.left = _toRightOpen + 'px';
            newElHasChildren.classList.add('right');
          } else {
            newElHasChildren.style.left = this.viewportWidth - this.scrollbarWidth - newElHasChildren.clientWidth + 'px';
            newElHasChildren.classList.add('right');
          }
        }

        // DETERMINE VERTICAL POSITION

        var newLeafStartTopPos = targetOffset.top;
        newElHasChildren.style.top = newLeafStartTopPos - 4 + 'px';

        var newElOffset = newElHasChildren.getBoundingClientRect();
        var isLeafGoBot = newElOffset.bottom < this.viewportHeight;
        if (!isLeafGoBot) {
          newLeafStartTopPos = newElHasChildren.clientHeight - target.clientHeight;
          var posNow = newElOffset.top;
          newElHasChildren.style.top = posNow - newLeafStartTopPos + 9 + 'px';
          if (newElHasChildren.getBoundingClientRect().top < 0) {
            newElHasChildren.style.top = 0 + 'px';
          }
        }
        var timerEnter = setTimeout(function () {
          _this2.target.children[1].style.visibility = 'visible';
          _this2.target.children[1].classList.add('active');
        }, 300);
      }
    }, {
      key: "onMouseEnter",
      value: function onMouseEnter(event) {
        event.target.children[1].style.visibility = 'hidden';
        event.target.children[1].style.display = 'block';
        this.determPosNestedEl(event.target);
      }
    }, {
      key: "onMouseLeave",
      value: function onMouseLeave(event) {
        // let timerLeave = setTimeout(() => {
        event.target.children[1].classList.remove('active');
        event.target.children[1].style.display = 'none';
        event.target.children[1].classList.remove('left');
        event.target.children[1].classList.remove('right');
        // }, 400)
      }
    }, {
      key: "isContextMenu",
      value: function isContextMenu() {
        if (this.menu.classList.contains('context-menu--active')) return true;
      }
    }, {
      key: "show",
      value: function show() {
        this.menu.classList.add('context-menu--active');
        this.menu.style.display = 'block';
        scroll.disableScroll();
        // wheelOff.disableScroll();
      }
    }, {
      key: "hide",
      value: function hide() {
        // wheelOff.enableScroll();
        this.menu.style.display = 'none';
        this.menu.classList.remove('context-menu--active');
        this.menu.classList.remove('left');
        this.menu.classList.remove('right');
        scroll.enableScroll();
      }
    }, {
      key: "buildContMenuContent",
      value: function buildContMenuContent(contentStructure) {
        var _this3 = this;

        var ul = document.createElement('ul');
        ul.classList.add('menu__item--parent');
        contentStructure.forEach(function (el) {
          var li = document.createElement('li');
          li.textContent = el.title;
          if (el.submenu) {
            var span = document.createElement('span');
            span.classList.add('arrow');
            span.textContent = '➤';
            li.appendChild(span);

            li.className = 'menu__item--with-children';
            li.appendChild(_this3.buildContMenuContent(el.submenu));
          } else {
            li.className = 'menu__item--action';
            _this3.objOfActions[el.title] = el.action;
          }
          ul.appendChild(li);
        });
        return ul;
      }
    }, {
      key: "onContextMemu",
      value: function onContextMemu(event) {
        event.preventDefault();

        if (!this.isContextMenu()) {
          this.show();
          event.target.appendChild(this.menu);
          this.determMainPos();
        } else {
          this.determMainPos();
        }
      }
    }, {
      key: "onClick",
      value: function onClick(event) {
        var _this4 = this;

        if (this.isContextMenu()) {
          var actions = this.menu.querySelectorAll('.menu__item--action');
          actions = [].slice.call(actions).forEach(function (el) {
            if (event.target === el) {
              var actionKey = el.textContent;
              _this4.objOfActions[actionKey]();
            }
            if (!topWalker(event.target, function (curNode) {
              return _this4.menu === curNode;
            })) {
              _this4.hide();
            }
          });
        }
      }
    }]);

    return ContextMenu;
  }();

  window.ContextMenu = ContextMenu;
})();