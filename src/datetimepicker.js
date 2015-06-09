require('./datetimepicker.css');

var BaseScroller = require('./basescroller');

var MASK_TEMPLATE = '<div class="dp-mask"></div>';

var TEMPLATE = '<div class="dp-container"> \
  <div class="dp-header"> \
    <div class="dp-item dp-left" data-role="close">取消</div> \
    <div class="dp-item dp-center"></div> \
    <div class="dp-item dp-right" data-role="complete">完成</div> \
  </div> \
  <div class="dp-content"> \
    <div class="dp-item" data-role="year"></div> \
    <div class="dp-item" data-role="month"></div> \
    <div class="dp-item" data-role="day"></div> \
    <div class="dp-item" data-role="hour"></div> \
    <div class="dp-item" data-role="minute"></div> \
  </div> \
</div>';

var SHOW_ANIMATION_TIME = 100; // ms

var BODY = document.body;

var MASK = null;

var CURRENT_PICKER;

var NOW = new Date();

var DEFAULT_CONFIG = {
  minYear : 2000,
  maxYear : 2030,
  format : 'YYYY-MM-DD',
  value : NOW.getFullYear() + '-' + (NOW.getMonth() + 1) + '-' + NOW.getDate(),
  onComplete : function() {},
  onShow : function() {},
  onHide : function() {}
};

function each(obj, fn) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (fn.call(obj[key], key, obj[key]) === false) {
        break;
      }
    }
  }
}

function trimZero(val) {
  return val ? parseFloat(val.replace(/^0+/g, '')) : '';
}

function addZero(val) {
  val = String(val);
  return val.length < 2 ? '0' + val : val;
}

function isLeapYear(year) {
  return year % 100 != 0 && year % 4 == 0 || year % 400 == 0;
}

