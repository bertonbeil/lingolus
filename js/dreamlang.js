/* globals jQuery */

(function ($) {
  $.expr[":"].notmdproc = function (obj) {
    if ($(obj).data("mdproc")) {
      return false;
    } else {
      return true;
    }
  };

  function _isChar(evt) {
    if (typeof evt.which == "undefined") {
      return true;
    } else if (typeof evt.which == "number" && evt.which > 0) {
      return (
        !evt.ctrlKey
        && !evt.metaKey
        && !evt.altKey
        && evt.which != 8  // backspace
        && evt.which != 9  // tab
        && evt.which != 13 // enter
        && evt.which != 16 // shift
        && evt.which != 17 // ctrl
        && evt.which != 20 // caps lock
        && evt.which != 27 // escape
      );
    }
    return false;
  }

  function _addFormGroupFocus(element) {
    var $element = $(element);
    if (!$element.prop('disabled')) {  // this is showing as undefined on chrome but works fine on firefox??
      $element.closest(".form-group").addClass("is-focused");
    }
  }

  function _toggleDisabledState($element, state) {
    var $target;
    if ($element.hasClass('checkbox-inline') || $element.hasClass('radio-inline')) {
      $target = $element;
    } else {
      $target = $element.closest('.checkbox').length ? $element.closest('.checkbox') : $element.closest('.radio');
    }
    return $target.toggleClass('disabled', state);
  }

  function _toggleTypeFocus($input) {
    var disabledToggleType = false;
    if ($input.is($.material.options.checkboxElements) || $input.is($.material.options.radioElements)) {
      disabledToggleType = true;
    }
    $input.closest('label').hover(function () {
        var $i = $(this).find('input');
        var isDisabled = $i.prop('disabled'); // hack because the _addFormGroupFocus() wasn't identifying the property on chrome
        if (disabledToggleType) {
          _toggleDisabledState($(this), isDisabled);
        }
        if (!isDisabled) {
          _addFormGroupFocus($i);     // need to find the input so we can check disablement
        }
      },
      function () {
        _removeFormGroupFocus($(this).find('input'));
      });
  }

  function _removeFormGroupFocus(element) {
    $(element).closest(".form-group").removeClass("is-focused"); // remove class from form-group
  }

  $.material = {
    "options": {
      // These options set what will be started by $.material.init()
      "validate": true,
      "input": true,
      "ripples": true,
      "checkbox": true,
      "togglebutton": true,
      "radio": true,
      "arrive": true,
      "autofill": false,

      "withRipples": [
        ".btn:not(.btn-link)",
        ".card-image",
        ".navbar a:not(.withoutripple)",
        ".dropdown-menu a",
        ".nav-tabs a:not(.withoutripple)",
        ".withripple",
        ".pagination li:not(.active):not(.disabled) a:not(.withoutripple)"
      ].join(","),
      "inputElements": "input.form-control, textarea.form-control, select.form-control",
      "checkboxElements": ".checkbox > label > input[type=checkbox], label.checkbox-inline > input[type=checkbox]",
      "togglebuttonElements": ".togglebutton > label > input[type=checkbox]",
      "radioElements": ".radio > label > input[type=radio], label.radio-inline > input[type=radio]"
    },
    "checkbox": function (selector) {
      // Add fake-checkbox to material checkboxes
      var $input = $((selector) ? selector : this.options.checkboxElements)
        .filter(":notmdproc")
        .data("mdproc", true)
        .after("<span class='checkbox-material'><span class='check'></span></span>");

      _toggleTypeFocus($input);
    },
    "togglebutton": function (selector) {
      // Add fake-checkbox to material checkboxes
      var $input = $((selector) ? selector : this.options.togglebuttonElements)
        .filter(":notmdproc")
        .data("mdproc", true)
        .after("<span class='toggle'></span>");

      _toggleTypeFocus($input);
    },
    "radio": function (selector) {
      // Add fake-radio to material radios
      var $input = $((selector) ? selector : this.options.radioElements)
        .filter(":notmdproc")
        .data("mdproc", true)
        .after("<span class='circle'></span><span class='check'></span>");

      _toggleTypeFocus($input);
    },
    "input": function (selector) {
      $((selector) ? selector : this.options.inputElements)
        .filter(":notmdproc")
        .data("mdproc", true)
        .each(function () {
          var $input = $(this);

          // Requires form-group standard markup (will add it if necessary)
          var $formGroup = $input.closest(".form-group"); // note that form-group may be grandparent in the case of an input-group
          if ($formGroup.length === 0 && $input.attr('type') !== "hidden" && !$input.attr('hidden')) {
            $input.wrap("<div class='form-group'></div>");
            $formGroup = $input.closest(".form-group"); // find node after attached (otherwise additional attachments don't work)
          }

          // Legacy - Add hint label if using the old shorthand data-hint attribute on the input
          if ($input.attr("data-hint")) {
            $input.after("<p class='help-block'>" + $input.attr("data-hint") + "</p>");
            $input.removeAttr("data-hint");
          }

          // Legacy - Change input-sm/lg to form-group-sm/lg instead (preferred standard and simpler css/less variants)
          var legacySizes = {
            "input-lg": "form-group-lg",
            "input-sm": "form-group-sm"
          };
          $.each(legacySizes, function (legacySize, standardSize) {
            if ($input.hasClass(legacySize)) {
              $input.removeClass(legacySize);
              $formGroup.addClass(standardSize);
            }
          });

          // Legacy - Add label-floating if using old shorthand <input class="floating-label" placeholder="foo">
          if ($input.hasClass("floating-label")) {
            var placeholder = $input.attr("placeholder");
            $input.attr("placeholder", null).removeClass("floating-label");
            var id = $input.attr("id");
            var forAttribute = "";
            if (id) {
              forAttribute = "for='" + id + "'";
            }
            $formGroup.addClass("label-floating");
            $input.after("<label " + forAttribute + "class='control-label'>" + placeholder + "</label>");
          }

          // Set as empty if is empty (damn I must improve this...)
          if ($input.val() === null || $input.val() == "undefined" || $input.val() === "") {
            $formGroup.addClass("is-empty");
          }

          // Support for file input
          if ($formGroup.find("input[type=file]").length > 0) {
            $formGroup.addClass("is-fileinput");
          }
        });
    },
    "attachInputEventHandlers": function () {
      var validate = this.options.validate;

      $(document)
        .on("keydown paste", ".form-control", function (e) {
          if (_isChar(e)) {
            $(this).closest(".form-group").removeClass("is-empty");
          }
        })
        .on("keyup change", ".form-control", function () {
          var $input = $(this);
          var $formGroup = $input.closest(".form-group");
          var isValid = (typeof $input[0].checkValidity === "undefined" || $input[0].checkValidity());

          if ($input.val() === "") {
            $formGroup.addClass("is-empty");
          }
          else {
            $formGroup.removeClass("is-empty");
          }

          if (validate) {
            if (isValid) {
              $formGroup.removeClass("has-error");
            }
            else {
              $formGroup.addClass("has-error");
            }
          }
        })
        .on("focus", ".form-control, .form-group.is-fileinput", function () {
          _addFormGroupFocus(this);
        })
        .on("blur", ".form-control, .form-group.is-fileinput", function () {
          _removeFormGroupFocus(this);
        })
        .on("change", ".form-group input", function () {
          var $input = $(this);
          if ($input.attr("type") == "file") {
            return;
          }
          var $formGroup = $input.closest(".form-group");
          var value = $input.val();
          if (value) {
            $formGroup.removeClass("is-empty");
          } else {
            $formGroup.addClass("is-empty");
          }
        })
        .on("change", ".form-group.is-fileinput input[type='file']", function () {
          var $input = $(this);
          var $formGroup = $input.closest(".form-group");
          var value = "";
          $.each(this.files, function (i, file) {
            value += file.name + ", ";
          });
          value = value.substring(0, value.length - 2);
          if (value) {
            $formGroup.removeClass("is-empty");
          } else {
            $formGroup.addClass("is-empty");
          }
          $formGroup.find("input.form-control[readonly]").val(value);
        });
    },
    "ripples": function (selector) {
      $((selector) ? selector : this.options.withRipples).ripples();
    },
    "autofill": function () {
      var loading = setInterval(function () {
        $("input[type!=checkbox]").each(function () {
          var $this = $(this);
          if ($this.val() && $this.val() !== $this.attr("value")) {
            $this.trigger("change");
          }
        });
      }, 100);

      setTimeout(function () {
        clearInterval(loading);
      }, 10000);
    },
    "attachAutofillEventHandlers": function () {
      // Listen on inputs of the focused form (because user can select from the autofill dropdown only when the input has focus)
      var focused;
      $(document)
        .on("focus", "input", function () {
          var $inputs = $(this).parents("form").find("input").not("[type=file]");
          focused = setInterval(function () {
            $inputs.each(function () {
              var $this = $(this);
              if ($this.val() !== $this.attr("value")) {
                $this.trigger("change");
              }
            });
          }, 100);
        })
        .on("blur", ".form-group input", function () {
          clearInterval(focused);
        });
    },
    "init": function (options) {
      this.options = $.extend({}, this.options, options);
      var $document = $(document);

      if ($.fn.ripples && this.options.ripples) {
        this.ripples();
      }
      if (this.options.input) {
        this.input();
        this.attachInputEventHandlers();
      }
      if (this.options.checkbox) {
        this.checkbox();
      }
      if (this.options.togglebutton) {
        this.togglebutton();
      }
      if (this.options.radio) {
        this.radio();
      }
      if (this.options.autofill) {
        this.autofill();
        this.attachAutofillEventHandlers();
      }

      if (document.arrive && this.options.arrive) {
        if ($.fn.ripples && this.options.ripples) {
          $document.arrive(this.options.withRipples, function () {
            $.material.ripples($(this));
          });
        }
        if (this.options.input) {
          $document.arrive(this.options.inputElements, function () {
            $.material.input($(this));
          });
        }
        if (this.options.checkbox) {
          $document.arrive(this.options.checkboxElements, function () {
            $.material.checkbox($(this));
          });
        }
        if (this.options.radio) {
          $document.arrive(this.options.radioElements, function () {
            $.material.radio($(this));
          });
        }
        if (this.options.togglebutton) {
          $document.arrive(this.options.togglebuttonElements, function () {
            $.material.togglebutton($(this));
          });
        }

      }
    }
  };

})(jQuery);


