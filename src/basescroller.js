// from http://docs.spmjs.io/anima-basescroller/latest/

// 每个条目的高度
var ITEM_HEIGHT = 34;

// 留白区域高度折算成条目的数量
var BLANK_ITEM_NUMBER = 3;

// 快速拖动时的速度调节因数
var SPEED_FACTOR = 3;

// touchstart -> touchend 的间隔时间小于此值时执行滚动动画
var MAX_ANIMATION_TOUCH_MOVE_TIME = 200;

// 最长滚动动画时长
var MAX_ANIMATION_TIME = 1500;

// 回弹动画时长
var RESET_POSITION_ANIMATION_TIME = 0.2;

// 慢速拖动动画时长
var SLOW_DRAG_ANIMATION_TIME = 0.1;

// 回调函数延迟毫秒数
var CALLBACK_DELAY = 50;

var ITEM_CLASS = 'dp-scroller-item';
var SELECTED_CLASS = 'dp-selected';

var TEMPLATE =
'<div class="dp-scroller-component"> \
  <div class="dp-bg-mask"></div> \
  <div class="dp-current-indicator"></div> \
  <div class="dp-scroller"></div> \
</div>';

var BaseScroller = function(opts) {
  var tempContainer = document.createElement('div');
  tempContainer.innerHTML = TEMPLATE;
  this.scrollerComponent = tempContainer.firstElementChild;
  this.scroller = this.scrollerComponent.lastElementChild;

  opts = opts || {};

  var itemsNumber = opts.itemsNumber;
  if (itemsNumber && itemsNumber % 2 == 0) {
    throw new Error('Option itemsNumber must be odd number');
  }

  this.itemHeight = parseInt(opts.itemHeight) || ITEM_HEIGHT;
  this.blankItemNumber = itemsNumber ? (itemsNumber - 1) / 2 : BLANK_ITEM_NUMBER;

  // 留白区域高度
  this.blankEdgeHeight = this.itemHeight * this.blankItemNumber;

  // scroller 能达到的最大 translate Y 值，通过 -webkit-transform 设置
  this.maxTransitionY = this.itemHeight * (this.blankItemNumber + 1);

  var container = opts.container;
  if (container && container.nodeType == Node.ELEMENT_NODE) {
    container.appendChild(this.scrollerComponent);
  }

  this.parentHeight = this.blankEdgeHeight * 2 + this.itemHeight;

  if (opts.className) {
    this.scrollerComponent.className = opts.className + ' scroller-component';
  }

  if (opts.data) {
    this.render(opts.data);
  }

  this.callback = opts.selectedCallback;
  this._resetHeight();

  this.startYInMove = 0;
  this.touch = null;
  this._init();
}

