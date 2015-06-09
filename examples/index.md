# Demo
---


<link href="https://a.alipayobjects.com/amui/dpl/8.7/amui.css" rel="stylesheet"/>
<div class="am-list" am-mode="flat chip">
  <div class="am-list-body">
    <a href="#" class="am-list-item" id="dateRow">
      <div class="am-list-content">
        <div class="am-list-title">日期</div>
      </div>
      <div class="am-list-extra">2015-01-23</div>
      <div class="am-list-arrow"><span class="am-icon" am-mode="arrow-horizontal"></span></div>
    </a>
    <a href="#" class="am-list-item" id="timeRow">
      <div class="am-list-content">
        <div class="am-list-title">时间</div>
      </div>
      <div class="am-list-extra">02点22分</div>
      <div class="am-list-arrow"><span class="am-icon" am-mode="arrow-horizontal"></span></div>
    </a>
    <a href="#" class="am-list-item" id="datetimeRow">
      <div class="am-list-content">
        <div class="am-list-title">日期时间</div>
      </div>
      <div class="am-list-extra">2015-04-23 02:22</div>
      <div class="am-list-arrow"><span class="am-icon" am-mode="arrow-horizontal"></span></div>
    </a>
  </div>

````javascript
var DatetimePicker = require('datetimepicker');

// 日期
var dateRow = document.getElementById('dateRow');

var datePicker = new DatetimePicker({
  format : 'YYYY-MM-DD',
  onComplete : function(value) {
    dateRow.querySelector('.am-list-extra').innerHTML = value;
  }
});

DatetimePicker.tap(dateRow, function(e) {
  e.preventDefault();
  datePicker.show(dateRow.querySelector('.am-list-extra').innerHTML);
}, false);

// 时间
var timeRow = document.getElementById('timeRow');
var timePicker = new DatetimePicker({
  format : 'HH点II分',
  onComplete : function(value) {
    timeRow.querySelector('.am-list-extra').innerHTML = value;
  }
});
DatetimePicker.tap(timeRow, function(e) {
  e.preventDefault();
  timePicker.show(timeRow.querySelector('.am-list-extra').innerHTML);
}, false);

// 日期+时间
var datetimeRow = document.getElementById('datetimeRow');
var datetimePicker = new DatetimePicker({
  format : 'YYYY-MM-DD HH:II',
  onComplete : function(value) {
    datetimeRow.querySelector('.am-list-extra').innerHTML = value;
  },
  onShow : function() {
    console.log('show');
  },
  onHide : function() {
    console.log('hide');
  }
});
DatetimePicker.tap(datetimeRow, function(e) {
  e.preventDefault();
  datetimePicker.show(datetimeRow.querySelector('.am-list-extra').innerHTML);
}, false);
````