(function($, window, document, undefined) {

  "use strict";
  var ripples = "ripples";
  var self = null;
  var defaults = {};

  function Ripples(element, options) {
    self = this;
    this.element = $(element);
    this.options = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = ripples;

    this.init();
  }


//Initialize the plugin
  Ripples.prototype.init = function() {
    var $element  = this.element;

    $element.on("click", function(event) {

      if(self.isTouch() && event.type === "mousedown") {
        return;
      }
      if(!($element.find(".ripple-container").length)) {
        $element.append('<div class="ripple-container"></div>');
      }
      var $wrapper = $element.children(".ripple-container");
      var relY = self.getRelY($wrapper, event);
      var relX = self.getRelX($wrapper, event);
      if(!relY && !relX) {
        return;
      }

      var rippleColor = self.getRipplesColor($element);
      var $ripple = $("<div></div>");

      $ripple
      .addClass("ripple")
      .css({
        "left": relX,
        "top": relY,
        "background-color": rippleColor
      });

      $wrapper.append($ripple);

      (function() { return window.getComputedStyle($ripple[0]).opacity; })();

      self.rippleOn($element, $ripple);

      setTimeout(function() {
        self.rippleEnd($ripple);
      }, 500);

      $element.on("mouseup mouseleave touchend", function() {
        $ripple.data("mousedown", "off");

        if($ripple.data("animating") === "off") {
          self.rippleOut($ripple);
        }
      });

    });
  };

  Ripples.prototype.getNewSize = function($element, $ripple) {

    return (Math.max($element.outerWidth(), $element.outerHeight()) / $ripple.outerWidth()) * 2.5;
  };

  Ripples.prototype.getRelX = function($wrapper,  event) {
    var wrapperOffset = $wrapper.offset();

    if(!self.isTouch()) {
      return event.pageX - wrapperOffset.left;
    } else {
      event = event.originalEvent;
      if(event.touches.length === 1) {
        return event.touches[0].pageX - wrapperOffset.left;
      }
      return false;
    }
  };

  Ripples.prototype.getRelY = function($wrapper, event) {
    var wrapperOffset = $wrapper.offset();

    if(!self.isTouch()) {
      return event.pageY - wrapperOffset.top;
    } else {
      event = event.originalEvent;
      if(event.touches.length === 1) {
        return event.touches[0].pageY - wrapperOffset.top;
      }
      return false;
    }
  };

  Ripples.prototype.getRipplesColor = function($element) {
    var color = $element.data("ripple-color") ? $element.data("ripple-color") : window.getComputedStyle($element[0]).color;
    return color;
  };

  Ripples.prototype.hasTransitionSupport = function() {
    var thisBody  = document.body || document.documentElement;
    var thisStyle = thisBody.style;

    var support = (
      thisStyle.transition !== undefined ||
      thisStyle.WebkitTransition !== undefined ||
      thisStyle.MozTransition !== undefined ||
      thisStyle.MsTransition !== undefined ||
      thisStyle.OTransition !== undefined
    );

    return support;
  };

  Ripples.prototype.isTouch = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  Ripples.prototype.rippleEnd = function($ripple) {
    $ripple.data("animating", "off");

    if($ripple.data("mousedown") === "off") {
      self.rippleOut($ripple);
    }
  };

  Ripples.prototype.rippleOut = function($ripple) {
    $ripple.off();

    if(self.hasTransitionSupport()) {
      $ripple.addClass("ripple-out");
    } else {
      $ripple.animate({"opacity": 0}, 100, function() {
        $ripple.trigger("transitionend");
      });
    }

    $ripple.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
      $ripple.remove();
    });
  };

  Ripples.prototype.rippleOn = function($element, $ripple) {
    var size = self.getNewSize($element, $ripple);

    if(self.hasTransitionSupport()) {
      $ripple
      .css({
        "-ms-transform": "scale(" + size + ")",
        "-moz-transform": "scale(" + size + ")",
        "-webkit-transform": "scale(" + size + ")",
        "transform": "scale(" + size + ")"
      })
      .addClass("ripple-on")
      .data("animating", "on")
      .data("mousedown", "on");
    } else {
      $ripple.animate({
        "width": Math.max($element.outerWidth(), $element.outerHeight()) * 2,
        "height": Math.max($element.outerWidth(), $element.outerHeight()) * 2,
        "margin-left": Math.max($element.outerWidth(), $element.outerHeight()) * (-1),
        "margin-top": Math.max($element.outerWidth(), $element.outerHeight()) * (-1),
        "opacity": 0.1
      }, 500, function() {
        $ripple.trigger("transitionend");
      });
    }
  };

  $.fn.ripples = function(options) {
    return this.each(function() {
      if(!$.data(this, "plugin_" + ripples)) {
        $.data(this, "plugin_" + ripples, new Ripples(this, options));
      }
    });
  };

})(jQuery, window, document);

$(function() {
    $.material.init();
});



$('.hamburger').click(function () {

  // console.log( $(this).attr('aria-expanded') );

  if( $(this).hasClass('is-active') ) {
      $(this).removeClass('is-active');
  } else {
    $(this).addClass('is-active');
  }
});