BaseScroller.prototype = {
  currentValue: null,
  prevValue: null,

  _init: function() {
    var self = this;
    this._setTransitionDuratoin(RESET_POSITION_ANIMATION_TIME);
    this._bindEvents();
  },

  _bindEvents: function() {
    var self = this;
    var itemHeight = this.itemHeight;
    var blankEdgeHeight = this.blankEdgeHeight;
    var scroller = this.scroller;
    var parent = this.scrollerComponent;
    var parentHeight = this.parentHeight;
    var touchStartTime;

    parent.addEventListener('touchstart', function(e) {
      var changedTouch = e.changedTouches[0];
      self._setTransitionDuratoin(0);
      touchStartTime = +new Date();
      self.startY = self.startYInMove = changedTouch.clientY;
      clearTimeout(self.callbackTimer);
    }, false);

    parent.addEventListener('touchmove', function(e) {
      e.preventDefault();
      self.touch = e.changedTouches[0];
      self._setPosition();
    }, false);

    parent.addEventListener('touchend', function(e) {
      var changedTouch = e.changedTouches[0];
      var now = +new Date();
      var currentTransitionY = self._getCurrentTransitionY();
      var targetTransitionY;
      var animationTime;
      var isFlick = false;
      var offsetY = changedTouch.clientY - self.startY;
      if (offsetY == 0) {
        return;
      }

      // 快速滑动
      if (now - touchStartTime < MAX_ANIMATION_TOUCH_MOVE_TIME) {
        isFlick = true;

        // 通过速度和剩余长度可以得出动画要进行多久，固定一个时间，最长滚动多长时间
        var speed = Math.abs(offsetY) / (now - touchStartTime) / SPEED_FACTOR;

        // 计算要拖到底部或顶部需要的时间和目标位移值
        if (offsetY < 0) {
          // 向上拖动
          animationTime = Math.abs(-(self.scrollerHeight - parentHeight) - currentTransitionY) / speed;
          targetTransitionY = -(self.scrollerHeight - parentHeight) - blankEdgeHeight;
        } else {
          // 向下拖动
          animationTime = Math.abs(currentTransitionY) / speed;
          targetTransitionY = blankEdgeHeight;
        }

        // 计算实际动画执行时间
        if (animationTime > MAX_ANIMATION_TIME) {
          animationTime = MAX_ANIMATION_TIME;
          var scrollDistance = speed * animationTime;
          targetTransitionY = offsetY < 0 ?
            currentTransitionY - scrollDistance : currentTransitionY + scrollDistance;
        }


        targetTransitionY = Math.round(targetTransitionY / itemHeight) * itemHeight;
        animationTime = animationTime / 1000;
      } else {
        // 慢速拖动
        animationTime = SLOW_DRAG_ANIMATION_TIME;
        targetTransitionY = Math.round(currentTransitionY / itemHeight) * itemHeight;
      }

      // 处理滚动内容超出组件显示范围的情况
      if (targetTransitionY > blankEdgeHeight) {
        targetTransitionY = blankEdgeHeight;
      } else if (targetTransitionY < self.minTransitionY + itemHeight) {
        targetTransitionY = self.minTransitionY + itemHeight
      }

      // 如果实际滚动距离很短，使用慢速拖动的动画时间
      if (Math.abs(targetTransitionY - currentTransitionY) < blankEdgeHeight) {
        animationTime = SLOW_DRAG_ANIMATION_TIME;
      }

      self._setTransitionDuratoin(animationTime);
      self._setTransformY(targetTransitionY);

      // 获取选中元素的索引
      var index = Math.abs(targetTransitionY / itemHeight - self.blankItemNumber)
      var selectedElem = scroller.children[parseInt(index)];
      if (selectedElem) {
        self._selectElem(selectedElem);

        // 选中后回调选中值
        self.prevValue = self.currentValue;
        self.currentValue = selectedElem.dataset.value;
        if (typeof self.callback == 'function') {
          self.callbackTimer = setTimeout(function() {
            self.callback(self.currentValue, self.prevValue);
          }, CALLBACK_DELAY);
        }
      }

      self.touch = null;
    }, false);
  },

  _resetHeight: function() {
    this.scrollerHeight = this.scroller.childElementCount * this.itemHeight;
    this.minTransitionY = -(this.scrollerHeight + this.maxTransitionY - this.parentHeight);
  },

  _setPosition: function(changedTouch) {
    changedTouch = changedTouch || this.touch;
    if (!changedTouch) {
      return;
    }

    var clientY = changedTouch.clientY;
    var offsetY = clientY - this.startYInMove;

    var currentTransitionY = this._getCurrentTransitionY();
    var newClientY = currentTransitionY + offsetY;
    if (newClientY > this.maxTransitionY) {
      newClientY = this.maxTransitionY;
    } else if (newClientY < this.minTransitionY) {
      newClientY = this.minTransitionY;
    }

    this._setTransformY(newClientY);
    this.startYInMove = clientY;
  },

  _setTransitionDuratoin: function(s) {
    var value = 'all ' + s + 's ease-out';
    this.scroller.style.webkitTransition = value;
    this.scroller.style.transition = value;
  },

  _setTransformY: function(transitionY) {
    this.scroller.style.webkitTransform = 'translate3d(0, ' + transitionY + 'px, 0)';
  },

  _getCurrentTransitionY: function() {
    var transform = this.scroller.style.webkitTransform;
    return transform ? parseFloat(transform.split(',')[1].trim()) : 0;
  },

  _getRealTransitionY: function() {
    var computedStyle = window.getComputedStyle(this.scroller);
    var match = computedStyle['-webkit-transform'].match(/,\s?(-?\d+)\)/);
    if (match && match.length == 2) {
      return parseFloat(match[1]);
    } else {
      return 0;
    }
  },

  _selectElem: function(elem) {
    var lastSelectedElem = this.scroller.querySelector('.' + SELECTED_CLASS);
    if (lastSelectedElem) {
      lastSelectedElem.classList.remove(SELECTED_CLASS);
    }
    elem.classList.add(SELECTED_CLASS);
  },

  selectByIndex: function(index) {
    var scroller = this.scroller;
    if (index < 0 || index > scroller.childElementCount - 1) {
      return false;
    }

    var transitionY = this.blankEdgeHeight - this.itemHeight * index;
    this._setTransitionDuratoin(RESET_POSITION_ANIMATION_TIME);
    this._setTransformY(transitionY);

    var selectedElem = scroller.children[index];
    this._selectElem(selectedElem);
    this.prevValue = this.currentValue;
    this.currentValue = selectedElem.dataset.value;
  },

  select: function(value) {
    if (value === undefined || value === null) {
      return this;
    }

    var children = this.scroller.children;
    for (var i = 0, len = children.length; i < len; i++) {
      if (children[i].dataset.value == value) {
        this.selectByIndex(i);
        return;
      }
    }
    return this;
  },

  selectThenCallback: function(value) {
    this.select(value);
    if (typeof this.callback == 'function') {
      this.callback(this.currentValue, this.prevValue);
    }
    return this;
  },

  getValue: function() {
    return this.currentValue;
  },

  setSelectedCallback: function(callback) {
    this.callback = callback;
    return this;
  },

  render: function(data) {
    if (!data || data.length == 0 || data.constructor !== Array) {
      return false;
    }

    var html = '';
    if (data[0].constructor === Object) {
      data.forEach(function(elem) {
        html += '<div class="' + ITEM_CLASS + '" data-value="' + elem.value + '">' +
          elem.name+ '</div>';
      });
    } else {
      data.forEach(function(elem) {
        html += '<div class="' + ITEM_CLASS + '" data-value="' + elem + '">' + elem + '</div>';
      });
    }

    this.scroller.innerHTML = html;
    this._resetHeight();
    this.selectByIndex(0);
    return this;
  },

  destroy : function() {
    this.scrollerComponent.parentNode.removeChild(this.scrollerComponent);
  },

  appendTo: function(container) {
    if (container && container.nodeType == Node.ELEMENT_NODE) {
      container.appendChild(this.scrollerComponent);
      this._resetHeight();
    }
  }
};

module.exports = BaseScroller;