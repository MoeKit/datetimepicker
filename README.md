# datetimepicker [![spm version](http://spmjs.io/badge/datetimepicker)](http://spmjs.io/package/datetimepicker)

---

H5日期时间选择器

## Install

```
$ spm install datetimepicker --save
```

## Screenshot

![Screenshot](https://t.alipayobjects.com/images/rmsweb/T1gU0fXbJnXXXXXXXX.jpg)

## Usage

```js
var DatetimePicker = require('datetimepicker');

var picker = new DatetimePicker({
  format : 'YYYY-MM-DD HH:II',
  onComplete : function(value) {
    console.log(value);
  }
});

picker.show('2015-01-01 01:01');
```

## API

### Config

* String `format` : 选择日期时间格式，支持 `YYYY-MM-DD` 、 `YYYY年MM月DD日` 、`HH:II` ，不支持 `YYYY-M-D` 、 `MM-DD HH:II` 。
* String `value` : 默认日期时间字符串，必须和 `format` 匹配。
* Number `minYear` : 最小年度，默认值为 `2000` 。
* Number `maxYear` : 最大年度，默认值为 `2030` 。
* Function `onComplete` : 完成后执行的回调函数， `value` 会按 `format` 格式化。
* Function `onShow` : 显示后时执行的回调函数。
* Function `onHide` : 隐藏后执行的回调函数。


### Method

* show([value]) : 显示控件。value为日期时间字符串，必须和 `format` 匹配。
* hide() : 隐藏控件。
* destroy() : 销毁控件，从DOM中移除。
* complete() : 完成，会触发 `onComplete` 事件。