function getMaxDay(year, month) {
  year = parseFloat(year);
  month = parseFloat(month);
  if (month == 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return [4, 6, 9, 11].indexOf(month) >= 0 ? 30 : 31;
}

// parse Date String
function parseDate(format, value) {
  var length = value.length;

  if (format.length !== length) {
    throw 'Invalid format or value';
  }

  var result = {};
  var formatPart = '';
  var valuePart = '';

  for (var i = 0; i < length; i++) {
    var formatChar = format.charAt(i);
    var valueChar = value.charAt(i);

    if (/\D/.test(valueChar)) {
      formatPart && (result[formatPart] = valuePart);
      formatPart = valuePart = '';
      continue;
    }

    formatPart += formatChar;
    valuePart += valueChar;

    if (i == length - 1) {
      formatPart && (result[formatPart] = valuePart);
    }
  }

  return result;
}

// HTML to Element
function toElement(html) {
  var tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;
  return tempContainer.firstElementChild;
}

function getComputedStyle(el, key) {
  var computedStyle = window.getComputedStyle(el);
  return computedStyle[key] || '';
}

function removeElement(el) {
  el.parentNode.removeChild(el);
}

function renderScroller(el, data, value, fn) {
  var scroller = new BaseScroller({
    itemNumber : 7,
    data : data,
    selectedCallback : fn
  });
  scroller.appendTo(el);
  scroller.select(value);
  return scroller;
}

function tapEvent(el, fn) {
  var _VALVE = 10, _X, _Y;

  el.addEventListener('touchstart', function(e) {
    var changedTouch = e.changedTouches[0];
    _X = changedTouch.pageX;
    _Y = changedTouch.pageY;
  }, false);

  el.addEventListener('touchend', function(e) {
    var changedTouch = e.changedTouches[0];
    var _deltaX = changedTouch.pageX - _X;
    var _deltaY = changedTouch.pageY - _Y;
    if (Math.abs(_deltaX) < _VALVE && Math.abs(_deltaY) < _VALVE) {
      fn(e);
    }
  }, false);
}

function showMask() {
  if (MASK) {
    MASK.style.display = 'block';
    MASK.style.opacity = 0.5;
    return;
  }

  MASK = toElement(MASK_TEMPLATE);
  BODY.appendChild(MASK);

  setTimeout(function() {
    MASK.style.opacity = 0.5;
  }, 0);

  tapEvent(MASK, function() {
    CURRENT_PICKER && CURRENT_PICKER.hide();
  }, false);
}

function hideMask() {
  MASK.style.opacity = 0;

  setTimeout(function() {
    MASK.style.display = 'none';
  }, SHOW_ANIMATION_TIME);
}

function DatetimePicker(config) {
  var self = this;

  self.config = {};

  each(DEFAULT_CONFIG, function(key, val) {
    self.config[key] = config[key] || val;
  });
}

DatetimePicker.prototype = {
  show : function(value) {
    var self = this;
    var config = self.config;

    CURRENT_PICKER = self;

    var data = parseDate(config.format, value || config.value);
    var year = trimZero(data.YYYY);
    var month = trimZero(data.MM);
    var day = trimZero(data.DD);
    var hour = trimZero(data.HH);
    var minute = trimZero(data.II);

    if (self.container) {
      self.yearScroller && self.yearScroller.select(year);
      self.monthScroller && self.monthScroller.select(month);
      self.dayScroller && self.dayScroller.select(day);
      self.hourScroller && self.hourScroller.select(hour);
      self.minuteScroller && self.minuteScroller.select(minute);

      self.container.style.display = 'block';
      showMask();

    } else {
      var container = self.container = toElement(TEMPLATE);

      BODY.appendChild(container);

      var yearDiv = self.find('[data-role=year]');
      var monthDiv = self.find('[data-role=month]');
      var dayDiv = self.find('[data-role=day]');
      var hourDiv = self.find('[data-role=hour]');
      var minuteDiv = self.find('[data-role=minute]');

      if (year && month && day) {
        self.yearScroller = renderScroller(yearDiv, self.makeYearData(), year, function(currentYear) {
          var currentMonth = self.monthScroller.getValue();
          if (currentMonth == 2) {
            var currentDay = self.dayScroller.getValue();
            self.setDayScroller(currentYear, currentMonth, currentDay);
          }
        });
        self.monthScroller = renderScroller(monthDiv, self.makeMonthData(), month, function(currentMonth) {
          var currentYear = self.yearScroller.getValue();
          var currentDay = self.dayScroller.getValue();
          self.setDayScroller(currentYear, currentMonth, currentDay);
        });

        self.dayScroller = renderScroller(dayDiv, self.makeDayData(year, month), day);
      } else {
        removeElement(yearDiv);
        removeElement(monthDiv);
        removeElement(dayDiv);
      }

      if (hour && minute) {
        self.hourScroller = renderScroller(hourDiv, self.makeHourData(), hour);
        self.minuteScroller = renderScroller(minuteDiv, self.makeMinuteData(), minute);
      } else {
        removeElement(hourDiv);
        removeElement(minuteDiv);
      }

      tapEvent(self.find('[data-role=close]'), function(e) {
        e.preventDefault();
        self.hide();
      }, false);

      tapEvent(self.find('[data-role=complete]'), function(e) {
        e.preventDefault();
        self.complete();
        self.hide();
      }, false);

      container.style.display = 'block';
      showMask();
    }

    self.config.onShow.call(self);
  },

  makeYearData : function() {
    var self = this;
    var minYear = self.config.minYear;
    var maxYear = self.config.maxYear;
    var data = [];
    for (var i = minYear; i <= maxYear; i++) {
      data.push({name: i + '年', value: i});
    }
    return data;
  },

  makeMonthData : function() {
    var data = [];
    for (var i = 1; i <= 12; i++) {
      var val = addZero(i);
      data.push({name: val + '月', value: i});
    }
    return data;
  },

  makeDayData : function(year, month) {
    var maxDay = getMaxDay(year, month);
    var data = [];
    for (var i = 1; i <= maxDay; i++) {
      var val = addZero(i);
      data.push({name: val + '日', value: i});
    }
    return data;
  },

  makeHourData : function() {
    var data = [];
    for (var i = 0; i <= 23; i++) {
      var val = addZero(i);
      data.push({name: val + '点', value: i});
    }
    return data;
  },

  makeMinuteData : function() {
    var data = [];
    for (var i = 0; i <= 59; i++) {
      var val = addZero(i);
      data.push({name: val + '分', value: i});
    }
    return data;
  },

  setDayScroller : function(year, month, day) {
    var self = this;
    var maxDay = getMaxDay(year, month);
    if (day > maxDay) {
      day = maxDay;
    }
    self.dayScroller.destroy();
    var dayDiv = self.find('[data-role=day]');
    self.dayScroller = renderScroller(dayDiv, self.makeDayData(year, month), day);
  },

  find : function(selector) {
    return this.container.querySelector(selector);
  },

  hide : function() {
    var self = this;
    self.container.style.display = 'none';

    hideMask();

    self.config.onHide.call(self);
  },

  destroy : function() {
    var self = this;
    MASK && removeElement(MASK);
    removeElement(self.container);
    MASK = null;
    self.container = null;
  },

  complete : function() {
    var self = this;
    var config = self.config;

    var value = config.format;

    if (self.yearScroller) {
      var year = self.yearScroller.getValue();
      value = value.replace(/YYYY/, year);
    }
    if (self.monthScroller) {
      var month = self.monthScroller.getValue();
      value = value.replace(/MM/, addZero(month));
    }
    if (self.dayScroller) {
      var day = self.dayScroller.getValue();
      value = value.replace(/DD/, addZero(day));
    }
    if (self.hourScroller) {
      var hour = self.hourScroller.getValue();
      value = value.replace(/HH/, addZero(hour));
    }
    if (self.minuteScroller) {
      var minute = self.minuteScroller.getValue();
      value = value.replace(/II/, addZero(minute));
    }

    config.onComplete.call(self, value);
  }
};

DatetimePicker.tap = tapEvent;
DatetimePicker.parseDate = parseDate;
DatetimePicker.trimZero = trimZero;
DatetimePicker.addZero = addZero;

module.exports = DatetimePicker;
