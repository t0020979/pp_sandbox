$(document).ready(function() {

  // auto_assign sqlAkaTextarea
  $('code.sql_aka_textarea').each(function() {
    let textarea_selector = $(this).data('textarea-selector');
    $(this).html( $(textarea_selector).val() );
    $(this).html(Prism.highlightElement(this));

    $(this).on('input', function () {
      var restore = Prism.util.saveCaretPosition(this);
      $(textarea_selector).val( $(this).text() );
      $(this).html(Prism.highlightElement(this));
      restore();
    });

    $(this).on('focusout', function () {
      $(this).html($(this).text());
      $(textarea_selector).val($(this).text());
      $(this).html(Prism.highlightElement(this));
    });
  });

  sqlAkaTextareaRead = function(aka_textarea_selector = '.sql_aka_textarea') {
    $(aka_textarea_selector).each(function () {
      $(this).html($($(this).data('textarea-selector')).val());
      $(this).html(Prism.highlightElement(this));
    });
  }

  // copy for xml_aka_yaml
  // auto_assign codeAkaTextarea
  $('code.code_aka_textarea').each(function() {
    let textarea_selector = $(this).data('textarea-selector');
    $(this).html( $(textarea_selector).val() );
    $(this).html(Prism.highlightElement(this));

    $(this).on('input', function () {
      console.log('intput')
      var restore = Prism.util.saveCaretPosition(this);
      $(textarea_selector).html( $(this).text() );
      $(this).html(Prism.highlightElement(this));
      restore();
    });

    $(this).on('focusout', function () {
      console.log('--- focusout ---')
      // $(this).html($(this).text());
      $(textarea_selector).val($(this).text());
      $(this).text(Prism.highlightElement(this));
      if ($(this).data('focusout-trigger')) {
        $($(this).data('focusout-trigger')).trigger('click');
      }
    });
  });

  codeAkaTextareaRead = function(aka_textarea_selector) {
    $(aka_textarea_selector).each(function () {
      $(this).html($($(this).data('textarea-selector')).val());
      $(this).html(Prism.highlightElement(this));
    });
  }
});
